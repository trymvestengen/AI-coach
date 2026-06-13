"""Tools for managing user's available equipment."""
from app.db import get_conn


async def add_equipment(user_id: str, equipment: str) -> dict:
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO user_equipment (user_id, equipment) VALUES (%s, %s) "
                "ON CONFLICT DO NOTHING",
                (user_id, equipment),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "equipment": equipment}


async def remove_equipment(user_id: str, equipment: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM user_equipment WHERE user_id = %s AND equipment = %s RETURNING equipment",
                (user_id, equipment),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Equipment not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "equipment": equipment}
