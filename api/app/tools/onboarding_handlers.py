# api/app/tools/onboarding_handlers.py
"""Handlers for onboarding-only tools. Each handler is parameterised by user_id."""

from datetime import date as date_type
from app.db import get_conn

# Whitelist of users-table columns the onboarding flow may write.
_ALLOWED_USER_FIELDS = {
    "goals",
    "experience_level",
    "training_days_per_week",
    "weight_kg",
    "height_cm",
    "birth_date",
    "gender",
}


async def save_profile_field(user_id: str, field: str, value) -> dict:
    if field not in _ALLOWED_USER_FIELDS:
        return {"error": f"Unknown field '{field}'. Allowed: {sorted(_ALLOWED_USER_FIELDS)}"}

    if field == "birth_date" and isinstance(value, str):
        try:
            value = date_type.fromisoformat(value)
        except ValueError:
            return {"error": "birth_date must be in YYYY-MM-DD format"}

    async with get_conn() as conn:
        await conn.execute(
            f"UPDATE users SET {field} = %s WHERE id = %s",
            (value, user_id),
        )
        await conn.commit()

    return {"ok": True, "field": field}


async def add_equipment_batch(user_id: str, items: list[str]) -> dict:
    if not items:
        return {"ok": True, "count": 0}

    async with get_conn() as conn:
        for item in items:
            await conn.execute(
                "INSERT INTO user_equipment (user_id, equipment) VALUES (%s, %s) "
                "ON CONFLICT DO NOTHING",
                (user_id, item),
            )
        await conn.commit()

    return {"ok": True, "count": len(items)}


async def complete_onboarding(user_id: str) -> dict:
    async with get_conn() as conn:
        cur = await conn.execute(
            """
            SELECT u.goals, u.experience_level, u.training_days_per_week,
                   (SELECT COUNT(*) FROM user_equipment WHERE user_id = u.id)
            FROM users u
            WHERE u.id = %s
            """,
            (user_id,),
        )
        row = await cur.fetchone()
        if row is None:
            return {"error": "User not found"}

        goals, experience, days, equipment_count = row
        missing = []
        if not goals or len(goals) == 0:
            missing.append("goals")
        if not experience:
            missing.append("experience_level")
        if days is None:
            missing.append("training_days_per_week")
        if equipment_count == 0:
            missing.append("equipment")
        if missing:
            return {
                "error": (
                    f"Cannot complete onboarding — missing required fields: {missing}. "
                    f"Ask the user about these before calling complete_onboarding again."
                )
            }

        await conn.execute(
            "UPDATE users SET onboarding_status = %s WHERE id = %s",
            ("complete", user_id),
        )
        await conn.commit()

    return {"ok": True, "status": "complete"}
