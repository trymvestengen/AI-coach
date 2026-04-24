from datetime import date as date_type
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.db import get_conn
from app.auth import get_current_user_id

router = APIRouter()


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
            SELECT id, first_name, last_name, goals, experience_level,
                   training_days_per_week, gender, birth_date, height_cm,
                   weight_kg, avatar_url
            FROM users WHERE id = %s
            """,
            (user_id,),
        )
        row = await cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {
        "id": str(row[0]),
        "first_name": row[1],
        "last_name": row[2],
        "goals": row[3] or [],
        "experience_level": row[4],
        "training_days_per_week": row[5],
        "gender": row[6],
        "birth_date": row[7].isoformat() if row[7] else None,
        "height_cm": row[8],
        "weight_kg": float(row[9]) if row[9] is not None else None,
        "avatar_url": row[10],
    }


@router.post("/users/profile")
async def upsert_user_profile(request: Request, body: UserProfileBody) -> dict:
    user_id = get_current_user_id(request)
    birth_date = date_type.fromisoformat(body.birth_date)
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
