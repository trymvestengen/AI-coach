"""Tools that read/write user's programs, days, and exercises."""
import uuid
from app.db import get_conn


async def create_program(user_id: str, name: str, days: list) -> dict:
    """Create a new program with days and exercises. Does NOT auto-activate.
    Use update_program with is_active=True to activate."""
    program_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO programs (id, user_id, name, is_active) "
                "VALUES (%s, %s, %s, false)",
                (program_id, user_id, name),
            )
            for i, day in enumerate(days, start=1):
                day_id = str(uuid.uuid4())
                await conn.execute(
                    "INSERT INTO program_days (id, program_id, day_number, name) "
                    "VALUES (%s, %s, %s, %s)",
                    (day_id, program_id, i, day["name"]),
                )
                for j, ex in enumerate(day.get("exercises", [])):
                    await conn.execute(
                        "INSERT INTO program_exercises "
                        "(program_day_id, exercise_id, sets, reps, weight_kg, order_index) "
                        "VALUES (%s, %s, %s, %s, %s, %s)",
                        (day_id, ex["exercise_id"], ex["sets"], ex["reps"], ex.get("weight_kg"), j),
                    )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": f"Failed to create program: {e}"}
    return {"ok": True, "program_id": program_id, "name": name, "days_count": len(days)}
