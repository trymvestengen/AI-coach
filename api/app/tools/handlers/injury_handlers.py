"""Tools for managing user's active injuries."""
import uuid
from app.db import get_conn


async def add_injury(
    user_id: str, body_part: str,
    description: str | None = None,
    severity: str | None = None,
    started_at: str | None = None,
) -> dict:
    injury_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO user_injuries (id, user_id, body_part, description, severity, started_at, is_active) "
                "VALUES (%s, %s, %s, %s, %s, %s, true)",
                (injury_id, user_id, body_part, description, severity, started_at),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "injury_id": injury_id, "body_part": body_part}


async def update_injury(
    user_id: str, injury_id: str,
    severity: str | None = None, description: str | None = None,
    is_active: bool | None = None,
) -> dict:
    updates: list[str] = []
    params: list = []
    if severity is not None:
        updates.append("severity = %s")
        params.append(severity)
    if description is not None:
        updates.append("description = %s")
        params.append(description)
    if is_active is not None:
        updates.append("is_active = %s")
        params.append(is_active)
    if not updates:
        return {"ok": False, "error": "No fields to update"}

    params.extend([injury_id, user_id])
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                f"UPDATE user_injuries SET {', '.join(updates)} "
                "WHERE id = %s AND user_id = %s RETURNING id",
                params,
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Injury not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "injury_id": injury_id}


async def remove_injury(user_id: str, injury_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "UPDATE user_injuries SET is_active = false "
                "WHERE id = %s AND user_id = %s RETURNING id",
                (injury_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Injury not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "injury_id": injury_id}
