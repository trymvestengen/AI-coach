from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field
from app.db import get_conn
from app.auth import get_current_user_id

router = APIRouter(prefix="/api")

ALLOWED_SEVERITY = {"lett", "moderat", "alvorlig"}
ALLOWED_PREFERENCE_CATEGORY = {"exercise", "time", "intensity", "other"}
ALLOWED_CONSTRAINT_TYPE = {"schedule", "duration", "frequency"}

# Tak på fritekstfelter (H6): hindrer at en klient lagrer vilkårlig store strenger.
# Enum-feltene (severity/category/type) holdes som str her og valideres manuelt
# nedenfor med 400 — Pydantic Literal ville gitt 422 og brutt API-kontrakten.
MAX_TEXT = 500
MAX_LABEL = 100


class InjuryCreate(BaseModel):
    body_part: str = Field(min_length=1, max_length=MAX_LABEL)
    description: str | None = Field(default=None, max_length=MAX_TEXT)
    severity: str | None = None
    started_at: str | None = None
    is_active: bool | None = None


class PreferenceCreate(BaseModel):
    category: str
    preference: str = Field(min_length=1, max_length=MAX_TEXT)


class EquipmentCreate(BaseModel):
    equipment: str = Field(min_length=1, max_length=MAX_LABEL)


class ConstraintCreate(BaseModel):
    type: str
    description: str = Field(min_length=1, max_length=MAX_TEXT)


# ---------------- Injuries ----------------

@router.post("/users/injuries")
async def create_injury(request: Request, body: InjuryCreate) -> dict:
    user_id = get_current_user_id(request)
    if body.severity and body.severity not in ALLOWED_SEVERITY:
        raise HTTPException(status_code=400, detail=f"severity must be one of {sorted(ALLOWED_SEVERITY)}")

    async with get_conn() as conn:
        cur = await conn.execute(
            "INSERT INTO user_injuries (user_id, body_part, description, severity, started_at, is_active) "
            "VALUES (%s, %s, %s, %s, %s, COALESCE(%s, true)) "
            "RETURNING id, body_part, description, severity, started_at, is_active",
            (
                user_id,
                body.body_part,
                body.description,
                body.severity,
                body.started_at,
                body.is_active,
            ),
        )
        row = await cur.fetchone()
        await conn.commit()

    return {
        "id": row[0],
        "body_part": row[1],
        "description": row[2],
        "severity": row[3],
        "started_at": str(row[4]) if row[4] else None,
        "is_active": row[5],
    }


@router.patch("/users/injuries/{injury_id}")
async def update_injury(injury_id: str, request: Request, body: dict) -> dict:
    user_id = get_current_user_id(request)
    allowed = {"body_part", "description", "severity", "started_at", "is_active"}
    bad_keys = [k for k in body.keys() if k not in allowed]
    if bad_keys:
        raise HTTPException(status_code=400, detail=f"Field(s) not allowed: {bad_keys}")
    if body.get("severity") and body["severity"] not in ALLOWED_SEVERITY:
        raise HTTPException(status_code=400, detail=f"severity must be one of {sorted(ALLOWED_SEVERITY)}")
    if not body:
        raise HTTPException(status_code=400, detail="Body is empty")

    set_clauses = ", ".join(f"{k} = %s" for k in body.keys())
    params = list(body.values()) + [injury_id, user_id]
    async with get_conn() as conn:
        cur = await conn.execute(
            f"UPDATE user_injuries SET {set_clauses} WHERE id = %s AND user_id = %s "
            f"RETURNING id, body_part, description, severity, started_at, is_active",
            params,
        )
        row = await cur.fetchone()
        await conn.commit()

    if row is None:
        raise HTTPException(status_code=404, detail="Injury not found")
    return {
        "id": row[0],
        "body_part": row[1],
        "description": row[2],
        "severity": row[3],
        "started_at": str(row[4]) if row[4] else None,
        "is_active": row[5],
    }


@router.delete("/users/injuries/{injury_id}")
async def delete_injury(injury_id: str, request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            "DELETE FROM user_injuries WHERE id = %s AND user_id = %s",
            (injury_id, user_id),
        )
        await conn.commit()
    if getattr(cur, "rowcount", 0) == 0:
        raise HTTPException(status_code=404, detail="Injury not found")
    return {"status": "deleted"}


# ---------------- Preferences ----------------

@router.post("/users/preferences")
async def create_preference(request: Request, body: PreferenceCreate) -> dict:
    user_id = get_current_user_id(request)
    if body.category not in ALLOWED_PREFERENCE_CATEGORY:
        raise HTTPException(status_code=400, detail=f"category must be one of {sorted(ALLOWED_PREFERENCE_CATEGORY)}")

    async with get_conn() as conn:
        cur = await conn.execute(
            "INSERT INTO user_preferences (user_id, category, preference) "
            "VALUES (%s, %s, %s) RETURNING id, category, preference",
            (user_id, body.category, body.preference),
        )
        row = await cur.fetchone()
        await conn.commit()

    return {"id": row[0], "category": row[1], "preference": row[2]}


