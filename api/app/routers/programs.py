import uuid
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from app.db import get_conn
from app.auth import get_current_user_id


class AddExerciseBody(BaseModel):
    exercise_id: str = Field(min_length=1)


router = APIRouter()


@router.get("/programs")
async def get_programs(request: Request) -> list:
    user_id = get_current_user_id(request)
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
                (user_id,),
            )
            rows = await cur.fetchall()
    except Exception as e:
        print(f"[get_programs] DB error: {e}")
        return []
    return [
        {"id": str(r[0]), "name": r[1], "is_active": r[2], "days_count": r[3]}
        for r in rows
    ]


@router.get("/programs/active")
async def get_active_program(request: Request) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id, name, is_active FROM programs WHERE user_id = %s AND is_active = true LIMIT 1",
                (user_id,),
            )
            prog = await cur.fetchone()
            if prog is None:
                raise HTTPException(status_code=404, detail="No active program")

            cur = await conn.execute(
                """
                SELECT pd.id, pd.day_number, pd.name,
                       COALESCE(
                           json_agg(
                               json_build_object(
                                   'id',          pe.id::text,
                                   'exercise_id', pe.exercise_id,
                                   'name',        e.name,
                                   'muscle_groups', e.muscle_groups,
                                   'order_index', pe.order_index,
                                   'sets', (
                                       SELECT COALESCE(
                                           json_agg(
                                               json_build_object(
                                                   'id',         pes.id::text,
                                                   'set_number', pes.set_number,
                                                   'reps',       pes.reps,
                                                   'weight_kg',  pes.weight_kg::float
                                               ) ORDER BY pes.set_number
                                           ),
                                           '[]'::json
                                       )
                                       FROM program_exercise_sets pes
                                       WHERE pes.program_exercise_id = pe.id
                                   )
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
                (prog[0],),
            )
            day_rows = await cur.fetchall()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[get_active_program] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {
        "id": str(prog[0]),
        "name": prog[1],
        "is_active": prog[2],
        "days": [
            {"id": str(r[0]), "day_number": r[1], "name": r[2], "exercises": r[3] or []}
            for r in day_rows
        ],
    }


@router.get("/programs/{program_id}")
async def get_program(program_id: uuid.UUID, request: Request) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id, name, is_active FROM programs WHERE id = %s AND user_id = %s",
                (program_id, user_id),
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
                                   'id',          pe.id::text,
                                   'exercise_id', pe.exercise_id,
                                   'name',        e.name,
                                   'muscle_groups', e.muscle_groups,
                                   'order_index', pe.order_index,
                                   'sets', (
                                       SELECT COALESCE(
                                           json_agg(
                                               json_build_object(
                                                   'id',         pes.id::text,
                                                   'set_number', pes.set_number,
                                                   'reps',       pes.reps,
                                                   'weight_kg',  pes.weight_kg::float
                                               ) ORDER BY pes.set_number
                                           ),
                                           '[]'::json
                                       )
                                       FROM program_exercise_sets pes
                                       WHERE pes.program_exercise_id = pe.id
                                   )
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
        print(f"[get_program] DB error: {e}")
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
    program_id: uuid.UUID, day_id: uuid.UUID, request: Request, body: AddExerciseBody
) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM programs WHERE id = %s AND user_id = %s",
                (program_id, user_id),
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
            order_index = (await cur.fetchone())[0]

            cur = await conn.execute(
                "SELECT name, muscle_groups FROM exercises WHERE id = %s",
                (body.exercise_id,),
            )
            ex = await cur.fetchone()
            if ex is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            exercise_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO program_exercises (id, program_day_id, exercise_id, order_index) "
                "VALUES (%s, %s, %s, %s)",
                (exercise_id, day_id, body.exercise_id, order_index),
            )

            set_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO program_exercise_sets (id, program_exercise_id, set_number, reps) "
                "VALUES (%s, %s, %s, %s)",
                (set_id, exercise_id, 1, 10),
            )
            await conn.commit()

        return {
            "id": exercise_id,
            "exercise_id": body.exercise_id,
            "name": ex[0],
            "muscle_groups": ex[1],
            "order_index": order_index,
            "sets": [{"id": set_id, "set_number": 1, "reps": 10, "weight_kg": None}],
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[add_exercise_to_day] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/programs/{program_id}/days/{day_id}/exercises/{exercise_id}")
async def get_exercise_detail(
    program_id: uuid.UUID, day_id: uuid.UUID, exercise_id: uuid.UUID, request: Request
) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT pe.id, pe.exercise_id, e.name, e.muscle_groups, pe.order_index
                FROM program_exercises pe
                JOIN exercises e ON e.id = pe.exercise_id
                JOIN program_days pd ON pd.id = pe.program_day_id
                JOIN programs p ON p.id = pd.program_id
                WHERE pe.id = %s AND pd.id = %s AND p.id = %s AND p.user_id = %s
                """,
                (exercise_id, day_id, program_id, user_id),
            )
            row = await cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            cur = await conn.execute(
                "SELECT id, set_number, reps, weight_kg::float "
                "FROM program_exercise_sets WHERE program_exercise_id = %s ORDER BY set_number",
                (exercise_id,),
            )
            set_rows = await cur.fetchall()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[get_exercise_detail] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {
        "id": str(row[0]),
        "exercise_id": row[1],
        "name": row[2],
        "muscle_groups": row[3],
        "order_index": row[4],
        "sets": [
            {"id": str(s[0]), "set_number": s[1], "reps": s[2], "weight_kg": s[3]}
            for s in set_rows
        ],
    }


