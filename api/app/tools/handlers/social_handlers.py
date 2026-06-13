"""Tools for sharing workouts to the social feed."""
from app.db import get_conn


async def share_workout(user_id: str, workout_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT shared_at FROM workouts "
                "WHERE id = %s AND user_id = %s AND completed_at IS NOT NULL",
                (workout_id, user_id),
            )
            row = await cur.fetchone()
            if row is None:
                return {"ok": False, "error": "Workout not found or not completed"}
            if row[0] is not None:
                return {"ok": False, "error": "Already shared"}

            cur = await conn.execute(
                "UPDATE workouts SET shared_at = NOW() WHERE id = %s RETURNING shared_at",
                (workout_id,),
            )
            await cur.fetchone()
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "workout_id": workout_id}
