import logging
import uuid
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from app.db import get_conn
from app.auth import get_current_user_id
from app.services.next_workout import suggest_next_template
from app.services import template_exercises as te_service

logger = logging.getLogger(__name__)
router = APIRouter()


class TemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    folder_id: str | None = None


class TemplatePatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    folder_id: str | None = None
    position: int | None = None


async def _folder_belongs_to_user(conn, folder_id: str, user_id: str) -> bool:
    cur = await conn.execute(
        "SELECT 1 FROM template_folders WHERE id = %s AND user_id = %s",
        (folder_id, user_id),
    )
    return await cur.fetchone() is not None


@router.get("/templates")
async def list_templates(request: Request) -> list:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT t.id, t.name, t.folder_id,
                       (SELECT COUNT(*) FROM template_exercises te WHERE te.template_id = t.id)::int
                FROM workout_templates t
                WHERE t.user_id = %s AND t.archived_at IS NULL
                ORDER BY t.position, t.created_at
                """,
                (user_id,),
            )
            rows = await cur.fetchall()
    except Exception:
        logger.exception("list_templates failed")
        return []
    return [
        {"id": str(r[0]), "name": r[1], "folder_id": str(r[2]) if r[2] else None, "exercise_count": r[3]}
        for r in rows
    ]


@router.post("/templates", status_code=201)
async def create_template(request: Request, body: TemplateCreate) -> dict:
    user_id = get_current_user_id(request)
    template_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            if body.folder_id is not None and not await _folder_belongs_to_user(conn, body.folder_id, user_id):
                raise HTTPException(status_code=404, detail="Folder not found")
            cur = await conn.execute(
                "INSERT INTO workout_templates (id, user_id, name, folder_id) "
                "VALUES (%s, %s, %s, %s) RETURNING id, name",
                (template_id, user_id, body.name.strip(), body.folder_id),
            )
            row = await cur.fetchone()
            await conn.commit()
    except HTTPException:
        raise
    except Exception:
        logger.exception("create_template failed")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"id": str(row[0]), "name": row[1]}


@router.patch("/templates/{template_id}")
async def update_template(template_id: str, request: Request, body: TemplatePatch) -> dict:
    user_id = get_current_user_id(request)
    updates: list[str] = []
    params: list = []
    if body.name is not None:
        updates.append("name = %s"); params.append(body.name.strip())
    if body.position is not None:
        updates.append("position = %s"); params.append(body.position)
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT id FROM workout_templates WHERE id = %s AND user_id = %s",
            (template_id, user_id),
        )
        if await cur.fetchone() is None:
            raise HTTPException(status_code=404, detail="Template not found")
        if "folder_id" in body.model_fields_set:
            if body.folder_id is not None and not await _folder_belongs_to_user(conn, body.folder_id, user_id):
                raise HTTPException(status_code=404, detail="Folder not found")
            updates.append("folder_id = %s"); params.append(body.folder_id)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        params.extend([template_id, user_id])
        await conn.execute(
            f"UPDATE workout_templates SET {', '.join(updates)} WHERE id = %s AND user_id = %s",
            params,
        )
        await conn.commit()
    return {"id": template_id, "status": "updated"}


@router.get("/templates/{template_id}")
async def get_template(template_id: str, request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT id, name, folder_id FROM workout_templates "
            "WHERE id = %s AND user_id = %s AND archived_at IS NULL",
            (template_id, user_id),
        )
        head = await cur.fetchone()
        if head is None:
            raise HTTPException(status_code=404, detail="Template not found")
        cur = await conn.execute(
            """
            SELECT te.id, te.exercise_id, te.position,
                   s.id, s.set_number, s.reps, s.weight_kg::float
            FROM template_exercises te
            LEFT JOIN template_exercise_sets s ON s.template_exercise_id = te.id
            WHERE te.template_id = %s
            ORDER BY te.position, s.set_number
            """,
            (template_id,),
        )
        rows = await cur.fetchall()

    exercises: list[dict] = []
    by_te: dict = {}
    for te_id, ex_id, pos, set_id, set_num, reps, weight in rows:
        te = by_te.get(te_id)
        if te is None:
            te = {"id": str(te_id), "exercise_id": ex_id, "position": pos, "sets": []}
            by_te[te_id] = te
            exercises.append(te)
        if set_id is not None:
            te["sets"].append({"id": str(set_id), "set_number": set_num, "reps": reps, "weight_kg": weight})
    return {"id": str(head[0]), "name": head[1],
            "folder_id": str(head[2]) if head[2] else None, "exercises": exercises}


@router.get("/coach/next-workout")
async def next_workout_endpoint(request: Request) -> dict:
    user_id = get_current_user_id(request)
    suggestion = await suggest_next_template(user_id)
    if suggestion is None:
        return {"template_id": None, "name": None, "reason": None}
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT name FROM workout_templates WHERE id = %s AND user_id = %s",
            (suggestion["template_id"], user_id),
        )
        row = await cur.fetchone()
    return {"template_id": suggestion["template_id"],
            "name": row[0] if row else None,
            "reason": suggestion["reason"]}


class FromWorkoutBody(BaseModel):
    workout_id: str
    name: str = Field(min_length=1, max_length=120)
    folder_id: str | None = None


@router.post("/templates/from-workout", status_code=201)
async def template_from_workout(request: Request, body: FromWorkoutBody) -> dict:
    user_id = get_current_user_id(request)
    template_id = str(uuid.uuid4())
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT id FROM workouts WHERE id = %s AND user_id = %s",
            (body.workout_id, user_id),
        )
        if await cur.fetchone() is None:
            raise HTTPException(status_code=404, detail="Workout not found")
        cur = await conn.execute(
            """
            SELECT exercise_id, MAX(set_number) AS sets,
                   array_agg(reps ORDER BY set_number) AS reps,
                   array_agg(weight_kg ORDER BY set_number) AS weights
            FROM workout_sets WHERE workout_id = %s GROUP BY exercise_id
            """,
            (body.workout_id,),
        )
        grouped = await cur.fetchall()
        if not grouped:
            raise HTTPException(status_code=400, detail="Workout has no logged sets")
        if body.folder_id is not None and not await _folder_belongs_to_user(conn, body.folder_id, user_id):
            raise HTTPException(status_code=404, detail="Folder not found")
        await conn.execute(
            "INSERT INTO workout_templates (id, user_id, name, folder_id) VALUES (%s, %s, %s, %s)",
            (template_id, user_id, body.name.strip(), body.folder_id),
        )
        for pos, (ex_id, _sets, reps_arr, weight_arr) in enumerate(grouped):
            te_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO template_exercises (id, template_id, exercise_id, position) VALUES (%s, %s, %s, %s)",
                (te_id, template_id, ex_id, pos),
            )
            for i, (reps, weight) in enumerate(zip(reps_arr, weight_arr), start=1):
                await conn.execute(
                    "INSERT INTO template_exercise_sets (id, template_exercise_id, set_number, reps, weight_kg) "
                    "VALUES (%s, %s, %s, %s, %s)",
                    (str(uuid.uuid4()), te_id, i, reps, weight),
                )
        await conn.commit()
    return {"id": template_id, "name": body.name.strip()}


@router.delete("/templates/{template_id}", status_code=200)
async def delete_template(template_id: str, request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            "DELETE FROM workout_templates WHERE id = %s AND user_id = %s RETURNING id",
            (template_id, user_id),
        )
        row = await cur.fetchone()
        await conn.commit()
    if row is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"status": "deleted"}


# ── Øvelse-redigering ─────────────────────────────────────────────────
# Delt logikk i app/services/template_exercises.py (samme som LLM-tool-handlerne).

class TemplateExerciseCreate(BaseModel):
    exercise_id: str = Field(min_length=1)
    sets: int = Field(3, ge=1, le=te_service.MAX_SETS)
    reps: int = Field(10, ge=1, le=1000)
    weight_kg: float | None = Field(None, ge=0)


class TemplateExercisePatch(BaseModel):
    sets: int | None = Field(None, ge=1, le=te_service.MAX_SETS)
    reps: int | None = Field(None, ge=1, le=1000)
    weight_kg: float | None = Field(None, ge=0)


@router.post("/templates/{template_id}/exercises", status_code=201)
async def add_template_exercise(template_id: str, request: Request, body: TemplateExerciseCreate) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            te_id = await te_service.add_exercise(
                conn, user_id, template_id, body.exercise_id, body.sets, body.reps, body.weight_kg,
            )
            await conn.commit()
    except te_service.TemplateNotFound:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"template_exercise_id": te_id, "exercise_id": body.exercise_id}


@router.delete("/templates/{template_id}/exercises/{exercise_id}", status_code=200)
async def remove_template_exercise(template_id: str, exercise_id: str, request: Request) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            await te_service.remove_exercise(conn, user_id, template_id, exercise_id)
            await conn.commit()
    except te_service.TemplateNotFound:
        raise HTTPException(status_code=404, detail="Template not found")
    except te_service.ExerciseNotInTemplate:
        raise HTTPException(status_code=404, detail="Exercise not found in template")
    return {"status": "deleted"}


@router.patch("/templates/{template_id}/exercises/{exercise_id}")
async def update_template_exercise(template_id: str, exercise_id: str, request: Request, body: TemplateExercisePatch) -> dict:
    user_id = get_current_user_id(request)
    # Skill «ikke sendt» fra «satt til null» for weight_kg (samme mønster som folder_id).
    weight = body.weight_kg if "weight_kg" in body.model_fields_set else ...
    if body.sets is None and body.reps is None and "weight_kg" not in body.model_fields_set:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        async with get_conn() as conn:
            await te_service.update_sets(
                conn, user_id, template_id, exercise_id, body.sets, body.reps, weight,
            )
            await conn.commit()
    except te_service.ExerciseNotInTemplate:
        raise HTTPException(status_code=404, detail="Exercise not found in template")
    return {"id": exercise_id, "status": "updated"}
