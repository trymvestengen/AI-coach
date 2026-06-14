import logging
import uuid
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel, Field
from app.db import get_conn
from app.auth import get_current_user_id
from app.services.summaries import generate_workout_summary

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/workouts")
async def get_workouts(request: Request) -> list:
    """Last 50 completed workouts with aggregate stats per workout."""
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT
                  w.id,
                  w.completed_at,
                  w.started_at,
                  w.notes,
                  w.rpe,
                  wt.name AS day_name,
                  NULL AS program_name,
                  COUNT(DISTINCT ws.exercise_id)::int AS exercise_count,
                  COUNT(ws.id)::int AS set_count,
                  COALESCE(SUM(ws.reps * COALESCE(ws.weight_kg, 0)), 0)::float AS total_volume_kg,
                  EXTRACT(EPOCH FROM (w.completed_at - w.started_at))::int / 60 AS duration_min
                FROM workouts w
                LEFT JOIN workout_templates wt ON wt.id = w.template_id
                LEFT JOIN workout_sets ws ON ws.workout_id = w.id
                WHERE w.user_id = %s AND w.completed_at IS NOT NULL
                GROUP BY w.id, w.completed_at, w.started_at, w.notes, w.rpe, wt.name
                ORDER BY w.completed_at DESC
                LIMIT 50
                """,
                (user_id,),
            )
            rows = await cur.fetchall()
    except Exception:
        logger.exception("[get_workouts] failed")
        return []
    return [
        {
            "workout_id": str(r[0]),
            "completed_at": r[1].isoformat() if r[1] else None,
            "started_at": r[2].isoformat() if r[2] else None,
            "notes": r[3],
            "rpe": r[4],
            "day_name": r[5],
            "program_name": r[6],
            "exercise_count": r[7],
            "set_count": r[8],
            "total_volume_kg": r[9],
            "duration_min": int(r[10]) if r[10] is not None else None,
        }
        for r in rows
    ]


class StartWorkoutBody(BaseModel):
    template_id: str | None = None


@router.post("/workouts", status_code=201)
async def start_workout(request: Request, body: StartWorkoutBody | None = None) -> dict:
    user_id = get_current_user_id(request)
    template_id = body.template_id if body else None
    workout_id = str(uuid.uuid4())
    async with get_conn() as conn:
        if template_id is not None:
            cur = await conn.execute(
                "SELECT id FROM workout_templates WHERE id = %s AND user_id = %s",
                (template_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Template not found")
        await conn.execute(
            "INSERT INTO workouts (id, user_id, template_id) VALUES (%s, %s, %s)",
            (workout_id, user_id, template_id),
        )
        await conn.commit()
    return {"workout_id": workout_id, "template_id": template_id}


class LogSetBody(BaseModel):
    exercise_id: str = Field(min_length=1)
    set_number: int = Field(ge=1)
    reps: int = Field(ge=1)
    weight_kg: float | None = None
    rpe: int | None = Field(None, ge=1, le=10)


@router.post("/workouts/{workout_id}/sets", status_code=201)
async def log_set(workout_id: uuid.UUID, request: Request, body: LogSetBody) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM workouts WHERE id = %s AND user_id = %s AND completed_at IS NULL",
                (workout_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Workout not found or already completed")
            set_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO workout_sets (id, workout_id, exercise_id, set_number, reps, weight_kg, rpe) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s) "
                "ON CONFLICT (workout_id, exercise_id, set_number) "
                "DO UPDATE SET reps = EXCLUDED.reps, weight_kg = EXCLUDED.weight_kg, rpe = EXCLUDED.rpe "
                "RETURNING id",
                (set_id, workout_id, body.exercise_id, body.set_number, body.reps, body.weight_kg, body.rpe),
            )
            await conn.commit()
    except HTTPException:
        raise
    except Exception:
        logger.exception("[log_set] failed")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {
        "id": set_id,
        "exercise_id": body.exercise_id,
        "set_number": body.set_number,
        "reps": body.reps,
        "weight_kg": body.weight_kg,
        "rpe": body.rpe,
    }


class CompleteWorkoutBody(BaseModel):
    rpe: int | None = Field(None, ge=1, le=10)
    notes: str | None = None


@router.patch("/workouts/{workout_id}/complete")
async def complete_workout(
    workout_id: uuid.UUID, request: Request, body: CompleteWorkoutBody, background_tasks: BackgroundTasks
) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "UPDATE workouts SET completed_at = NOW(), rpe = %s, notes = %s "
                "WHERE id = %s AND user_id = %s AND completed_at IS NULL "
                "RETURNING id, completed_at",
                (body.rpe, body.notes, workout_id, user_id),
            )
            row = await cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Workout not found or already completed")
            await conn.commit()
    except HTTPException:
        raise
    except Exception:
        logger.exception("[complete_workout] failed")
        raise HTTPException(status_code=500, detail="Internal server error")
    background_tasks.add_task(generate_workout_summary, str(workout_id))
    return {"workout_id": str(row[0]), "completed_at": row[1].isoformat()}


@router.get("/workouts/in-progress")
async def get_in_progress_workout(request: Request) -> dict | None:
    """Returns the oldest uncompleted workout for the user, or null."""
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT w.id, w.started_at, w.template_id,
                       wt.name AS day_name,
                       COALESCE(
                           json_agg(
                               json_build_object(
                                   'exercise_id', ws.exercise_id,
                                   'set_number', ws.set_number,
                                   'reps', ws.reps,
                                   'weight_kg', ws.weight_kg::float
                               )
                           ) FILTER (WHERE ws.id IS NOT NULL),
                           '[]'::json
                       ) AS logged_sets,
                       COUNT(ws.id)::int AS sets_logged
                FROM workouts w
                LEFT JOIN workout_templates wt ON wt.id = w.template_id
                LEFT JOIN workout_sets ws ON ws.workout_id = w.id
                WHERE w.user_id = %s AND w.completed_at IS NULL
                GROUP BY w.id, wt.name
                ORDER BY w.started_at ASC
                LIMIT 1
                """,
                (user_id,),
            )
            row = await cur.fetchone()
    except Exception:
        logger.exception("[get_in_progress_workout] failed")
        return None
    if row is None:
        return None
    return {
        "workout_id": str(row[0]),
        "started_at": row[1].isoformat() if row[1] else None,
        "template_id": str(row[2]) if row[2] else None,
        "day_name": row[3],
        "logged_sets": row[4] or [],
        "sets_logged": row[5],
    }


