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