class SetBody(BaseModel):
    reps: int = Field(ge=1)
    weight_kg: float | None = None


@router.post("/programs/{program_id}/days/{day_id}/exercises/{exercise_id}/sets")
async def add_set(
    program_id: uuid.UUID, day_id: uuid.UUID, exercise_id: uuid.UUID, request: Request, body: SetBody
) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT pe.id FROM program_exercises pe
                JOIN program_days pd ON pd.id = pe.program_day_id
                JOIN programs p ON p.id = pd.program_id
                WHERE pe.id = %s AND pd.id = %s AND p.id = %s AND p.user_id = %s
                """,
                (exercise_id, day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            cur = await conn.execute(
                "SELECT COALESCE(MAX(set_number) + 1, 1) "
                "FROM program_exercise_sets WHERE program_exercise_id = %s",
                (exercise_id,),
            )
            set_number = (await cur.fetchone())[0]

            set_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO program_exercise_sets "
                "(id, program_exercise_id, set_number, reps, weight_kg) "
                "VALUES (%s, %s, %s, %s, %s)",
                (set_id, exercise_id, set_number, body.reps, body.weight_kg),
            )
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[add_set] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {"id": set_id, "set_number": set_number, "reps": body.reps, "weight_kg": body.weight_kg}


@router.patch("/programs/{program_id}/days/{day_id}/exercises/{exercise_id}/sets/{set_id}")
async def update_set(
    program_id: uuid.UUID,
    day_id: uuid.UUID,
    exercise_id: uuid.UUID,
    set_id: uuid.UUID,
    request: Request,
    body: SetBody,
) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT pe.id FROM program_exercises pe
                JOIN program_days pd ON pd.id = pe.program_day_id
                JOIN programs p ON p.id = pd.program_id
                WHERE pe.id = %s AND pd.id = %s AND p.id = %s AND p.user_id = %s
                """,
                (exercise_id, day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            cur = await conn.execute(
                "UPDATE program_exercise_sets SET reps = %s, weight_kg = %s "
                "WHERE id = %s AND program_exercise_id = %s "
                "RETURNING id, set_number, reps, weight_kg::float",
                (body.reps, body.weight_kg, set_id, exercise_id),
            )
            row = await cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Set not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[update_set] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {"id": str(row[0]), "set_number": row[1], "reps": row[2], "weight_kg": row[3]}


@router.delete(
    "/programs/{program_id}/days/{day_id}/exercises/{exercise_id}/sets/{set_id}",
    status_code=204,
)
async def delete_set(
    program_id: uuid.UUID, day_id: uuid.UUID, exercise_id: uuid.UUID, set_id: uuid.UUID,
    request: Request,
) -> None:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT pe.id FROM program_exercises pe
                JOIN program_days pd ON pd.id = pe.program_day_id
                JOIN programs p ON p.id = pd.program_id
                WHERE pe.id = %s AND pd.id = %s AND p.id = %s AND p.user_id = %s
                """,
                (exercise_id, day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            cur = await conn.execute(
                "DELETE FROM program_exercise_sets "
                "WHERE id = %s AND program_exercise_id = %s RETURNING id",
                (set_id, exercise_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Set not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[delete_set] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/programs/{program_id}", status_code=204)
async def delete_program(program_id: uuid.UUID, request: Request) -> None:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM programs WHERE id = %s AND user_id = %s RETURNING id",
                (program_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Program not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[delete_program] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete(
    "/programs/{program_id}/days/{day_id}/exercises/{exercise_id}",
    status_code=204,
)
async def delete_exercise(
    program_id: uuid.UUID, day_id: uuid.UUID, exercise_id: uuid.UUID, request: Request
) -> None:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            # M3: eierskap er atomisk med slettingen — selve DELETE-en er scopet via
            # join til programs.user_id (ingen separat SELECT-så-DELETE / TOCTOU).
            cur = await conn.execute(
                """
                DELETE FROM program_exercises pe
                USING program_days pd, programs p
                WHERE pe.id = %s AND pd.id = %s AND p.id = %s
                  AND pd.id = pe.program_day_id AND p.id = pd.program_id
                  AND p.user_id = %s
                RETURNING pe.id
                """,
                (exercise_id, day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Exercise not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[delete_exercise] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