@router.get("/workouts/{workout_id}/previous-sets")
async def get_previous_sets(workout_id: uuid.UUID, request: Request) -> dict:
    """For each exercise in the current workout, return the most recent prior
    completed workout's sets for that same exercise. Used for the 'Previous'
    column in the live workout view (Strong-style)."""
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            # Find the exercise IDs we care about — join through template to template_exercises.
            cur = await conn.execute(
                """
                SELECT DISTINCT te.exercise_id
                FROM workouts w
                LEFT JOIN workout_templates wt ON wt.id = w.template_id
                LEFT JOIN template_exercises te ON te.template_id = wt.id
                WHERE w.id = %s AND w.user_id = %s
                """,
                (workout_id, user_id),
            )
            exercise_ids = [r[0] for r in await cur.fetchall() if r[0]]
            if not exercise_ids:
                return {}

            # For each exercise, find the most recent OTHER completed workout
            # where the user did this exercise, then return all its sets.
            cur = await conn.execute(
                """
                WITH latest AS (
                  SELECT DISTINCT ON (ws.exercise_id)
                    ws.exercise_id, w.id AS workout_id
                  FROM workout_sets ws
                  JOIN workouts w ON w.id = ws.workout_id
                  WHERE w.user_id = %s
                    AND w.completed_at IS NOT NULL
                    AND w.id <> %s
                    AND ws.exercise_id = ANY(%s)
                  ORDER BY ws.exercise_id, w.completed_at DESC
                )
                SELECT ws.exercise_id, ws.set_number, ws.reps, ws.weight_kg::float
                FROM workout_sets ws
                JOIN latest l ON l.exercise_id = ws.exercise_id
                              AND l.workout_id = ws.workout_id
                ORDER BY ws.exercise_id, ws.set_number
                """,
                (user_id, workout_id, exercise_ids),
            )
            rows = await cur.fetchall()
    except Exception:
        logger.exception("[get_previous_sets] failed")
        return {}

    result: dict[str, list[dict]] = {}
    for ex_id, set_num, reps, weight in rows:
        result.setdefault(ex_id, []).append(
            {"set_number": set_num, "reps": reps, "weight_kg": weight}
        )
    return result


