"""Tools that read/write user's workout templates and their exercises."""
import logging
import uuid
from app.db import get_conn

logger = logging.getLogger(__name__)


async def create_template(user_id: str, name: str, exercises: list | None = None) -> dict:
    template_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO workout_templates (id, user_id, name) VALUES (%s, %s, %s)",
                (template_id, user_id, name),
            )
            for pos, ex in enumerate(exercises or []):
                te_id = str(uuid.uuid4())
                await conn.execute(
                    "INSERT INTO template_exercises (id, template_id, exercise_id, position) "
                    "VALUES (%s, %s, %s, %s)",
                    (te_id, template_id, ex["exercise_id"], pos),
                )
                n_sets = int(ex.get("sets", 3))
                for s in range(1, n_sets + 1):
                    await conn.execute(
                        "INSERT INTO template_exercise_sets "
                        "(id, template_exercise_id, set_number, reps, weight_kg) "
                        "VALUES (%s, %s, %s, %s, %s)",
                        (str(uuid.uuid4()), te_id, s, ex.get("reps"), ex.get("weight_kg")),
                    )
            await conn.commit()
    except Exception:
        logger.exception("create_template failed")
        return {"ok": False, "error": "Kunne ikke lage økt-malen."}
    return {"ok": True, "template_id": template_id}


async def update_template(user_id: str, template_id: str, name: str | None = None,
                          folder_id: str | None = ...) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM workout_templates WHERE id = %s AND user_id = %s",
                (template_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Template not found"}
            if folder_id is not ... and folder_id is not None:
                cur = await conn.execute(
                    "SELECT id FROM template_folders WHERE id = %s AND user_id = %s",
                    (folder_id, user_id),
                )
                if await cur.fetchone() is None:
                    return {"ok": False, "error": "Folder not found"}
            updates, params = [], []
            if name is not None:
                updates.append("name = %s"); params.append(name)
            if folder_id is not ...:
                updates.append("folder_id = %s"); params.append(folder_id)
            if not updates:
                return {"ok": False, "error": "No fields to update"}
            params.extend([template_id, user_id])
            await conn.execute(
                f"UPDATE workout_templates SET {', '.join(updates)} WHERE id = %s AND user_id = %s",
                params,
            )
            await conn.commit()
    except Exception:
        logger.exception("update_template failed")
        return {"ok": False, "error": "Kunne ikke oppdatere malen."}
    return {"ok": True, "template_id": template_id}


async def delete_template(user_id: str, template_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM workout_templates WHERE id = %s AND user_id = %s RETURNING id",
                (template_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Template not found"}
            await conn.commit()
    except Exception:
        logger.exception("delete_template failed")
        return {"ok": False, "error": "Kunne ikke slette malen."}
    return {"ok": True, "template_id": template_id}


async def add_exercise_to_template(
    user_id: str, template_id: str, exercise_id: str,
    sets: int = 3, reps: int = 10, weight_kg: float | None = None,
) -> dict:
    """Add an exercise to a template, creating N template_exercise_sets rows."""
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM workout_templates WHERE id = %s AND user_id = %s",
                (template_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Template not found"}

            cur = await conn.execute(
                "SELECT COALESCE(MAX(position) + 1, 0) "
                "FROM template_exercises WHERE template_id = %s",
                (template_id,),
            )
            position = (await cur.fetchone())[0]

            te_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO template_exercises "
                "(id, template_id, exercise_id, position) "
                "VALUES (%s, %s, %s, %s)",
                (te_id, template_id, exercise_id, position),
            )
            for n in range(1, sets + 1):
                await conn.execute(
                    "INSERT INTO template_exercise_sets "
                    "(id, template_exercise_id, set_number, reps, weight_kg) "
                    "VALUES (%s, %s, %s, %s, %s)",
                    (str(uuid.uuid4()), te_id, n, reps, weight_kg),
                )
            await conn.commit()
    except Exception:
        logger.exception("add_exercise_to_template failed")
        return {"ok": False, "error": "Noe gikk galt. Prøv igjen."}
    return {"ok": True, "template_exercise_id": te_id, "exercise_id": exercise_id, "sets": sets}


async def remove_exercise_from_template(
    user_id: str, template_id: str, exercise_id: str,
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM workout_templates WHERE id = %s AND user_id = %s",
                (template_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Template not found"}

            cur = await conn.execute(
                "DELETE FROM template_exercises "
                "WHERE template_id = %s AND exercise_id = %s RETURNING id",
                (template_id, exercise_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Exercise not found in template"}
            await conn.commit()
    except Exception:
        logger.exception("remove_exercise_from_template failed")
        return {"ok": False, "error": "Noe gikk galt. Prøv igjen."}
    return {"ok": True, "exercise_id": exercise_id}


async def swap_exercise_in_template(
    user_id: str, template_id: str,
    old_exercise_id: str, new_exercise_id: str,
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM workout_templates WHERE id = %s AND user_id = %s",
                (template_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Template not found"}

            cur = await conn.execute(
                "UPDATE template_exercises SET exercise_id = %s "
                "WHERE template_id = %s AND exercise_id = %s RETURNING id",
                (new_exercise_id, template_id, old_exercise_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Old exercise not found in template"}
            await conn.commit()
    except Exception:
        logger.exception("swap_exercise_in_template failed")
        return {"ok": False, "error": "Noe gikk galt. Prøv igjen."}
    return {"ok": True, "old_exercise_id": old_exercise_id, "new_exercise_id": new_exercise_id}


async def update_exercise_sets(
    user_id: str, template_id: str, exercise_id: str,
    sets: int | None = None, reps: int | None = None, weight_kg: float | None = ...,
) -> dict:
    """Update sets count, reps, and/or weight for an exercise in a template.

    Sets are stored per-row in template_exercise_sets. Changing `sets` adjusts
    the number of rows; changing `reps`/`weight_kg` updates all rows."""
    if sets is None and reps is None and weight_kg is ...:
        return {"ok": False, "error": "No fields to update"}
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT te.id FROM template_exercises te "
                "JOIN workout_templates wt ON wt.id = te.template_id "
                "WHERE te.exercise_id = %s AND te.template_id = %s AND wt.user_id = %s",
                (exercise_id, template_id, user_id),
            )
            row = await cur.fetchone()
            if row is None:
                return {"ok": False, "error": "Exercise not found in template"}
            te_id = row[0]

            cur = await conn.execute(
                "SELECT set_number, reps, weight_kg::float "
                "FROM template_exercise_sets WHERE template_exercise_id = %s "
                "ORDER BY set_number",
                (te_id,),
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
                            "INSERT INTO template_exercise_sets "
                            "(id, template_exercise_id, set_number, reps, weight_kg) "
                            "VALUES (%s, %s, %s, %s, %s)",
                            (str(uuid.uuid4()), te_id, n, new_reps, new_weight),
                        )
                elif target < current_count:
                    await conn.execute(
                        "DELETE FROM template_exercise_sets "
                        "WHERE template_exercise_id = %s AND set_number > %s",
                        (te_id, target),
                    )

            if reps is not None or weight_kg is not ...:
                await conn.execute(
                    "UPDATE template_exercise_sets SET reps = %s, weight_kg = %s "
                    "WHERE template_exercise_id = %s",
                    (new_reps, new_weight, te_id),
                )

            await conn.commit()
    except Exception:
        logger.exception("update_exercise_sets failed")
        return {"ok": False, "error": "Noe gikk galt. Prøv igjen."}
    return {"ok": True, "exercise_id": exercise_id}
