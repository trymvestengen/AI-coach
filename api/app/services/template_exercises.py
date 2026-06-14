"""Delt forretningslogikk for redigering av en mals øvelser.

Brukes både av LLM-tool-handlerne (app/tools/handlers/template_handlers.py) og
av HTTP-routeren (app/routers/templates.py). Funksjonene tar en åpen `conn` og
gjør SQL-arbeidet, men committer IKKE — det styrer kalleren (så routeren kan
oversette til HTTPException og handleren til {"ok": ...}-dict). Eierskap
verifiseres alltid mot user_id før skriving, siden backend forbigår RLS.
"""
import uuid

# Øvre tak på antall sett per øvelse. `sets` kan komme fra LLM eller klient og
# blir til én rad per sett i template_exercise_sets — uten tak kan ett kall
# skrive vilkårlig mange rader (skrive-amplifikasjon). 50 er romslig for ekte program.
MAX_SETS = 50


class TemplateNotFound(Exception):
    """Malen finnes ikke eller eies ikke av brukeren."""


class ExerciseNotInTemplate(Exception):
    """Øvelsen finnes ikke i malen."""


async def _assert_template_owned(conn, template_id: str, user_id: str) -> None:
    cur = await conn.execute(
        "SELECT id FROM workout_templates WHERE id = %s AND user_id = %s",
        (template_id, user_id),
    )
    if await cur.fetchone() is None:
        raise TemplateNotFound()


async def add_exercise(
    conn, user_id: str, template_id: str, exercise_id: str,
    sets: int = 3, reps: int = 10, weight_kg: float | None = None,
) -> str:
    """Legg en øvelse til malen, lag N (clampet) template_exercise_sets-rader.

    Returnerer template_exercise-id-en. Raiser TemplateNotFound."""
    await _assert_template_owned(conn, template_id, user_id)

    cur = await conn.execute(
        "SELECT COALESCE(MAX(position) + 1, 0) FROM template_exercises WHERE template_id = %s",
        (template_id,),
    )
    position = (await cur.fetchone())[0]

    te_id = str(uuid.uuid4())
    await conn.execute(
        "INSERT INTO template_exercises (id, template_id, exercise_id, position) "
        "VALUES (%s, %s, %s, %s)",
        (te_id, template_id, exercise_id, position),
    )
    for n in range(1, min(sets, MAX_SETS) + 1):
        await conn.execute(
            "INSERT INTO template_exercise_sets "
            "(id, template_exercise_id, set_number, reps, weight_kg) "
            "VALUES (%s, %s, %s, %s, %s)",
            (str(uuid.uuid4()), te_id, n, reps, weight_kg),
        )
    return te_id


async def remove_exercise(conn, user_id: str, template_id: str, exercise_id: str) -> None:
    """Fjern en øvelse fra malen. Raiser TemplateNotFound / ExerciseNotInTemplate."""
    await _assert_template_owned(conn, template_id, user_id)
    cur = await conn.execute(
        "DELETE FROM template_exercises "
        "WHERE template_id = %s AND exercise_id = %s RETURNING id",
        (template_id, exercise_id),
    )
    if await cur.fetchone() is None:
        raise ExerciseNotInTemplate()


async def update_sets(
    conn, user_id: str, template_id: str, exercise_id: str,
    sets: int | None = None, reps: int | None = None, weight_kg: float | None = ...,
) -> None:
    """Oppdater sett-antall, reps og/eller vekt for en øvelse i malen.

    Sett lagres per-rad; endring av `sets` justerer antall rader (clampet til
    MAX_SETS), endring av reps/weight_kg oppdaterer alle rader. `weight_kg=...`
    (Ellipsis) betyr «ikke oppgitt»; None betyr «sett til NULL».
    Raiser ExerciseNotInTemplate."""
    cur = await conn.execute(
        "SELECT te.id FROM template_exercises te "
        "JOIN workout_templates wt ON wt.id = te.template_id "
        "WHERE te.exercise_id = %s AND te.template_id = %s AND wt.user_id = %s",
        (exercise_id, template_id, user_id),
    )
    row = await cur.fetchone()
    if row is None:
        raise ExerciseNotInTemplate()
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
        target = min(sets, MAX_SETS)
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
