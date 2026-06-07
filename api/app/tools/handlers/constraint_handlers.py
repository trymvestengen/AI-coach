"""Tools for managing user training constraints."""
import uuid
from app.db import get_conn


async def add_constraint(user_id: str, type: str, description: str) -> dict:
    cid = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO user_constraints (id, user_id, type, description) "
                "VALUES (%s, %s, %s, %s)",
                (cid, user_id, type, description),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "constraint_id": cid}


async def remove_constraint(user_id: str, constraint_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM user_constraints WHERE id = %s AND user_id = %s RETURNING id",
                (constraint_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Constraint not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "constraint_id": constraint_id}
