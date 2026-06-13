"""Tools that read/write user's programs, days, and exercises."""
import logging
import uuid
from app.db import get_conn

logger = logging.getLogger(__name__)


async def create_program(user_id: str, name: str, days: list) -> dict:
    """Create a new program with days and exercises. Does NOT auto-activate.

    Each day: {name, weekdays?: [int 0-6], frequency_per_week?: int 1-7,
               exercises: [{exercise_id, sets, reps, weight_kg?}]}.
    Sets are stored per-row in program_exercise_sets (migration 003)."""
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
                    "INSERT INTO program_days "
                    "(id, program_id, day_number, name, weekdays, frequency_per_week) "
                    "VALUES (%s, %s, %s, %s, %s, %s)",
                    (
                        day_id, program_id, i, day["name"],
                        day.get("weekdays") or [],
                        day.get("frequency_per_week"),
                    ),
                )
                for j, ex in enumerate(day.get("exercises", [])):
                    pe_id = str(uuid.uuid4())
                    await conn.execute(
                        "INSERT INTO program_exercises "
                        "(id, program_day_id, exercise_id, order_index) "
                        "VALUES (%s, %s, %s, %s)",
                        (pe_id, day_id, ex["exercise_id"], j),
                    )
                    sets = int(ex.get("sets", 3))
                    reps = int(ex.get("reps", 10))
                    weight = ex.get("weight_kg")
                    for n in range(1, sets + 1):
                        await conn.execute(
                            "INSERT INTO program_exercise_sets "
                            "(id, program_exercise_id, set_number, reps, weight_kg) "
                            "VALUES (%s, %s, %s, %s, %s)",
                            (str(uuid.uuid4()), pe_id, n, reps, weight),
                        )
            await conn.commit()
    except Exception as e:
        print(f"[create_program] ERROR: {e!r}")
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

            # folder_id er LLM-levert; verifiser at mappa tilhører brukeren før vi
            # flytter programmet dit (None = flytt til rot, trenger ingen sjekk).
            if folder_id is not ... and folder_id is not None:
                cur = await conn.execute(
                    "SELECT id FROM program_folders WHERE id = %s AND user_id = %s",
                    (folder_id, user_id),
                )
                if await cur.fetchone() is None:
                    return {"ok": False, "error": "Folder not found"}

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
    except Exception:
        logger.exception("update_program failed")
        return {"ok": False, "error": "Kunne ikke oppdatere programmet."}
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
    except Exception:
        logger.exception("program handler failed")
        return {"ok": False, "error": "Noe gikk galt. Prøv igjen."}
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
    except Exception:
        logger.exception("program handler failed")
        return {"ok": False, "error": "Noe gikk galt. Prøv igjen."}
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
    except Exception:
        logger.exception("program handler failed")
        return {"ok": False, "error": "Noe gikk galt. Prøv igjen."}
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
    except Exception:
        logger.exception("program handler failed")
        return {"ok": False, "error": "Noe gikk galt. Prøv igjen."}
    return {"ok": True, "day_id": day_id, "name": name}


async def add_exercise_to_day(
    user_id: str, program_id: str, day_id: str, exercise_id: str,
    sets: int = 3, reps: int = 10, weight_kg: float | None = None,
) -> dict:
    """Add an exercise to a day, creating N program_exercise_sets rows with the given reps/weight."""
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
                "(id, program_day_id, exercise_id, order_index) "
                "VALUES (%s, %s, %s, %s)",
                (pe_id, day_id, exercise_id, order_index),
            )
            for n in range(1, sets + 1):
                await conn.execute(
                    "INSERT INTO program_exercise_sets "
                    "(id, program_exercise_id, set_number, reps, weight_kg) "
                    "VALUES (%s, %s, %s, %s, %s)",
                    (str(uuid.uuid4()), pe_id, n, reps, weight_kg),
                )
            await conn.commit()
    except Exception:
        logger.exception("program handler failed")
        return {"ok": False, "error": "Noe gikk galt. Prøv igjen."}
    return {"ok": True, "program_exercise_id": pe_id, "exercise_id": exercise_id, "sets": sets}


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
    except Exception:
        logger.exception("program handler failed")
        return {"ok": False, "error": "Noe gikk galt. Prøv igjen."}
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
    except Exception:
        logger.exception("program handler failed")
        return {"ok": False, "error": "Noe gikk galt. Prøv igjen."}
    return {"ok": True, "old_exercise_id": old_exercise_id, "new_exercise_id": new_exercise_id}


async def update_exercise_sets(
    user_id: str, program_id: str, day_id: str, exercise_id: str,
    sets: int | None = None, reps: int | None = None, weight_kg: float | None = ...,
) -> dict:
    """Update sets count, reps, and/or weight for an exercise in a program day.

    Sets are stored per-row in program_exercise_sets. Changing `sets` adjusts
    the number of rows; changing `reps`/`weight_kg` updates all rows."""
    if sets is None and reps is None and weight_kg is ...:
        return {"ok": False, "error": "No fields to update"}
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT pe.id FROM program_exercises pe "
                "JOIN program_days pd ON pd.id = pe.program_day_id "
                "JOIN programs p ON p.id = pd.program_id "
                "WHERE pe.exercise_id = %s AND pd.id = %s AND p.id = %s AND p.user_id = %s",
                (exercise_id, day_id, program_id, user_id),
            )
            row = await cur.fetchone()
            if row is None:
                return {"ok": False, "error": "Exercise not found in day"}
            pe_id = row[0]

            cur = await conn.execute(
                "SELECT set_number, reps, weight_kg::float "
                "FROM program_exercise_sets WHERE program_exercise_id = %s "
                "ORDER BY set_number",
                (pe_id,),
            )
            existing = await cur.fetchall()
            current_count = len(existing)
            template_reps = existing[0][1] if existing else 10
            template_weight = existing[0][2] if existing else None
            new_reps = reps if reps is not None else template_reps
            new_weight = weight_kg if weight_kg is not ... else template_weight

            if sets is not None:
                target = sets
                if target > current_count:
                    for n in range(current_count + 1, target + 1):
                        await conn.execute(
                            "INSERT INTO program_exercise_sets "
                            "(id, program_exercise_id, set_number, reps, weight_kg) "
                            "VALUES (%s, %s, %s, %s, %s)",
                            (str(uuid.uuid4()), pe_id, n, new_reps, new_weight),
                        )
                elif target < current_count:
                    await conn.execute(
                        "DELETE FROM program_exercise_sets "
                        "WHERE program_exercise_id = %s AND set_number > %s",
                        (pe_id, target),
                    )

            if reps is not None or weight_kg is not ...:
                await conn.execute(
                    "UPDATE program_exercise_sets SET reps = %s, weight_kg = %s "
                    "WHERE program_exercise_id = %s",
                    (new_reps, new_weight, pe_id),
                )

            await conn.commit()
    except Exception:
        logger.exception("program handler failed")
        return {"ok": False, "error": "Noe gikk galt. Prøv igjen."}
    return {"ok": True, "exercise_id": exercise_id}
