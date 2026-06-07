"""Tools that log workouts and sets."""
import uuid
from datetime import datetime, timezone

from app.db import get_conn


async def log_workout(
    user_id: str,
    exercises: list,
    notes: str | None = None,
    rpe: int | None = None,
    coach_summary: str | None = None,
) -> dict:
    workout_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO workouts (id, user_id, started_at, completed_at, notes, rpe, coach_summary) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (workout_id, user_id, datetime.now(timezone.utc), datetime.now(timezone.utc), notes, rpe, coach_summary),
            )
            for ex in exercises:
                for i, s in enumerate(ex.get("sets", []), start=1):
                    await conn.execute(
                        "INSERT INTO workout_sets "
                        "(workout_id, exercise_id, set_number, reps, weight_kg, rpe, coach_note) "
                        "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                        (
                            workout_id,
                            ex["exercise_id"],
                            i,
                            s.get("reps"),
                            s.get("weight_kg"),
                            s.get("rpe"),
                            s.get("coach_note"),
                        ),
                    )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": f"Failed to log workout: {e}", "status": "error"}
    return {"ok": True, "workout_id": workout_id, "status": "logged", "message": "Workout logged successfully"}


async def log_set_with_note(
    user_id: str,
    workout_id: str,
    exercise_id: str,
    set_number: int,
    reps: int | None = None,
    weight_kg: float | None = None,
    rpe: int | None = None,
    coach_note: str | None = None,
) -> dict:
    async with get_conn() as conn:
        cur = await conn.execute(
            "INSERT INTO workout_sets "
            "(workout_id, exercise_id, set_number, reps, weight_kg, rpe, coach_note) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (workout_id, exercise_id, set_number, reps, weight_kg, rpe, coach_note),
        )
        row = await cur.fetchone()
        await conn.commit()

    return {"ok": True, "id": row[0], "status": "logged"}
