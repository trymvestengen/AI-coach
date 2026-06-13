import datetime as _dt
from datetime import date as date_type
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.db import get_conn
from app.auth import get_current_user_id

router = APIRouter()

ALLOWED_PATCH_FIELDS = {
    "first_name", "last_name", "avatar_url",
    "goals", "experience_level", "training_days_per_week",
    "gender", "birth_date",
    "height_cm", "weight_kg",
    "activity_level", "years_training", "preferred_training_time", "max_session_duration_min",
    "injury_notes", "preference_notes",
}


class UserProfileBody(BaseModel):
    email: str
    first_name: str
    last_name: str
    goals: list[str] | None = None
    experience_level: str | None = None
    training_days_per_week: int | None = None
    gender: str | None = None
    birth_date: str | None = None
    height_cm: int | None = None
    weight_kg: float | None = None
    avatar_url: str | None = None


@router.get("/users/profile")
async def get_user_profile(request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            """
            SELECT id, email, first_name, last_name, goals, experience_level,
                   training_days_per_week, gender, birth_date, height_cm,
                   weight_kg, avatar_url, locale, persona_mode,
                   activity_level, years_training,
                   preferred_training_time, max_session_duration_min,
                   onboarding_status,
                   injury_notes, preference_notes
            FROM users WHERE id = %s
            """,
            (user_id,),
        )
        row = await cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Profile not found")

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
        "id": str(row[0]),
        "email": row[1],
        "first_name": row[2],
        "last_name": row[3],
        "goals": row[4] or [],
        "experience_level": row[5],
        "training_days_per_week": row[6],
        "gender": row[7],
        "birth_date": (row[8].isoformat() if hasattr(row[8], "isoformat") else str(row[8])) if row[8] else None,
        "height_cm": row[9],
        "weight_kg": float(row[10]) if row[10] is not None else None,
        "avatar_url": row[11],
        "locale": row[12],
        "persona_mode": row[13],
        "activity_level": row[14],
        "years_training": row[15],
        "preferred_training_time": row[16],
        "max_session_duration_min": row[17],
        "onboarding_status": row[18],
        "injury_notes": row[19],
        "preference_notes": row[20],
        "injuries": [
            {
                "id": str(r[0]),
                "body_part": r[1],
                "description": r[2],
                "severity": r[3],
                "started_at": (r[4].isoformat() if hasattr(r[4], "isoformat") else str(r[4])) if r[4] else None,
            }
            for r in injury_rows
        ],
        "preferences": [
            {"id": str(r[0]), "category": r[1], "preference": r[2]}
            for r in preference_rows
        ],
        "equipment": [r[0] for r in equipment_rows],
        "constraints": [
            {"id": str(r[0]), "type": r[1], "description": r[2]}
            for r in constraint_rows
        ],
    }


@router.patch("/users/profile")
async def patch_user_profile(request: Request, body: dict) -> dict:
    user_id = get_current_user_id(request)
    bad_keys = [k for k in body.keys() if k not in ALLOWED_PATCH_FIELDS]
    if bad_keys:
        raise HTTPException(status_code=400, detail=f"Field(s) not allowed: {bad_keys}")
    if not body:
        raise HTTPException(status_code=400, detail="Body is empty")

    set_clauses = ", ".join(f"{k} = %s" for k in body.keys())
    params = list(body.values()) + [user_id]

    async with get_conn() as conn:
        cur = await conn.execute(
            f"UPDATE users SET {set_clauses} WHERE id = %s",
            params,
        )
        if cur.rowcount == 0:
            # Ingen profil-rad å patche — surface ærlig 404, ikke masker som 204.
            raise HTTPException(status_code=404, detail="Profile not found")
        await conn.commit()

    return await get_user_profile(request)


