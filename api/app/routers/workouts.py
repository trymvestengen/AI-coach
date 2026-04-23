from fastapi import APIRouter
from app.db import get_conn

router = APIRouter()

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


@router.get("/workouts")
async def get_workouts() -> list:
    async with get_conn() as conn:
        cur = await conn.execute(
            """
            SELECT w.id, w.completed_at, w.notes, w.rpe,
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
            GROUP BY w.id, w.completed_at, w.notes, w.rpe
            ORDER BY w.completed_at DESC
            LIMIT 5
            """,
            (TEST_USER_ID,),
        )
        rows = await cur.fetchall()
    return [
        {
            "workout_id": str(r[0]),
            "date": r[1].isoformat() if r[1] else None,
            "notes": r[2],
            "rpe": r[3],
            "sets": r[4] or [],
        }
        for r in rows
    ]
