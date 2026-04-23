import uuid
from fastapi import APIRouter, HTTPException
from app.db import get_conn
from app.constants import TEST_USER_ID

router = APIRouter()


@router.get("/programs")
async def get_programs() -> list:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT p.id, p.name, p.is_active,
                       COUNT(pd.id)::int AS days_count
                FROM programs p
                LEFT JOIN program_days pd ON pd.program_id = p.id
                WHERE p.user_id = %s
                GROUP BY p.id, p.name, p.is_active, p.created_at
                ORDER BY p.is_active DESC, p.created_at DESC
                """,
                (TEST_USER_ID,),
            )
            rows = await cur.fetchall()
    except Exception:
        return []
    return [
        {"id": str(r[0]), "name": r[1], "is_active": r[2], "days_count": r[3]}
        for r in rows
    ]


@router.get("/programs/{program_id}")
async def get_program(program_id: uuid.UUID) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id, name, is_active FROM programs WHERE id = %s AND user_id = %s",
                (program_id, TEST_USER_ID),
            )
            prog = await cur.fetchone()
            if prog is None:
                raise HTTPException(status_code=404, detail="Program not found")

            cur = await conn.execute(
                """
                SELECT pd.id, pd.day_number, pd.name,
                       COALESCE(
                           json_agg(
                               json_build_object(
                                   'id', pe.id::text,
                                   'exercise_id', pe.exercise_id,
                                   'name', e.name,
                                   'sets', pe.sets,
                                   'reps', pe.reps,
                                   'weight_kg', pe.weight_kg::float,
                                   'muscle_groups', e.muscle_groups
                               ) ORDER BY pe.order_index
                           ) FILTER (WHERE pe.id IS NOT NULL),
                           '[]'
                       ) AS exercises
                FROM program_days pd
                LEFT JOIN program_exercises pe ON pe.program_day_id = pd.id
                LEFT JOIN exercises e ON e.id = pe.exercise_id
                WHERE pd.program_id = %s
                GROUP BY pd.id, pd.day_number, pd.name
                ORDER BY pd.day_number
                """,
                (program_id,),
            )
            day_rows = await cur.fetchall()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

    return {
        "id": str(prog[0]),
        "name": prog[1],
        "is_active": prog[2],
        "days": [
            {
                "id": str(r[0]),
                "day_number": r[1],
                "name": r[2],
                "exercises": r[3] or [],
            }
            for r in day_rows
        ],
    }


@router.get("/exercises")
async def get_exercises(muscle_group: str | None = None) -> list:
    try:
        async with get_conn() as conn:
            if muscle_group:
                cur = await conn.execute(
                    "SELECT id, name, muscle_groups, equipment, difficulty "
                    "FROM exercises WHERE %s = ANY(muscle_groups) ORDER BY name",
                    (muscle_group,),
                )
            else:
                cur = await conn.execute(
                    "SELECT id, name, muscle_groups, equipment, difficulty FROM exercises ORDER BY name"
                )
            rows = await cur.fetchall()
    except Exception:
        return []
    return [
        {"id": r[0], "name": r[1], "muscle_groups": r[2], "equipment": r[3], "difficulty": r[4]}
        for r in rows
    ]
