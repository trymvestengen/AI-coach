from fastapi import APIRouter, Request, HTTPException
from app.db import get_conn
from app.auth import get_current_user_id

router = APIRouter(prefix="/api")

ALLOWED_SEVERITY = {"lett", "moderat", "alvorlig"}
ALLOWED_PREFERENCE_CATEGORY = {"exercise", "time", "intensity", "other"}
ALLOWED_CONSTRAINT_TYPE = {"schedule", "duration", "frequency"}


# ---------------- Injuries ----------------

@router.post("/users/injuries")
async def create_injury(request: Request, body: dict) -> dict:
    user_id = get_current_user_id(request)
    if "body_part" not in body:
        raise HTTPException(status_code=400, detail="body_part is required")
    if body.get("severity") and body["severity"] not in ALLOWED_SEVERITY:
        raise HTTPException(status_code=400, detail=f"severity must be one of {sorted(ALLOWED_SEVERITY)}")

    async with get_conn() as conn:
        cur = await conn.execute(
            "INSERT INTO user_injuries (user_id, body_part, description, severity, started_at, is_active) "
            "VALUES (%s, %s, %s, %s, %s, COALESCE(%s, true)) "
            "RETURNING id, body_part, description, severity, started_at, is_active",
            (
                user_id,
                body["body_part"],
                body.get("description"),
                body.get("severity"),
                body.get("started_at"),
                body.get("is_active"),
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
async def create_preference(request: Request, body: dict) -> dict:
    user_id = get_current_user_id(request)
    if "category" not in body or "preference" not in body:
        raise HTTPException(status_code=400, detail="category and preference required")
    if body["category"] not in ALLOWED_PREFERENCE_CATEGORY:
        raise HTTPException(status_code=400, detail=f"category must be one of {sorted(ALLOWED_PREFERENCE_CATEGORY)}")

    async with get_conn() as conn:
        cur = await conn.execute(
            "INSERT INTO user_preferences (user_id, category, preference) "
            "VALUES (%s, %s, %s) RETURNING id, category, preference",
            (user_id, body["category"], body["preference"]),
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
