"""Coach tools for reading and logging body metrics (weight, body fat %)."""
import uuid
from app.db import get_conn


async def log_body_metric(
    user_id: str,
    weight_kg: float | None = None,
    body_fat_pct: float | None = None,
    notes: str | None = None,
) -> dict:
    """Log a body measurement when the user reports their weight or body fat %.

    At least one of weight_kg or body_fat_pct must be provided.
    Use when the user says things like 'I weigh 82kg now' or 'my BF is 18%'."""
    if weight_kg is None and body_fat_pct is None:
        return {"ok": False, "error": "Provide weight_kg or body_fat_pct"}
    metric_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "INSERT INTO body_metrics (id, user_id, weight_kg, body_fat_pct, notes) "
                "VALUES (%s, %s, %s, %s, %s) "
                "RETURNING recorded_at",
                (metric_id, user_id, weight_kg, body_fat_pct, notes),
            )
            row = await cur.fetchone()
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {
        "ok": True,
        "id": metric_id,
        "recorded_at": row[0].isoformat() if row[0] else None,
        "weight_kg": weight_kg,
        "body_fat_pct": body_fat_pct,
    }


async def get_body_metrics(user_id: str, limit: int = 20) -> dict:
    """Get user's recent body measurements (weight, body fat % over time).

    Use this when giving nutrition or weight-loss advice to know the user's trend."""
    limit = min(max(limit, 1), 100)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT recorded_at, weight_kg::float, body_fat_pct::float, notes "
                "FROM body_metrics WHERE user_id = %s "
                "ORDER BY recorded_at DESC LIMIT %s",
                (user_id, limit),
            )
            rows = await cur.fetchall()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {
        "ok": True,
        "data": [
            {
                "recorded_at": r[0].isoformat() if r[0] else None,
                "weight_kg": r[1],
                "body_fat_pct": r[2],
                "notes": r[3],
            }
            for r in rows
        ],
    }


async def get_user_stats(user_id: str) -> dict:
    """Get aggregate training stats: total workouts, current/longest streak,
    this-week count, all-time volume, top muscles trained.

    Use this when the user asks about their progress or for motivational context."""
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT
                  COUNT(*)::int,
                  COALESCE(SUM(ws_volume), 0)::float
                FROM (
                  SELECT w.id, SUM(ws.reps * COALESCE(ws.weight_kg, 0))::float AS ws_volume
                  FROM workouts w
                  LEFT JOIN workout_sets ws ON ws.workout_id = w.id
                  WHERE w.user_id = %s AND w.completed_at IS NOT NULL
                  GROUP BY w.id
                ) sub
                """,
                (user_id,),
            )
            total_workouts, all_time_volume = await cur.fetchone()

            cur = await conn.execute(
                "SELECT DISTINCT DATE(completed_at AT TIME ZONE 'UTC') "
                "FROM workouts WHERE user_id = %s AND completed_at IS NOT NULL "
                "ORDER BY 1 DESC",
                (user_id,),
            )
            dates = [r[0] for r in await cur.fetchall()]

            cur = await conn.execute(
                """
                SELECT mg, COUNT(*)::int
                FROM workouts w
                JOIN workout_sets ws ON ws.workout_id = w.id
                JOIN exercises e ON e.id = ws.exercise_id
                CROSS JOIN LATERAL unnest(COALESCE(e.primary_muscles, ARRAY[]::text[])) AS mg
                WHERE w.user_id = %s AND w.completed_at IS NOT NULL
                GROUP BY mg ORDER BY 2 DESC LIMIT 5
                """,
                (user_id,),
            )
            muscle_rows = await cur.fetchall()
    except Exception as e:
        return {"ok": False, "error": str(e)}

    import datetime as _dt
    today = _dt.date.today()
    current_streak = 0
    if dates:
        date_set = set(dates)
        start = today if today in date_set else today - _dt.timedelta(days=1)
        while start in date_set:
            current_streak += 1
            start -= _dt.timedelta(days=1)
    longest = 0
    if dates:
        sorted_d = sorted(dates)
        run = 1
        longest = 1
        for i in range(1, len(sorted_d)):
            if (sorted_d[i] - sorted_d[i - 1]).days == 1:
                run += 1
                longest = max(longest, run)
            elif (sorted_d[i] - sorted_d[i - 1]).days > 1:
                run = 1
    monday = today - _dt.timedelta(days=today.weekday())
    this_week = sum(1 for d in dates if d >= monday)

    return {
        "ok": True,
        "total_workouts": total_workouts or 0,
        "current_streak_days": current_streak,
        "longest_streak_days": longest,
        "this_week_count": this_week,
        "all_time_volume_kg": all_time_volume or 0,
        "most_trained_muscles": [{"muscle": r[0], "set_count": r[1]} for r in muscle_rows],
    }
