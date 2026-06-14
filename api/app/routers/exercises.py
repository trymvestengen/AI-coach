import logging
import uuid

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from app.db import get_conn
from app.auth import get_current_user_id

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/exercises")
async def get_exercises(request: Request, muscle_group: str | None = None) -> list:
    user_id = get_current_user_id(request)
    sql = (
        "SELECT e.id, e.name, e.primary_muscles, e.equipment, e.difficulty, "
        "       e.primary_muscles, e.secondary_muscles, e.image_urls, "
        "       (e.user_id IS NOT NULL) AS is_custom, "
        "       (f.exercise_id IS NOT NULL) AS is_favorite, "
        "       MAX(w.completed_at) AS last_used "
        "FROM exercises e "
        "LEFT JOIN user_exercise_favorites f ON f.exercise_id = e.id AND f.user_id = %s "
        "LEFT JOIN workout_sets ws ON ws.exercise_id = e.id "
        "LEFT JOIN workouts w ON w.id = ws.workout_id AND w.user_id = %s "
        "WHERE (e.user_id IS NULL OR e.user_id = %s) "
    )
    params: list = [user_id, user_id, user_id]
    if muscle_group:
        sql += "AND %s = ANY(e.primary_muscles) "
        params.append(muscle_group)
    sql += "GROUP BY e.id, e.name, e.primary_muscles, e.equipment, e.difficulty, e.secondary_muscles, e.image_urls, e.user_id, f.exercise_id ORDER BY e.name"
    try:
        async with get_conn() as conn:
            cur = await conn.execute(sql, tuple(params))
            rows = await cur.fetchall()
    except Exception:
        logger.exception("[get_exercises] failed")
        return []
    return [
        {
            "id": r[0], "name": r[1], "muscle_groups": r[2], "equipment": r[3],
            "difficulty": r[4], "primary_muscles": r[5], "secondary_muscles": r[6],
            "image_urls": r[7] or [], "is_custom": r[8], "is_favorite": r[9],
            "last_used": r[10].isoformat() if r[10] else None,
        }
        for r in rows
    ]


class CustomExerciseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    primary_muscles: list[str] = Field(default_factory=list)
    equipment: list[str] = Field(default_factory=list)
    difficulty: str = "beginner"


@router.post("/exercises", status_code=201)
async def create_custom_exercise(request: Request, body: CustomExerciseCreate) -> dict:
    user_id = get_current_user_id(request)
    ex_id = f"usr-{uuid.uuid4()}"
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "INSERT INTO exercises "
                "(id, user_id, name, muscle_groups, equipment, difficulty, primary_muscles, secondary_muscles, image_urls, source) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'custom') RETURNING id, name",
                (ex_id, user_id, body.name.strip(), body.primary_muscles, body.equipment,
                 body.difficulty, body.primary_muscles, [], []),
            )
            row = await cur.fetchone()
            await conn.commit()
    except Exception:
        logger.exception("[create_custom_exercise] failed")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"id": row[0], "name": row[1], "is_custom": True}


@router.delete("/exercises/{exercise_id}", status_code=200)
async def delete_custom_exercise(exercise_id: str, request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            "DELETE FROM exercises WHERE id = %s AND user_id = %s RETURNING id",
            (exercise_id, user_id),
        )
        row = await cur.fetchone()
        await conn.commit()
    if row is None:
        raise HTTPException(status_code=404, detail="Custom exercise not found")
    return {"status": "deleted"}


@router.post("/exercises/{exercise_id}/favorite", status_code=200)
async def favorite_exercise(exercise_id: str, request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        await conn.execute(
            "INSERT INTO user_exercise_favorites (user_id, exercise_id) VALUES (%s, %s) "
            "ON CONFLICT (user_id, exercise_id) DO NOTHING",
            (user_id, exercise_id),
        )
        await conn.commit()
    return {"exercise_id": exercise_id, "is_favorite": True}


@router.delete("/exercises/{exercise_id}/favorite", status_code=200)
async def unfavorite_exercise(exercise_id: str, request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        await conn.execute(
            "DELETE FROM user_exercise_favorites WHERE user_id = %s AND exercise_id = %s",
            (user_id, exercise_id),
        )
        await conn.commit()
    return {"exercise_id": exercise_id, "is_favorite": False}


@router.get("/exercises/{exercise_id}")
async def get_exercise_by_id(exercise_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id, name, primary_muscles, equipment, difficulty, "
                "       instructions, force, mechanic, category, "
                "       primary_muscles, secondary_muscles, image_urls "
                "FROM exercises WHERE id = %s",
                (exercise_id,),
            )
            row = await cur.fetchone()
    except Exception as e:
        print(f"[get_exercise_by_id] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    if row is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return {
        "id": row[0],
        "name": row[1],
        "muscle_groups": row[2],
        "equipment": row[3],
        "difficulty": row[4],
        "instructions": row[5] or "",
        "force": row[6],
        "mechanic": row[7],
        "category": row[8],
        "primary_muscles": row[9],
        "secondary_muscles": row[10],
        "image_urls": row[11] or [],
    }


@router.get("/exercises/{exercise_id}/progression")
async def get_exercise_progression(exercise_id: str, request: Request) -> dict:
    """Per-workout best set and total volume for this exercise (last 100 workouts).

    Returns oldest-first data points so frontend charts read left-to-right naturally.
    `estimated_1rm_kg` uses the Brzycki formula (weight × 36 / (37 - reps)),
    kun for 1–12 reps (formelens gyldige område); ellers None.
    """
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT name FROM exercises WHERE id = %s",
                (exercise_id,),
            )
            ex_row = await cur.fetchone()
            if ex_row is None:
                raise HTTPException(status_code=404, detail="Exercise not found")
            exercise_name = ex_row[0]

            cur = await conn.execute(
                """
                SELECT
                  w.completed_at,
                  MAX(COALESCE(ws.weight_kg, 0))::float AS best_weight,
                  MAX(ws.reps) AS best_reps,
                  SUM(ws.reps * COALESCE(ws.weight_kg, 0))::float AS total_volume,
                  COUNT(ws.id)::int AS set_count
                FROM workout_sets ws
                JOIN workouts w ON w.id = ws.workout_id
                WHERE w.user_id = %s
                  AND ws.exercise_id = %s
                  AND w.completed_at IS NOT NULL
                GROUP BY w.id, w.completed_at
                ORDER BY w.completed_at DESC
                LIMIT 100
                """,
                (user_id, exercise_id),
            )
            rows = await cur.fetchall()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[get_exercise_progression] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    data_points = [
        {
            "completed_at": r[0].isoformat() if r[0] else None,
            "best_weight_kg": r[1],
            "best_reps": r[2],
            "total_volume_kg": r[3],
            "set_count": r[4],
            # Brzycki er kun gyldig opp til ~12 reps (over det divergerer den og gir
            # absurde verdier, f.eks. 36×vekt ved 37 reps). Ikke estimer utenfor det.
            "estimated_1rm_kg": round(r[1] * (36 / (37 - r[2])), 1) if r[1] > 0 and r[2] and 1 <= r[2] <= 12 else None,
        }
        for r in reversed(rows)
    ]
    return {
        "exercise_id": exercise_id,
        "exercise_name": exercise_name,
        "data_points": data_points,
    }
