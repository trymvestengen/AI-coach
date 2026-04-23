import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.db import get_conn
from app.constants import TEST_USER_ID


class AddExerciseBody(BaseModel):
    exercise_id: str
    sets: int = Field(ge=1)
    reps: int = Field(ge=1)
    weight_kg: float | None = None


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
    except Exception as e:
        print(f"[get_programs] DB error: {e}")
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
    except Exception as e:
        print(f"[get_exercises] DB error: {e}")
        return []
    return [
        {"id": r[0], "name": r[1], "muscle_groups": r[2], "equipment": r[3], "difficulty": r[4]}
        for r in rows
    ]


@router.post("/programs/{program_id}/days/{day_id}/exercises")
async def add_exercise_to_day(
    program_id: uuid.UUID, day_id: uuid.UUID, body: AddExerciseBody
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM programs WHERE id = %s AND user_id = %s",
                (program_id, TEST_USER_ID),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Program not found")

            cur = await conn.execute(
                "SELECT id FROM program_days WHERE id = %s AND program_id = %s",
                (day_id, program_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Day not found")

            cur = await conn.execute(
                "SELECT COALESCE(MAX(order_index) + 1, 0) FROM program_exercises WHERE program_day_id = %s",
                (day_id,),
            )
            row = await cur.fetchone()
            order_index = row[0]

            cur = await conn.execute(
                "SELECT name, muscle_groups FROM exercises WHERE id = %s",
                (body.exercise_id,),
            )
            ex = await cur.fetchone()
            if ex is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            new_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO program_exercises "
                "(id, program_day_id, exercise_id, sets, reps, weight_kg, order_index) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (new_id, day_id, body.exercise_id, body.sets, body.reps, body.weight_kg, order_index),
            )
            await conn.commit()
        return {
            "id": new_id,
            "exercise_id": body.exercise_id,
            "name": ex[0],
            "sets": body.sets,
            "reps": body.reps,
            "weight_kg": body.weight_kg,
            "muscle_groups": ex[1],
            "order_index": order_index,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[add_exercise_to_day] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
