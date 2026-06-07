"""Tools that read/write user's programs, days, and exercises."""
import uuid
from app.db import get_conn


async def create_program(user_id: str, name: str, days: list) -> dict:
    """Create a new program with days and exercises. Does NOT auto-activate.
    Use update_program with is_active=True to activate."""
    program_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO programs (id, user_id, name, is_active) "
                "VALUES (%s, %s, %s, false)",
                (program_id, user_id, name),
            )
            for i, day in enumerate(days, start=1):
                day_id = str(uuid.uuid4())
                await conn.execute(
                    "INSERT INTO program_days (id, program_id, day_number, name) "
                    "VALUES (%s, %s, %s, %s)",
                    (day_id, program_id, i, day["name"]),
                )
                for j, ex in enumerate(day.get("exercises", [])):
                    await conn.execute(
                        "INSERT INTO program_exercises "
                        "(program_day_id, exercise_id, sets, reps, weight_kg, order_index) "
                        "VALUES (%s, %s, %s, %s, %s, %s)",
                        (day_id, ex["exercise_id"], ex["sets"], ex["reps"], ex.get("weight_kg"), j),
                    )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": f"Failed to create program: {e}"}
    return {"ok": True, "program_id": program_id, "name": name, "days_count": len(days)}


async def update_program(
    user_id: str,
    program_id: str,
    name: str | None = None,
    is_active: bool | None = None,
    folder_id: str | None = ...,
) -> dict:
    """Update program fields. If is_active=True, deactivates other programs first.

    folder_id sentinel handling: caller passes None to move to root; ... (default)
    means leave unchanged. We use ... as the "absent" sentinel since
    None is a valid folder_id value (move to root)."""
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM programs WHERE id = %s AND user_id = %s",
                (program_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Program not found"}

            if is_active is True:
                await conn.execute(
                    "UPDATE programs SET is_active = false WHERE user_id = %s AND id <> %s",
                    (user_id, program_id),
                )

            updates: list[str] = []
            params: list = []
            if name is not None:
                updates.append("name = %s")
                params.append(name)
            if is_active is not None:
                updates.append("is_active = %s")
                params.append(is_active)
            if folder_id is not ...:
                updates.append("folder_id = %s")
                params.append(folder_id)

            if not updates:
                return {"ok": False, "error": "No fields to update"}

            params.extend([program_id, user_id])
            await conn.execute(
                f"UPDATE programs SET {', '.join(updates)} "
                "WHERE id = %s AND user_id = %s",
                params,
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "program_id": program_id}


async def delete_program(user_id: str, program_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM programs WHERE id = %s AND user_id = %s RETURNING id",
                (program_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Program not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "program_id": program_id}


async def add_program_day(user_id: str, program_id: str, day_number: int, name: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM programs WHERE id = %s AND user_id = %s",
                (program_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Program not found"}

            day_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO program_days (id, program_id, day_number, name) "
                "VALUES (%s, %s, %s, %s)",
                (day_id, program_id, day_number, name),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "day_id": day_id, "day_number": day_number, "name": name}


async def remove_program_day(user_id: str, program_id: str, day_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT pd.id FROM program_days pd "
                "JOIN programs p ON p.id = pd.program_id "
                "WHERE pd.id = %s AND p.id = %s AND p.user_id = %s",
                (day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Day not found"}

            await conn.execute(
                "DELETE FROM program_days WHERE id = %s",
                (day_id,),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "day_id": day_id}


async def rename_program_day(user_id: str, program_id: str, day_id: str, name: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT pd.id FROM program_days pd "
                "JOIN programs p ON p.id = pd.program_id "
                "WHERE pd.id = %s AND p.id = %s AND p.user_id = %s",
                (day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Day not found"}

            await conn.execute(
                "UPDATE program_days SET name = %s WHERE id = %s",
                (name, day_id),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "day_id": day_id, "name": name}


async def add_exercise_to_day(
    user_id: str, program_id: str, day_id: str, exercise_id: str,
    sets: int, reps: int, weight_kg: float | None = None,
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT pd.id FROM program_days pd "
                "JOIN programs p ON p.id = pd.program_id "
                "WHERE pd.id = %s AND p.id = %s AND p.user_id = %s",
                (day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Day not found"}

            cur = await conn.execute(
                "SELECT COALESCE(MAX(order_index) + 1, 0) "
                "FROM program_exercises WHERE program_day_id = %s",
                (day_id,),
            )
            order_index = (await cur.fetchone())[0]

            pe_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO program_exercises "
                "(id, program_day_id, exercise_id, sets, reps, weight_kg, order_index) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (pe_id, day_id, exercise_id, sets, reps, weight_kg, order_index),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "program_exercise_id": pe_id, "exercise_id": exercise_id}


async def remove_exercise_from_day(
    user_id: str, program_id: str, day_id: str, exercise_id: str,
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT pd.id FROM program_days pd "
                "JOIN programs p ON p.id = pd.program_id "
                "WHERE pd.id = %s AND p.id = %s AND p.user_id = %s",
                (day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Day not found"}

            cur = await conn.execute(
                "DELETE FROM program_exercises "
                "WHERE program_day_id = %s AND exercise_id = %s RETURNING id",
                (day_id, exercise_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Exercise not found in day"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "exercise_id": exercise_id}


async def swap_exercise_in_day(
    user_id: str, program_id: str, day_id: str,
    old_exercise_id: str, new_exercise_id: str,
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT pd.id FROM program_days pd "
                "JOIN programs p ON p.id = pd.program_id "
                "WHERE pd.id = %s AND p.id = %s AND p.user_id = %s",
                (day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Day not found"}

            cur = await conn.execute(
                "UPDATE program_exercises SET exercise_id = %s "
                "WHERE program_day_id = %s AND exercise_id = %s RETURNING id",
                (new_exercise_id, day_id, old_exercise_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Old exercise not found in day"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "old_exercise_id": old_exercise_id, "new_exercise_id": new_exercise_id}


async def update_exercise_sets(
    user_id: str, program_id: str, day_id: str, exercise_id: str,
    sets: int | None = None, reps: int | None = None, weight_kg: float | None = ...,
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT pd.id FROM program_days pd "
                "JOIN programs p ON p.id = pd.program_id "
                "WHERE pd.id = %s AND p.id = %s AND p.user_id = %s",
                (day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Day not found"}

            updates: list[str] = []
            params: list = []
            if sets is not None:
                updates.append("sets = %s")
                params.append(sets)
            if reps is not None:
                updates.append("reps = %s")
                params.append(reps)
            if weight_kg is not ...:
                updates.append("weight_kg = %s")
                params.append(weight_kg)

            if not updates:
                return {"ok": False, "error": "No fields to update"}

            params.extend([day_id, exercise_id])
            cur = await conn.execute(
                f"UPDATE program_exercises SET {', '.join(updates)} "
                "WHERE program_day_id = %s AND exercise_id = %s RETURNING id",
                params,
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Exercise not found in day"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "exercise_id": exercise_id}
