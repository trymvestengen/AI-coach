from app.tools.handlers.memory_handlers import get_user_profile, get_workout_history
from app.db import get_conn


async def get_active_program_summary(user_id: str) -> dict | None:
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT p.name, COUNT(pd.id) AS day_count "
            "FROM programs p LEFT JOIN program_days pd ON pd.program_id = p.id "
            "WHERE p.user_id = %s AND p.is_active = true "
            "GROUP BY p.id, p.name LIMIT 1",
            (user_id,),
        )
        row = await cur.fetchone()
    if row is None:
        return None
    return {"name": row[0], "days_count": row[1]}


async def build_base_context(user_id: str) -> str:
    profile = await get_user_profile(user_id)
    workout_history_result = await get_workout_history(user_id, limit=3)
    recent_workouts = workout_history_result.get("data", [])
    program = await get_active_program_summary(user_id)

    lines: list[str] = []
    lines.append("USER CONTEXT")
    lines.append(f"Name: {profile.get('name') or 'Unknown'}")
    lines.append(f"Locale: {profile.get('locale')}")
    lines.append(f"Persona: {profile.get('persona_mode')}")
    if profile.get("goals"):
        lines.append(f"Goals: {profile['goals']}")

    if profile.get("injuries"):
        lines.append("Active injuries:")
        for inj in profile["injuries"]:
            desc = inj.get("description") or ""
            lines.append(f"  - {inj['body_part']}: {desc}".rstrip(": "))

    if profile.get("preferences"):
        lines.append("Preferences:")
        for p in profile["preferences"]:
            lines.append(f"  - {p['preference']}")

    if profile.get("equipment"):
        lines.append(f"Available equipment: {', '.join(profile['equipment'])}")

    if profile.get("constraints"):
        lines.append("Constraints:")
        for c in profile["constraints"]:
            lines.append(f"  - {c['description']}")

    if program:
        lines.append(f"Active program: {program['name']} ({program['days_count']} days/week)")

    if recent_workouts:
        lines.append("Recent workouts:")
        for w in recent_workouts:
            summary = w.get("coach_summary") or "(no summary)"
            lines.append(f"  - {w['started_at']}: {summary}")

    return "\n".join(lines)
