from app.db import get_conn


async def get_user_profile(user_id: str) -> dict:
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT id, email, name, locale, persona_mode, goals FROM users WHERE id = %s",
            (user_id,),
        )
        row = await cur.fetchone()
        if row is None:
            return {"ok": False, "error": f"User {user_id} not found"}

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
        "ok": True,
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


async def get_workout_history(user_id: str, exercise_id: str | None = None, limit: int = 10) -> dict:
    async with get_conn() as conn:
        if exercise_id:
            cur = await conn.execute(
                "SELECT DISTINCT w.id, w.started_at, w.completed_at, w.notes, w.coach_summary "
                "FROM workouts w JOIN workout_sets ws ON ws.workout_id = w.id "
                "WHERE w.user_id = %s AND ws.exercise_id = %s "
                "ORDER BY w.started_at DESC LIMIT %s",
                (user_id, exercise_id, limit),
            )
        else:
            cur = await conn.execute(
                "SELECT id, started_at, completed_at, notes, coach_summary "
                "FROM workouts WHERE user_id = %s "
                "ORDER BY started_at DESC LIMIT %s",
                (user_id, limit),
            )
        workout_rows = await cur.fetchall()

        workouts = []
        for w in workout_rows:
            cur = await conn.execute(
                "SELECT exercise_id, set_number, reps, weight_kg, rpe, coach_note "
                "FROM workout_sets WHERE workout_id = %s ORDER BY exercise_id, set_number",
                (w[0],),
            )
            set_rows = await cur.fetchall()
            workouts.append({
                "id": w[0],
                "started_at": str(w[1]) if w[1] else None,
                "completed_at": str(w[2]) if w[2] else None,
                "notes": w[3],
                "coach_summary": w[4],
                "sets": [
                    {
                        "exercise_id": s[0],
                        "set_number": s[1],
                        "reps": s[2],
                        "weight_kg": float(s[3]) if s[3] is not None else None,
                        "rpe": s[4],
                        "coach_note": s[5],
                    }
                    for s in set_rows
                ],
            })

    return {"ok": True, "data": workouts}


async def get_progression(user_id: str, exercise_id: str, weeks: int = 12) -> dict:
    sql = """
        SELECT
          date_trunc('week', w.started_at)::date AS week_start,
          MAX(ws.weight_kg)                       AS max_weight,
          SUM(ws.weight_kg * ws.reps)             AS total_volume,
          AVG(ws.rpe)::numeric(4,2)               AS avg_rpe,
          COUNT(*)                                 AS set_count
        FROM workout_sets ws
        JOIN workouts w ON w.id = ws.workout_id
        WHERE w.user_id = %s
          AND ws.exercise_id = %s
          AND w.started_at >= now() - (%s || ' weeks')::interval
        GROUP BY week_start
        ORDER BY week_start DESC
    """
    async with get_conn() as conn:
        cur = await conn.execute(sql, (user_id, exercise_id, weeks))
        rows = await cur.fetchall()

    data = [
        {
            "week_start": str(r[0]),
            "max_weight_kg": float(r[1]) if r[1] is not None else None,
            "total_volume_kg": float(r[2]) if r[2] is not None else 0.0,
            "avg_rpe": float(r[3]) if r[3] is not None else None,
            "set_count": r[4],
        }
        for r in rows
    ]
    return {"ok": True, "data": data}


async def search_observations(
    user_id: str,
    category: str | None = None,
    days: int = 90,
    limit: int = 20,
) -> dict:
    sql = (
        "SELECT id, category, observation, confidence, created_at "
        "FROM coach_observations "
        "WHERE user_id = %s "
        "  AND created_at >= now() - (%s || ' days')::interval"
    )
    params: list = [user_id, days]
    if category:
        sql += " AND category = %s"
        params.append(category)
    sql += " ORDER BY created_at DESC LIMIT %s"
    params.append(limit)

    async with get_conn() as conn:
        cur = await conn.execute(sql, tuple(params))
        rows = await cur.fetchall()

    data = [
        {
            "id": r[0],
            "category": r[1],
            "observation": r[2],
            "confidence": r[3],
            "created_at": str(r[4]) if r[4] else None,
        }
        for r in rows
    ]
    return {"ok": True, "data": data}


VALID_OBSERVATION_CATEGORIES = {
    "pattern", "injury_hint", "preference_hint",
    "energy_level", "form_issue", "milestone", "other",
}
VALID_CONFIDENCE = {"low", "medium", "high"}


async def write_observation(
    user_id: str,
    category: str,
    observation: str,
    confidence: str = "medium",
    related_workout_id: str | None = None,
    related_session_id: str | None = None,
) -> dict:
    if category not in VALID_OBSERVATION_CATEGORIES:
        return {"ok": False, "error": f"Invalid category '{category}'. Allowed: {sorted(VALID_OBSERVATION_CATEGORIES)}"}
    if confidence not in VALID_CONFIDENCE:
        return {"ok": False, "error": f"Invalid confidence '{confidence}'. Allowed: low, medium, high"}

    async with get_conn() as conn:
        # related_workout_id / related_session_id er LLM-leverte — verifiser at de
        # tilhører brukeren før de lagres som fremmednøkler.
        if related_workout_id is not None:
            cur = await conn.execute(
                "SELECT 1 FROM workouts WHERE id = %s AND user_id = %s",
                (related_workout_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "related_workout_id not found for this user"}
        if related_session_id is not None:
            cur = await conn.execute(
                "SELECT 1 FROM coach_sessions WHERE id = %s AND user_id = %s",
                (related_session_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "related_session_id not found for this user"}

        cur = await conn.execute(
            "INSERT INTO coach_observations "
            "(user_id, category, observation, confidence, source_workout_id, source_session_id, last_confirmed_at) "
            "VALUES (%s, %s, %s, %s, %s, %s, now()) RETURNING id",
            (user_id, category, observation, confidence, related_workout_id, related_session_id),
        )
        row = await cur.fetchone()
        await conn.commit()

    return {"ok": True, "id": row[0], "status": "written"}


async def get_recent_sessions(user_id: str, days: int = 30, limit: int = 10) -> dict:
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT id, last_activity_at, summary, workout_id "
            "FROM coach_sessions "
            "WHERE user_id = %s "
            "  AND last_activity_at >= now() - (%s || ' days')::interval "
            "  AND summary IS NOT NULL "
            "ORDER BY last_activity_at DESC LIMIT %s",
            (user_id, days, limit),
        )
        rows = await cur.fetchall()

    data = [
        {
            "id": r[0],
            "last_activity_at": str(r[1]) if r[1] else None,
            "summary": r[2],
            "workout_id": r[3],
        }
        for r in rows
    ]
    return {"ok": True, "data": data}
