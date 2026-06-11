"""Read-only tools: exercise lookup and user workout history/progression."""
from app.db import get_conn


async def get_exercise_info(user_id: str, exercise_id: str) -> dict:
    """Return full detail for a single exercise."""
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id, name, primary_muscles, equipment, difficulty, "
                "       instructions, force, mechanic, category, "
                "       primary_muscles, secondary_muscles, image_urls "
                "FROM exercises WHERE id = %s",
                (exercise_id,),
            )
            row = await cur.fetchone()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    if row is None:
        return {"ok": False, "error": f"Exercise '{exercise_id}' not found"}
    return {
        "ok": True,
        "id": row[0],
        "name": row[1],
        "primary_muscles": row[2],
        "equipment": row[3],
        "difficulty": row[4],
        "instructions": row[5] or "",
        "force": row[6],
        "mechanic": row[7],
        "category": row[8],
        "secondary_muscles": row[10],
        "image_urls": row[11] or [],
    }


async def search_exercises(
    user_id: str,
    muscle_group: str | None = None,
    equipment: str | None = None,
    difficulty: str | None = None,
) -> dict:
    """Search exercises by filter. Returns up to 50 matches."""
    sql = "SELECT id, name, primary_muscles, equipment, difficulty FROM exercises WHERE 1=1"
    params: list = []
    if muscle_group:
        sql += " AND %s = ANY(primary_muscles)"
        params.append(muscle_group)
    if equipment:
        sql += " AND %s = ANY(equipment)"
        params.append(equipment)
    if difficulty:
        sql += " AND difficulty = %s"
        params.append(difficulty)
    sql += " ORDER BY name LIMIT 50"
    try:
        async with get_conn() as conn:
            cur = await conn.execute(sql, params)
            rows = await cur.fetchall()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {
        "ok": True,
        "exercises": [
            {
                "id": r[0],
                "name": r[1],
                "primary_muscles": r[2],
                "equipment": r[3],
                "difficulty": r[4],
            }
            for r in rows
        ],
    }


async def get_user_history(user_id: str, limit: int = 5) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT w.id, w.completed_at, w.notes, w.rpe,
                       json_agg(
                           json_build_object(
                               'exercise_id', ws.exercise_id,
                               'set_number', ws.set_number,
                               'reps', ws.reps,
                               'weight_kg', ws.weight_kg::float,
                               'rpe', ws.rpe
                           ) ORDER BY ws.exercise_id, ws.set_number
                       ) AS sets
                FROM workouts w
                JOIN workout_sets ws ON ws.workout_id = w.id
                WHERE w.user_id = %s AND w.completed_at IS NOT NULL
                GROUP BY w.id, w.completed_at, w.notes, w.rpe
                ORDER BY w.completed_at DESC
                LIMIT %s
                """,
                (user_id, limit),
            )
            rows = await cur.fetchall()
    except Exception as e:
        return {"ok": False, "error": f"Failed to fetch history: {e}"}
    data = [
        {
            "workout_id": str(r[0]),
            "date": r[1].isoformat() if r[1] else None,
            "notes": r[2],
            "rpe": r[3],
            "sets": r[4] or [],
        }
        for r in rows
    ]
    return {"ok": True, "data": data}


async def suggest_progression(user_id: str, exercise_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT w.completed_at, ws.weight_kg, ws.rpe
                FROM workout_sets ws
                JOIN workouts w ON w.id = ws.workout_id
                WHERE ws.exercise_id = %s AND w.user_id = %s AND w.completed_at IS NOT NULL
                ORDER BY w.completed_at DESC
                LIMIT 10
                """,
                (exercise_id, user_id),
            )
            rows = await cur.fetchall()
    except Exception as e:
        return {"ok": False, "exercise_id": exercise_id, "error": f"Failed to fetch progression: {e}", "suggested_weight_kg": None}

    if not rows:
        return {
            "ok": True,
            "exercise_id": exercise_id,
            "suggestion": "No history found. Start with a comfortable weight for 10 reps.",
            "suggested_weight_kg": None,
        }

    last_date = rows[0][0]
    last_rows = [r for r in rows if r[0] == last_date]
    weight = max((r[1] for r in last_rows if r[1] is not None), default=None)
    rpe_vals = [r[2] for r in last_rows if r[2] is not None]
    avg_rpe = sum(rpe_vals) / len(rpe_vals) if rpe_vals else None

    if weight is None:
        return {
            "ok": True,
            "exercise_id": exercise_id,
            "suggestion": "No weight logged yet. Log a session first.",
            "suggested_weight_kg": None,
        }

    weight = float(weight)

    if avg_rpe is None or avg_rpe >= 10:
        return {
            "ok": True,
            "exercise_id": exercise_id,
            "suggestion": f"Last session: {weight}kg. Keep the same weight.",
            "suggested_weight_kg": weight,
        }
    elif avg_rpe <= 7:
        new_weight = weight + 2.5
        return {
            "ok": True,
            "exercise_id": exercise_id,
            "suggestion": f"Last: {weight}kg at RPE {avg_rpe:.0f}. Try {new_weight}kg today!",
            "suggested_weight_kg": new_weight,
        }
    else:
        return {
            "ok": True,
            "exercise_id": exercise_id,
            "suggestion": f"Last: {weight}kg at RPE {avg_rpe:.0f}. Keep same weight.",
            "suggested_weight_kg": weight,
        }


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