@router.delete("/workouts/{workout_id}/sets", status_code=204)
async def delete_logged_set(
    workout_id: uuid.UUID,
    request: Request,
    exercise_id: str,
    set_number: int,
) -> None:
    """Delete a logged set from an in-progress workout, identified by exercise_id + set_number."""
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM workouts WHERE id = %s AND user_id = %s AND completed_at IS NULL",
                (workout_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Workout not found or already completed")

            cur = await conn.execute(
                "DELETE FROM workout_sets "
                "WHERE workout_id = %s AND exercise_id = %s AND set_number = %s "
                "RETURNING id",
                (workout_id, exercise_id, set_number),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Set not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception:
        logger.exception("[delete_logged_set] failed")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/workouts/{workout_id}", status_code=204)
async def delete_workout(workout_id: uuid.UUID, request: Request) -> None:
    """Discard a workout (works for both in-progress and completed).
    workout_sets cascade-delete via FK."""
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM workouts WHERE id = %s AND user_id = %s RETURNING id",
                (workout_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Workout not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception:
        logger.exception("[delete_workout] failed")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/workouts/{workout_id}/share")
async def share_workout(workout_id: uuid.UUID, request: Request) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id, shared_at FROM workouts WHERE id = %s AND user_id = %s AND completed_at IS NOT NULL",
                (workout_id, user_id),
            )
            row = await cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Workout not found")
            if row[1] is not None:
                raise HTTPException(status_code=409, detail="Already shared")
            cur = await conn.execute(
                "UPDATE workouts SET shared_at = NOW() WHERE id = %s RETURNING shared_at",
                (workout_id,),
            )
            row = await cur.fetchone()
            await conn.commit()
    except HTTPException:
        raise
    except Exception:
        logger.exception("[share_workout] failed")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"shared_at": row[0].isoformat()}


@router.get("/workouts/{workout_id}")
async def get_workout(workout_id: uuid.UUID, request: Request) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT w.id, w.started_at, w.completed_at, w.template_id
                FROM workouts w
                WHERE w.id = %s AND w.user_id = %s
                """,
                (workout_id, user_id),
            )
            row = await cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Workout not found")

            cur = await conn.execute(
                "SELECT exercise_id, set_number, reps, weight_kg::float, rpe "
                "FROM workout_sets WHERE workout_id = %s ORDER BY exercise_id, set_number",
                (workout_id,),
            )
            set_rows = await cur.fetchall()

            template_id = row[3]
            day_name = None
            exercises: list[dict] = []
            if template_id:
                cur = await conn.execute(
                    "SELECT name FROM workout_templates WHERE id = %s", (template_id,),
                )
                tmpl_row = await cur.fetchone()
                day_name = tmpl_row[0] if tmpl_row else None

                cur = await conn.execute(
                    """
                    SELECT te.id, te.exercise_id, e.name, e.muscle_groups, te.position,
                           COALESCE(
                               (SELECT json_agg(
                                   json_build_object(
                                       'id', tes.id::text,
                                       'set_number', tes.set_number,
                                       'reps', tes.reps,
                                       'weight_kg', tes.weight_kg::float
                                   ) ORDER BY tes.set_number
                               )
                               FROM template_exercise_sets tes
                               WHERE tes.template_exercise_id = te.id),
                               '[]'::json
                           )
                    FROM template_exercises te
                    JOIN exercises e ON e.id = te.exercise_id
                    WHERE te.template_id = %s
                    ORDER BY te.position
                    """,
                    (template_id,),
                )
                ex_rows = await cur.fetchall()
                exercises = [
                    {
                        "id": str(r[0]),
                        "exercise_id": r[1],
                        "name": r[2],
                        "muscle_groups": r[3],
                        "order_index": r[4],
                        "sets": r[5],
                    }
                    for r in ex_rows
                ]
    except HTTPException:
        raise
    except Exception:
        logger.exception("[get_workout] failed")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {
        "workout_id": str(row[0]),
        "started_at": row[1].isoformat() if row[1] else None,
        "completed_at": row[2].isoformat() if row[2] else None,
        "template_id": str(row[3]) if row[3] else None,
        "day_name": day_name,
        "exercises": exercises,
        "logged_sets": [
            {"exercise_id": s[0], "set_number": s[1], "reps": s[2], "weight_kg": s[3], "rpe": s[4]}
            for s in set_rows
        ],
    }
