"""Tools for managing user training preferences."""
import uuid
from app.db import get_conn


async def add_preference(user_id: str, category: str, preference: str) -> dict:
    pid = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO user_preferences (id, user_id, category, preference) "
                "VALUES (%s, %s, %s, %s)",
                (pid, user_id, category, preference),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "preference_id": pid}


async def remove_preference(user_id: str, preference_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM user_preferences WHERE id = %s AND user_id = %s RETURNING id",
                (preference_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Preference not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "preference_id": preference_id}
