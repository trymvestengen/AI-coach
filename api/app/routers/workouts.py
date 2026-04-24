import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.db import get_conn
from app.constants import TEST_USER_ID

router = APIRouter()


@router.get("/workouts")
async def get_workouts() -> list:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT w.id, w.completed_at, w.notes, w.rpe, w.started_at,
                       json_agg(
                           json_build_object(
                               'exercise_id', ws.exercise_id,
                               'set_number', ws.set_number,
                               'reps', ws.reps,
                               'weight_kg', ws.weight_kg::float,
                               'rpe', ws.rpe
                           ) ORDER BY ws.exercise_id, ws.set_number
                       ) AS sets
                FROM workouts w
                JOIN workout_sets ws ON ws.workout_id = w.id
                WHERE w.user_id = %s AND w.completed_at IS NOT NULL
                GROUP BY w.id, w.completed_at, w.notes, w.rpe, w.started_at
                ORDER BY w.completed_at DESC
                LIMIT 20
                """,
                (TEST_USER_ID,),
            )
            rows = await cur.fetchall()
    except Exception as e:
        print(f"[get_workouts] DB error: {e}")
        return []
    return [
        {
            "workout_id": str(r[0]),
            "date": r[1].isoformat() if r[1] else None,
            "notes": r[2],
            "rpe": r[3],
            "started_at": r[4].isoformat() if r[4] else None,
            "sets": r[5] or [],
        }
        for r in rows
    ]


class StartWorkoutBody(BaseModel):
    program_day_id: str | None = None


@router.post("/workouts", status_code=201)
async def start_workout(body: StartWorkoutBody) -> dict:
    try:
        async with get_conn() as conn:
            workout_id = str(uuid.uuid4())
            # program_day_id accepted but not yet persisted — wired in Task 8
            cur = await conn.execute(
                "INSERT INTO workouts (id, user_id) VALUES (%s, %s) RETURNING id, started_at",
                (workout_id, TEST_USER_ID),
            )
            row = await cur.fetchone()
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[start_workout] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"workout_id": str(row[0]), "started_at": row[1].isoformat()}


class LogSetBody(BaseModel):
    exercise_id: str = Field(min_length=1)
    set_number: int = Field(ge=1)
    reps: int = Field(ge=1)
    weight_kg: float | None = None
    rpe: int | None = Field(None, ge=1, le=10)


@router.post("/workouts/{workout_id}/sets", status_code=201)
async def log_set(workout_id: uuid.UUID, body: LogSetBody) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM workouts WHERE id = %s AND user_id = %s AND completed_at IS NULL",
                (workout_id, TEST_USER_ID),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Workout not found or already completed")
            set_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO workout_sets (id, workout_id, exercise_id, set_number, reps, weight_kg, rpe) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (set_id, workout_id, body.exercise_id, body.set_number, body.reps, body.weight_kg, body.rpe),
            )
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[log_set] DB error: {e}")
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
async def complete_workout(workout_id: uuid.UUID, body: CompleteWorkoutBody) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "UPDATE workouts SET completed_at = NOW(), rpe = %s, notes = %s "
                "WHERE id = %s AND user_id = %s AND completed_at IS NULL "
                "RETURNING id, completed_at",
                (body.rpe, body.notes, workout_id, TEST_USER_ID),
            )
            row = await cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Workout not found or already completed")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[complete_workout] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"workout_id": str(row[0]), "completed_at": row[1].isoformat()}
