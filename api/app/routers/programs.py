import uuid
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, model_validator
from app.db import get_conn
from app.auth import get_current_user_id


class AddExerciseBody(BaseModel):
    exercise_id: str = Field(min_length=1)


class DaySpec(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    weekdays: list[int] = Field(default_factory=list)
    frequency_per_week: int | None = Field(default=None, ge=1, le=7)

    @model_validator(mode="after")
    def _xor_schedule(self):
        has_days = len(self.weekdays) > 0
        has_freq = self.frequency_per_week is not None
        if has_days == has_freq:
            raise ValueError("Provide either weekdays or frequency_per_week, not both")
        if has_days and any(d < 0 or d > 6 for d in self.weekdays):
            raise ValueError("weekdays must be integers 0..6")
        return self


class UpdateDayBody(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    weekdays: list[int] | None = None
    frequency_per_week: int | None = Field(default=None, ge=1, le=7)

    @model_validator(mode="after")
    def _validate_weekdays_range(self):
        if self.weekdays is not None and any(d < 0 or d > 6 for d in self.weekdays):
            raise ValueError("weekdays must be integers 0..6")
        return self


class CreateProgramBody(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    first_day: DaySpec | None = None


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


@router.post("/programs/{program_id}/days", status_code=201)
async def add_day(program_id: uuid.UUID, request: Request, body: DaySpec) -> dict:
    user_id = get_current_user_id(request)
    day_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM programs WHERE id = %s AND user_id = %s",
                (program_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Program not found")

            cur = await conn.execute(
                "SELECT COALESCE(MAX(day_number), 0) FROM program_days WHERE program_id = %s",
                (program_id,),
            )
            next_day_number = (await cur.fetchone())[0] + 1

            cur = await conn.execute(
                "INSERT INTO program_days "
                "(id, program_id, day_number, name, weekdays, frequency_per_week) "
                "VALUES (%s, %s, %s, %s, %s, %s) "
                "RETURNING id, name, weekdays, frequency_per_week, day_number",
                (
                    day_id, program_id, next_day_number, body.name.strip(),
                    body.weekdays, body.frequency_per_week,
                ),
            )
            row = await cur.fetchone()
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[add_day] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {
        "id": str(row[0]),
        "name": row[1],
        "weekdays": list(row[2] or []),
        "frequency_per_week": row[3],
        "day_number": row[4],
        "exercises": [],
    }


@router.patch("/programs/{program_id}/days/{day_id}")
async def update_day(
    program_id: uuid.UUID, day_id: uuid.UUID,
    request: Request, body: UpdateDayBody,
) -> dict:
    user_id = get_current_user_id(request)
    fields_set = body.model_fields_set
    if not fields_set:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT pd.weekdays, pd.frequency_per_week FROM program_days pd "
                "JOIN programs p ON p.id = pd.program_id "
                "WHERE pd.id = %s AND p.id = %s AND p.user_id = %s",
                (day_id, program_id, user_id),
            )
            current = await cur.fetchone()
            if current is None:
                raise HTTPException(status_code=404, detail="Day not found")

            # Compute merged state and enforce XOR
            merged_weekdays = body.weekdays if "weekdays" in fields_set else list(current[0] or [])
            merged_freq = body.frequency_per_week if "frequency_per_week" in fields_set else current[1]
            has_days = len(merged_weekdays or []) > 0
            has_freq = merged_freq is not None
            if has_days == has_freq:
                raise HTTPException(
                    status_code=400,
                    detail="Day must have either weekdays or frequency_per_week, not both",
                )

            updates: list[str] = []
            params: list = []
            if "name" in fields_set and body.name is not None:
                updates.append("name = %s")
                params.append(body.name.strip())
            if "weekdays" in fields_set:
                updates.append("weekdays = %s")
                params.append(body.weekdays or [])
            if "frequency_per_week" in fields_set:
                updates.append("frequency_per_week = %s")
                params.append(body.frequency_per_week)

            if not updates:
                raise HTTPException(status_code=400, detail="No fields to update")

            params.append(day_id)
            cur = await conn.execute(
                f"UPDATE program_days SET {', '.join(updates)} "
                "WHERE id = %s "
                "RETURNING id, name, weekdays, frequency_per_week, day_number",
                params,
            )
            row = await cur.fetchone()
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[update_day] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {
        "id": str(row[0]),
        "name": row[1],
        "weekdays": list(row[2] or []),
        "frequency_per_week": row[3],
        "day_number": row[4],
    }


@router.get("/exercises")
async def get_exercises(muscle_group: str | None = None) -> list:
    sql = (
        "SELECT id, name, primary_muscles, equipment, difficulty, "
        "       primary_muscles, secondary_muscles, image_urls "
        "FROM exercises"
    )
    params: tuple = ()
    if muscle_group:
        sql += " WHERE %s = ANY(primary_muscles)"
        params = (muscle_group,)
    sql += " ORDER BY name"
    try:
        async with get_conn() as conn:
            cur = await conn.execute(sql, params)
            rows = await cur.fetchall()
    except Exception as e:
        print(f"[get_exercises] DB error: {e}")
        return []
    return [
        {
            "id": r[0],
            "name": r[1],
            "muscle_groups": r[2],  # alias for back-compat
            "equipment": r[3],
            "difficulty": r[4],
            "primary_muscles": r[5],
            "secondary_muscles": r[6],
            "image_urls": r[7] or [],
        }
        for r in rows
    ]


@router.get("/exercises/{exercise_id}")
async def get_exercise_by_id(exercise_id: str) -> dict:
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
        print(f"[get_exercise_by_id] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    if row is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return {
        "id": row[0],
        "name": row[1],
        "muscle_groups": row[2],
        "equipment": row[3],
        "difficulty": row[4],
        "instructions": row[5] or "",
        "force": row[6],
        "mechanic": row[7],
        "category": row[8],
        "primary_muscles": row[9],
        "secondary_muscles": row[10],
        "image_urls": row[11] or [],
    }


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


@router.delete("/programs/{program_id}/days/{day_id}", status_code=204)
async def delete_day(
    program_id: uuid.UUID, day_id: uuid.UUID, request: Request
) -> None:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT pd.id FROM program_days pd "
                "JOIN programs p ON p.id = pd.program_id "
                "WHERE pd.id = %s AND p.id = %s AND p.user_id = %s",
                (day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Day not found")

            await conn.execute(
                "DELETE FROM program_days WHERE id = %s RETURNING id",
                (day_id,),
            )
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[delete_day] DB error: {e}")
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


class ProgramPatchBody(BaseModel):
    is_active: bool | None = None
    folder_id: str | None = None  # null = move to root; absent = leave unchanged
    name: str | None = Field(default=None, min_length=1, max_length=120)


@router.patch("/programs/{program_id}")
async def patch_program(
    program_id: uuid.UUID, request: Request, body: ProgramPatchBody
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

            # Setting active=True deactivates all other programs for this user first.
            if body.is_active is True:
                await conn.execute(
                    "UPDATE programs SET is_active = false "
                    "WHERE user_id = %s AND id <> %s",
                    (user_id, program_id),
                )

            updates: list[str] = []
            params: list = []
            if body.is_active is not None:
                updates.append("is_active = %s")
                params.append(body.is_active)
            if "folder_id" in body.model_fields_set:
                updates.append("folder_id = %s")
                params.append(body.folder_id)
            if body.name is not None:
                updates.append("name = %s")
                params.append(body.name.strip())

            if not updates:
                raise HTTPException(status_code=400, detail="No fields to update")

            params.extend([program_id, user_id])
            cur = await conn.execute(
                f"UPDATE programs SET {', '.join(updates)} "
                "WHERE id = %s AND user_id = %s "
                "RETURNING id, name, is_active, folder_id",
                params,
            )
            row = await cur.fetchone()
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[patch_program] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {
        "id": str(row[0]),
        "name": row[1],
        "is_active": row[2],
        "folder_id": str(row[3]) if row[3] else None,
    }


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

            cur2 = await conn.execute(
                "DELETE FROM program_exercises WHERE id = %s RETURNING id",
                (exercise_id,),
            )
            if await cur2.fetchone() is None:
                raise HTTPException(status_code=404, detail="Exercise not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[delete_exercise] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/programs", status_code=201)
async def create_program(request: Request, body: CreateProgramBody) -> dict:
    """Create a new (empty or one-day) program. Does NOT auto-activate."""
    user_id = get_current_user_id(request)
    program_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "INSERT INTO programs (id, user_id, name, is_active) "
                "VALUES (%s, %s, %s, false) "
                "RETURNING id, name, is_active, folder_id",
                (program_id, user_id, body.name.strip()),
            )
            prog_row = await cur.fetchone()

            day_payload: dict | None = None
            if body.first_day is not None:
                day_id = str(uuid.uuid4())
                cur_day = await conn.execute(
                    "INSERT INTO program_days "
                    "(id, program_id, day_number, name, weekdays, frequency_per_week) "
                    "VALUES (%s, %s, 1, %s, %s, %s) "
                    "RETURNING id, name, weekdays, frequency_per_week, day_number",
                    (
                        day_id, program_id, body.first_day.name.strip(),
                        body.first_day.weekdays, body.first_day.frequency_per_week,
                    ),
                )
                day_row = await cur_day.fetchone()
                day_payload = {
                    "id": str(day_row[0]),
                    "name": day_row[1],
                    "weekdays": list(day_row[2] or []),
                    "frequency_per_week": day_row[3],
                    "day_number": day_row[4],
                    "exercises": [],
                }

            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[create_program] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {
        "id": str(prog_row[0]),
        "name": prog_row[1],
        "is_active": prog_row[2],
        "folder_id": str(prog_row[3]) if prog_row[3] else None,
        "days": [day_payload] if day_payload else [],
    }


class FromWorkoutBody(BaseModel):
    workout_id: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=120)
    folder_id: str | None = None


@router.post("/programs/from-workout", status_code=201)
async def create_program_from_workout(
    request: Request, body: FromWorkoutBody
) -> dict:
    """Create a program from a logged workout snapshot.

    Builds one day named after the program containing each unique exercise
    from the workout's logged sets, with the same reps/weight_kg per set."""
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            # Verify workout belongs to user.
            cur = await conn.execute(
                "SELECT id FROM workouts WHERE id = %s AND user_id = %s",
                (body.workout_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Workout not found")

            # Fetch logged sets ordered by exercise then set number.
            cur = await conn.execute(
                "SELECT exercise_id, set_number, reps, weight_kg::float "
                "FROM workout_sets WHERE workout_id = %s "
                "ORDER BY exercise_id, set_number",
                (body.workout_id,),
            )
            set_rows = await cur.fetchall()
            if not set_rows:
                raise HTTPException(
                    status_code=400, detail="Workout has no logged sets"
                )

            # Group by exercise.
            from collections import defaultdict
            grouped: dict[str, list[tuple[int, int, float | None]]] = defaultdict(list)
            for ex_id, set_num, reps, weight in set_rows:
                grouped[ex_id].append((set_num, reps, weight))

            program_id = str(uuid.uuid4())
            cur = await conn.execute(
                "INSERT INTO programs (id, user_id, name, folder_id, is_active) "
                "VALUES (%s, %s, %s, %s, false) "
                "RETURNING id, name, folder_id",
                (program_id, user_id, body.name.strip(), body.folder_id),
            )
            prog_row = await cur.fetchone()

            day_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO program_days (id, program_id, day_number, name) "
                "VALUES (%s, %s, 1, %s)",
                (day_id, program_id, body.name.strip()),
            )

            for order_index, (ex_id, sets) in enumerate(grouped.items()):
                pe_id = str(uuid.uuid4())
                # Legacy schema (migration 002) requires sets/reps/weight_kg columns.
                # Use the first logged set's values as defaults.
                _, first_reps, first_weight = sets[0]
                await conn.execute(
                    "INSERT INTO program_exercises "
                    "(id, program_day_id, exercise_id, sets, reps, weight_kg, order_index) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                    (pe_id, day_id, ex_id, len(sets), first_reps, first_weight, order_index),
                )
                for set_num, reps, weight in sets:
                    await conn.execute(
                        "INSERT INTO program_exercise_sets "
                        "(id, program_exercise_id, set_number, reps, weight_kg) "
                        "VALUES (%s, %s, %s, %s, %s)",
                        (str(uuid.uuid4()), pe_id, set_num, reps, weight),
                    )

            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[create_program_from_workout] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {
        "id": str(prog_row[0]),
        "name": prog_row[1],
        "is_active": False,
        "folder_id": str(prog_row[2]) if prog_row[2] else None,
    }
