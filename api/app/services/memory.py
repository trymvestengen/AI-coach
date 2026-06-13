from app.tools.handlers.memory_handlers import get_user_profile, get_workout_history
from app.db import get_conn


async def get_template_summary(user_id: str) -> list[dict]:
    """Return non-archived workout templates for the user (name + exercise count)."""
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT wt.name, COUNT(te.id) AS exercise_count "
            "FROM workout_templates wt "
            "LEFT JOIN template_exercises te ON te.template_id = wt.id "
            "WHERE wt.user_id = %s AND wt.archived_at IS NULL "
            "GROUP BY wt.id, wt.name ORDER BY wt.position LIMIT 5",
            (user_id,),
        )
        rows = await cur.fetchall()
    return [{"name": r[0], "exercise_count": r[1]} for r in rows]


async def build_base_context(user_id: str) -> str:
    profile = await get_user_profile(user_id)
    workout_history_result = await get_workout_history(user_id, limit=3)
    recent_workouts = workout_history_result.get("data", [])
    templates = await get_template_summary(user_id)

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

    if templates:
        lines.append("Workout templates:")
        for t in templates:
            lines.append(f"  - {t['name']} ({t['exercise_count']} exercises)")

    if recent_workouts:
        lines.append("Recent workouts:")
        for w in recent_workouts:
            summary = w.get("coach_summary") or "(no summary)"
            lines.append(f"  - {w['started_at']}: {summary}")

    return "\n".join(lines)
