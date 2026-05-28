from datetime import date as date_type
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.db import get_conn
from app.auth import get_current_user_id

router = APIRouter()

ALLOWED_PATCH_FIELDS = {
    "first_name", "last_name",
    "goals", "experience_level", "training_days_per_week",
    "height_cm", "weight_kg",
    "activity_level", "years_training", "preferred_training_time", "max_session_duration_min",
}


class UserProfileBody(BaseModel):
    email: str
    first_name: str
    last_name: str
    goals: list[str]
    experience_level: str
    training_days_per_week: int
    gender: str
    birth_date: str  # "YYYY-MM-DD"
    height_cm: int
    weight_kg: float
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
                   onboarding_status
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
        await conn.execute(
            f"UPDATE users SET {set_clauses} WHERE id = %s",
            params,
        )
        await conn.commit()

    try:
        return await get_user_profile(request)
    except HTTPException:
        from fastapi.responses import Response
        return Response(status_code=204)


@router.post("/users/profile")
async def upsert_user_profile(request: Request, body: UserProfileBody) -> dict:
    user_id = get_current_user_id(request)
    try:
        birth_date = date_type.fromisoformat(body.birth_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid birth_date format. Use YYYY-MM-DD.")
    async with get_conn() as conn:
        await conn.execute(
            """
            INSERT INTO users (
                id, email, first_name, last_name, goals, experience_level,
                training_days_per_week, gender, birth_date, height_cm,
                weight_kg, avatar_url
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                first_name             = EXCLUDED.first_name,
                last_name              = EXCLUDED.last_name,
                goals                  = EXCLUDED.goals,
                experience_level       = EXCLUDED.experience_level,
                training_days_per_week = EXCLUDED.training_days_per_week,
                gender                 = EXCLUDED.gender,
                birth_date             = EXCLUDED.birth_date,
                height_cm              = EXCLUDED.height_cm,
                weight_kg              = EXCLUDED.weight_kg,
                avatar_url             = EXCLUDED.avatar_url
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
                birth_date,
                body.height_cm,
                body.weight_kg,
                body.avatar_url,
            ),
        )
        await conn.commit()
    return {"ok": True}


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
