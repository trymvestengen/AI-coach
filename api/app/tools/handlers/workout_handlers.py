"""Tools that log workouts and sets."""
import logging
import uuid
from datetime import datetime, timezone

from app.db import get_conn

logger = logging.getLogger(__name__)


async def log_workout(
    user_id: str,
    exercises: list,
    notes: str | None = None,
    rpe: int | None = None,
    coach_summary: str | None = None,
) -> dict:
    workout_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO workouts (id, user_id, started_at, completed_at, notes, rpe, coach_summary) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (workout_id, user_id, datetime.now(timezone.utc), datetime.now(timezone.utc), notes, rpe, coach_summary),
            )
            for ex in exercises:
                for i, s in enumerate(ex.get("sets", []), start=1):
                    await conn.execute(
                        "INSERT INTO workout_sets "
                        "(workout_id, exercise_id, set_number, reps, weight_kg, rpe, coach_note) "
                        "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                        (
                            workout_id,
                            ex["exercise_id"],
                            i,
                            s.get("reps"),
                            s.get("weight_kg"),
                            s.get("rpe"),
                            s.get("coach_note"),
                        ),
                    )
            await conn.commit()
    except Exception:
        logger.exception("log_workout failed")
        return {"ok": False, "error": "Kunne ikke logge økten.", "status": "error"}
    return {"ok": True, "workout_id": workout_id, "status": "logged", "message": "Workout logged successfully"}


async def log_set_with_note(
    user_id: str,
    workout_id: str,
    exercise_id: str,
    set_number: int,
    reps: int | None = None,
    weight_kg: float | None = None,
    rpe: int | None = None,
    coach_note: str | None = None,
) -> dict:
    try:
        async with get_conn() as conn:
            # workout_id er LLM-levert og backend forbigår RLS — verifiser at økten
            # tilhører brukeren før vi skriver, ellers kan et sett havne i en annen
            # brukers økt.
            cur = await conn.execute(
                "SELECT id FROM workouts WHERE id = %s AND user_id = %s",
                (workout_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Workout not found"}

            cur = await conn.execute(
                "INSERT INTO workout_sets "
                "(workout_id, exercise_id, set_number, reps, weight_kg, rpe, coach_note) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (workout_id, exercise_id, set_number, reps, weight_kg, rpe, coach_note),
            )
            row = await cur.fetchone()
            await conn.commit()
    except Exception:
        logger.exception("log_set_with_note failed")
        return {"ok": False, "error": "Kunne ikke logge settet. Prøv igjen."}

    return {"ok": True, "id": row[0], "status": "logged"}


async def start_workout_from_template(user_id: str, template_id: str) -> dict:
    try:
        async with get_conn() as conn:
            # Verify template belongs to user
            cur = await conn.execute(
                "SELECT id FROM workout_templates WHERE id = %s AND user_id = %s",
                (template_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Template not found"}

            workout_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO workouts (id, user_id, template_id) VALUES (%s, %s, %s)",
                (workout_id, user_id, template_id),
            )
            await conn.commit()
    except Exception:
        logger.exception("start_workout_from_template failed")
        return {"ok": False, "error": "Kunne ikke starte treningsøkten. Prøv igjen."}
    return {"ok": True, "workout_id": workout_id}


async def complete_workout(
    user_id: str, workout_id: str, rpe: int | None = None, notes: str | None = None,
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "UPDATE workouts SET completed_at = NOW(), rpe = %s, notes = %s "
                "WHERE id = %s AND user_id = %s AND completed_at IS NULL "
                "RETURNING id",
                (rpe, notes, workout_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Workout not found or already completed"}
            await conn.commit()
    except Exception:
        logger.exception("complete_workout failed")
        return {"ok": False, "error": "Noe gikk galt. Prøv igjen."}
    return {"ok": True, "workout_id": workout_id}


async def discard_workout(user_id: str, workout_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM workouts WHERE id = %s AND user_id = %s RETURNING id",
                (workout_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Workout not found"}
            await conn.commit()
    except Exception:
        logger.exception("discard_workout failed")
        return {"ok": False, "error": "Noe gikk galt. Prøv igjen."}
    return {"ok": True, "workout_id": workout_id}


async def swap_active_workout_exercise(
    user_id: str, workout_id: str, old_exercise_id: str, new_exercise_id: str,
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM workouts WHERE id = %s AND user_id = %s AND completed_at IS NULL",
                (workout_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Active workout not found"}

            # Update existing sets to point at the new exercise_id (best effort — keeps log)
            cur = await conn.execute(
                "UPDATE workout_sets SET exercise_id = %s "
                "WHERE workout_id = %s AND exercise_id = %s RETURNING id",
                (new_exercise_id, workout_id, old_exercise_id),
            )
            sets_updated = len(await cur.fetchall())
            await conn.commit()
    except Exception:
        logger.exception("swap_active_workout_exercise failed")
        return {"ok": False, "error": "Noe gikk galt. Prøv igjen."}
    # Returner antall sett som faktisk ble flyttet, så coachen ikke påstår at noe
    # skjedde når 0 rader endret seg.
    return {
        "ok": True,
        "workout_id": workout_id,
        "swapped_to": new_exercise_id,
        "sets_updated": sets_updated,
    }


async def add_active_workout_exercise(
    user_id: str, workout_id: str, exercise_id: str,
) -> dict:
    # No-op at DB level — workout_sets are inserted on first log_set_with_note for this exercise_id.
    # This handler just verifies ownership so the coach gets a confirm.
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM workouts WHERE id = %s AND user_id = %s AND completed_at IS NULL",
                (workout_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Active workout not found"}
    except Exception:
        logger.exception("add_active_workout_exercise failed")
        return {"ok": False, "error": "Noe gikk galt. Prøv igjen."}
    return {"ok": True, "workout_id": workout_id, "ready_to_log": exercise_id}
