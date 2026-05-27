from app.db import get_conn


async def get_user_profile(user_id: str) -> dict:
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT id, email, name, locale, persona_mode, goals FROM users WHERE id = %s",
            (user_id,),
        )
        row = await cur.fetchone()
        if row is None:
            return {"error": f"User {user_id} not found"}

        cur = await conn.execute(
            "SELECT id, body_part, description, severity, started_at "
            "FROM user_injuries WHERE user_id = %s AND is_active = true",
            (user_id,),
        )
        injury_rows = await cur.fetchall()

        cur = await conn.execute(
            "SELECT id, category, preference FROM user_preferences WHERE user_id = %s",
            (user_id,),
        )
        preference_rows = await cur.fetchall()

        cur = await conn.execute(
            "SELECT equipment FROM user_equipment WHERE user_id = %s",
            (user_id,),
        )
        equipment_rows = await cur.fetchall()

        cur = await conn.execute(
            "SELECT id, type, description FROM user_constraints WHERE user_id = %s",
            (user_id,),
        )
        constraint_rows = await cur.fetchall()

    return {
        "id": row[0],
        "email": row[1],
        "name": row[2],
        "locale": row[3],
        "persona_mode": row[4],
        "goals": row[5],
        "injuries": [
            {"id": r[0], "body_part": r[1], "description": r[2], "severity": r[3], "started_at": str(r[4]) if r[4] else None}
            for r in injury_rows
        ],
        "preferences": [
            {"id": r[0], "category": r[1], "preference": r[2]}
            for r in preference_rows
        ],
        "equipment": [r[0] for r in equipment_rows],
        "constraints": [
            {"id": r[0], "type": r[1], "description": r[2]}
            for r in constraint_rows
        ],
    }