@router.patch("/users/preferences/{pref_id}")
async def update_preference(pref_id: str, request: Request, body: dict) -> dict:
    user_id = get_current_user_id(request)
    allowed = {"category", "preference"}
    bad_keys = [k for k in body.keys() if k not in allowed]
    if bad_keys:
        raise HTTPException(status_code=400, detail=f"Field(s) not allowed: {bad_keys}")
    if body.get("category") and body["category"] not in ALLOWED_PREFERENCE_CATEGORY:
        raise HTTPException(status_code=400, detail=f"category must be one of {sorted(ALLOWED_PREFERENCE_CATEGORY)}")
    if not body:
        raise HTTPException(status_code=400, detail="Body is empty")

    set_clauses = ", ".join(f"{k} = %s" for k in body.keys())
    params = list(body.values()) + [pref_id, user_id]
    async with get_conn() as conn:
        cur = await conn.execute(
            f"UPDATE user_preferences SET {set_clauses} WHERE id = %s AND user_id = %s "
            f"RETURNING id, category, preference",
            params,
        )
        row = await cur.fetchone()
        await conn.commit()
    if row is None:
        raise HTTPException(status_code=404, detail="Preference not found")
    return {"id": row[0], "category": row[1], "preference": row[2]}


@router.delete("/users/preferences/{pref_id}")
async def delete_preference(pref_id: str, request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            "DELETE FROM user_preferences WHERE id = %s AND user_id = %s",
            (pref_id, user_id),
        )
        await conn.commit()
    if getattr(cur, "rowcount", 0) == 0:
        raise HTTPException(status_code=404, detail="Preference not found")
    return {"status": "deleted"}


# ---------------- Equipment ----------------

@router.post("/users/equipment")
async def create_equipment(request: Request, body: EquipmentCreate) -> dict:
    user_id = get_current_user_id(request)

    async with get_conn() as conn:
        await conn.execute(
            "INSERT INTO user_equipment (user_id, equipment) VALUES (%s, %s) "
            "ON CONFLICT DO NOTHING",
            (user_id, body.equipment),
        )
        await conn.commit()

    return {"equipment": body.equipment}


@router.delete("/users/equipment/{equipment}")
async def delete_equipment(equipment: str, request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            "DELETE FROM user_equipment WHERE user_id = %s AND equipment = %s",
            (user_id, equipment),
        )
        await conn.commit()
    if getattr(cur, "rowcount", 0) == 0:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return {"status": "deleted"}


# ---------------- Constraints ----------------

@router.post("/users/constraints")
async def create_constraint(request: Request, body: ConstraintCreate) -> dict:
    user_id = get_current_user_id(request)
    if body.type not in ALLOWED_CONSTRAINT_TYPE:
        raise HTTPException(status_code=400, detail=f"type must be one of {sorted(ALLOWED_CONSTRAINT_TYPE)}")

    async with get_conn() as conn:
        cur = await conn.execute(
            "INSERT INTO user_constraints (user_id, type, description) "
            "VALUES (%s, %s, %s) RETURNING id, type, description",
            (user_id, body.type, body.description),
        )
        row = await cur.fetchone()
        await conn.commit()

    return {"id": row[0], "type": row[1], "description": row[2]}


@router.patch("/users/constraints/{c_id}")
async def update_constraint(c_id: str, request: Request, body: dict) -> dict:
    user_id = get_current_user_id(request)
    allowed = {"type", "description"}
    bad_keys = [k for k in body.keys() if k not in allowed]
    if bad_keys:
        raise HTTPException(status_code=400, detail=f"Field(s) not allowed: {bad_keys}")
    if body.get("type") and body["type"] not in ALLOWED_CONSTRAINT_TYPE:
        raise HTTPException(status_code=400, detail=f"type must be one of {sorted(ALLOWED_CONSTRAINT_TYPE)}")
    if not body:
        raise HTTPException(status_code=400, detail="Body is empty")

    set_clauses = ", ".join(f"{k} = %s" for k in body.keys())
    params = list(body.values()) + [c_id, user_id]
    async with get_conn() as conn:
        cur = await conn.execute(
            f"UPDATE user_constraints SET {set_clauses} WHERE id = %s AND user_id = %s "
            f"RETURNING id, type, description",
            params,
        )
        row = await cur.fetchone()
        await conn.commit()
    if row is None:
        raise HTTPException(status_code=404, detail="Constraint not found")
    return {"id": row[0], "type": row[1], "description": row[2]}


@router.delete("/users/constraints/{c_id}")
async def delete_constraint(c_id: str, request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            "DELETE FROM user_constraints WHERE id = %s AND user_id = %s",
            (c_id, user_id),
        )
        await conn.commit()
    if getattr(cur, "rowcount", 0) == 0:
        raise HTTPException(status_code=404, detail="Constraint not found")
    return {"status": "deleted"}