@router.post("/users/profile")
async def upsert_user_profile(request: Request, body: UserProfileBody) -> dict:
    user_id = get_current_user_id(request)
    birth_date_val = None
    if body.birth_date:
        try:
            birth_date_val = date_type.fromisoformat(body.birth_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid birth_date format. Use YYYY-MM-DD.")
    async with get_conn() as conn:
        await conn.execute(
            """
            INSERT INTO users (
                id, email, first_name, last_name, goals, experience_level,
                training_days_per_week, gender, birth_date, height_cm,
                weight_kg, avatar_url, onboarding_status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                first_name             = EXCLUDED.first_name,
                last_name              = EXCLUDED.last_name,
                goals                  = COALESCE(EXCLUDED.goals, users.goals),
                experience_level       = COALESCE(EXCLUDED.experience_level, users.experience_level),
                training_days_per_week = COALESCE(EXCLUDED.training_days_per_week, users.training_days_per_week),
                gender                 = COALESCE(EXCLUDED.gender, users.gender),
                birth_date             = COALESCE(EXCLUDED.birth_date, users.birth_date),
                height_cm              = COALESCE(EXCLUDED.height_cm, users.height_cm),
                weight_kg              = COALESCE(EXCLUDED.weight_kg, users.weight_kg),
                avatar_url             = COALESCE(EXCLUDED.avatar_url, users.avatar_url)
            """,
            (
                user_id,
                body.email,
                body.first_name,
                body.last_name,
                body.goals,
                body.experience_level,
                body.training_days_per_week,
                body.gender,
                birth_date_val,
                body.height_cm,
                body.weight_kg,
                body.avatar_url,
                "in_progress",
            ),
        )
        await conn.commit()
    return {"ok": True}


@router.post("/users/onboarding/complete")
async def complete_onboarding(request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            """
            SELECT u.goals, u.experience_level, u.training_days_per_week,
                   u.gender, u.birth_date, u.height_cm, u.weight_kg,
                   (SELECT COUNT(*) FROM user_equipment WHERE user_id = u.id)
            FROM users u
            WHERE u.id = %s
            """,
            (user_id,),
        )
        row = await cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="User not found")

        goals, experience, days, gender, birth_date, height, weight, eq_count = row
        missing: list[str] = []
        if not goals or len(goals) == 0:
            missing.append("goals")
        if not experience:
            missing.append("experience_level")
        if days is None:
            missing.append("training_days_per_week")
        if eq_count == 0:
            missing.append("equipment")
        if not gender:
            missing.append("gender")
        if birth_date is None:
            missing.append("birth_date")
        if height is None:
            missing.append("height_cm")
        if weight is None:
            missing.append("weight_kg")
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required fields: {missing}",
            )

        await conn.execute(
            "UPDATE users SET onboarding_status = %s WHERE id = %s",
            ("complete", user_id),
        )
        await conn.commit()

    return {"ok": True, "status": "complete"}


@router.get("/users/me/stats")
async def get_user_stats(request: Request) -> dict:
    """Aggregate training stats: totals, streaks, this-week, top muscles."""
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT
                  COUNT(*)::int AS total_workouts,
                  COALESCE(SUM(ws_volume), 0)::float AS all_time_volume_kg
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
                """
                SELECT DISTINCT DATE(completed_at AT TIME ZONE 'UTC') AS d
                FROM workouts
                WHERE user_id = %s AND completed_at IS NOT NULL
                ORDER BY d DESC
                """,
                (user_id,),
            )
            dates = [r[0] for r in await cur.fetchall()]

            cur = await conn.execute(
                """
                SELECT mg AS muscle, COUNT(*)::int AS set_count
                FROM workouts w
                JOIN workout_sets ws ON ws.workout_id = w.id
                JOIN exercises e ON e.id = ws.exercise_id
                CROSS JOIN LATERAL unnest(COALESCE(e.primary_muscles, ARRAY[]::text[])) AS mg
                WHERE w.user_id = %s AND w.completed_at IS NOT NULL
                GROUP BY mg
                ORDER BY set_count DESC
                LIMIT 5
                """,
                (user_id,),
            )
            muscle_rows = await cur.fetchall()
    except Exception as e:
        print(f"[get_user_stats] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    today = _dt.date.today()

    current_streak = 0
    if dates:
        date_set = set(dates)
        start = today if today in date_set else today - _dt.timedelta(days=1)
        while start in date_set:
            current_streak += 1
            start -= _dt.timedelta(days=1)

    longest_streak = 0
    if dates:
        sorted_dates = sorted(dates)
        run = 1
        longest_streak = 1
        for i in range(1, len(sorted_dates)):
            diff = (sorted_dates[i] - sorted_dates[i - 1]).days
            if diff == 1:
                run += 1
                longest_streak = max(longest_streak, run)
            elif diff > 1:
                run = 1

    monday = today - _dt.timedelta(days=today.weekday())
    this_week_count = sum(1 for d in dates if d >= monday)

    return {
        "total_workouts": total_workouts or 0,
        "current_streak_days": current_streak,
        "longest_streak_days": longest_streak,
        "this_week_count": this_week_count,
        "all_time_volume_kg": all_time_volume or 0,
        "most_trained_muscles": [{"muscle": r[0], "set_count": r[1]} for r in muscle_rows],
    }


@router.get("/users/search")
async def search_users(q: str, request: Request) -> list:
    user_id = get_current_user_id(request)
    if len(q.strip()) < 2:
        return []
    try:
        pattern = f"%{q.strip().lower()}%"
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT id, first_name, last_name, avatar_url
                FROM users
                WHERE id <> %s
                  AND (LOWER(first_name) LIKE %s OR LOWER(last_name) LIKE %s)
                LIMIT 20
                """,
                (user_id, pattern, pattern),
            )
            rows = await cur.fetchall()
    except Exception as e:
        print(f"[search_users] DB error: {e}")
        return []
    return [
        {"id": str(r[0]), "first_name": r[1], "last_name": r[2], "avatar_url": r[3]}
        for r in rows
    ]
