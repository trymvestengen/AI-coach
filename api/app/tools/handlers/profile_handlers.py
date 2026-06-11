"""Tools for managing user profile + persona."""
from app.db import get_conn

_ALLOWED = {
    "first_name", "last_name", "goals", "experience_level",
    "training_days_per_week", "height_cm", "weight_kg",
    "activity_level", "years_training", "preferred_training_time",
    "max_session_duration_min",
}


async def update_user_profile(user_id: str, **fields) -> dict:
    bad = [k for k in fields if k not in _ALLOWED]
    if bad:
        return {"ok": False, "error": f"Unknown fields: {bad}"}
    if not fields:
        return {"ok": False, "error": "No fields to update"}

    set_clauses = ", ".join(f"{k} = %s" for k in fields)
    params = list(fields.values()) + [user_id]
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                f"UPDATE users SET {set_clauses} WHERE id = %s RETURNING id",
                params,
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "User not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "updated_fields": list(fields.keys())}


async def set_persona_mode(user_id: str, mode: str) -> dict:
    if mode not in ("friend", "sergeant", "analyst"):
        return {"ok": False, "error": "Invalid mode"}
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "UPDATE users SET persona_mode = %s WHERE id = %s RETURNING id",
                (mode, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "User not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "mode": mode}
