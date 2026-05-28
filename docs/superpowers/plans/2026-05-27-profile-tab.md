# Profile-tab UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Profile-tab UI that lets the user view and edit all Lag 1 profile data (existing fields + new fields + injuries/preferences/equipment/constraints lists) via bottom-sheet modals. Coach automatically benefits via the existing `get_user_profile` tool.

**Architecture:** Server-rendered page renders 8 sections; each editable field opens a Radix-UI bottom sheet (client component). Backend gets one extended GET, one PATCH, and CRUD endpoints for the 4 Lag 1 list resources. DB migration adds 4 new columns to `users`.

**Tech Stack:** Next.js 16 + TypeScript + Tailwind v4 + Radix UI; FastAPI + psycopg + pytest; Vitest + React Testing Library for frontend tests.

**Spec:** [docs/superpowers/specs/2026-05-27-profile-tab-design.md](../specs/2026-05-27-profile-tab-design.md)

---

## File Structure

**Created:**
- `api/db/migrations/008_profile_fields.sql`
- `api/app/routers/profile.py` — new CRUD endpoints for injuries/preferences/equipment/constraints
- `web/src/lib/profile.ts` — API client
- `web/src/components/profile/ProfileSection.tsx`
- `web/src/components/profile/ProfileField.tsx`
- `web/src/components/profile/ProfileList.tsx`
- `web/src/components/profile/sheets/EditTextSheet.tsx`
- `web/src/components/profile/sheets/EditChoiceSheet.tsx`
- `web/src/components/profile/sheets/EditMultiSelectSheet.tsx`
- `web/src/components/profile/sheets/EditInjurySheet.tsx`
- `web/src/components/profile/sheets/EditPreferenceSheet.tsx`
- `web/src/components/profile/sheets/EditConstraintSheet.tsx`
- `web/src/components/profile/sheets/EquipmentSheet.tsx`
- `api/tests/test_profile_router.py`
- `web/src/components/profile/*.test.tsx` — co-located smoke tests

**Modified:**
- `api/app/routers/users.py` — extend `GET /api/users/profile` + add `PATCH /api/users/profile`
- `api/app/main.py` — register new profile router
- `web/src/app/(tabs)/profile/page.tsx` — rewrite to use new components

---

## Phase A — DB migration

### Task 1: Migration `008_profile_fields.sql`

**Files:**
- Create: `api/db/migrations/008_profile_fields.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- api/db/migrations/008_profile_fields.sql
-- Add 4 new fields to users for finer-grained coach context.

ALTER TABLE users
  ADD COLUMN activity_level             TEXT,
  ADD COLUMN years_training             INTEGER,
  ADD COLUMN preferred_training_time    TEXT,
  ADD COLUMN max_session_duration_min   INTEGER;
```

- [ ] **Step 2: Apply migration**

```bash
DB_URL=$(grep DATABASE_URL /Users/trymvestengen/Desktop/ai-coach/api/.env | cut -d= -f2-)
# Apply via the same method used for 007 (psql, supabase CLI, or psycopg script)
```

Verify column additions:
```bash
psql "$DB_URL" -c "\d users" | grep -E "activity_level|years_training|preferred_training_time|max_session_duration_min"
```

Expected: 4 rows shown.

- [ ] **Step 3: Verify existing tests still pass**

```bash
cd api && .venv/bin/pytest 2>&1 | tail -5
```

Expected: 91 passing (memory architecture baseline).

- [ ] **Step 4: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/db/migrations/008_profile_fields.sql
git commit -m "feat(db): add 4 profile fields (activity_level, years_training, preferred_training_time, max_session_duration_min)"
```

---

## Phase B — Backend: extend GET, add PATCH

### Task 2: Extend `GET /api/users/profile` to include Lag 1 data

**Files:**
- Modify: `api/app/routers/users.py`
- Modify: `api/tests/test_users_router.py`

- [ ] **Step 1: Write failing test**

Append to `api/tests/test_users_router.py`:

```python
@pytest.mark.asyncio
async def test_get_profile_returns_lag1_data(monkeypatch, mock_conn, make_mock_get_conn):
    """GET /api/users/profile returns injuries, preferences, equipment, constraints plus new fields."""
    user_row = (
        "u-1", "trym@example.com", "Trym", "Vestengen",
        ["build_muscle"], "intermediate", 4,
        "male", "1995-06-01", 180, 75.5, None, "no", "friend", "Bygge muskler",
        "moderate", 3, "evening", 60,
    )
    injury_rows = [("inj-1", "venstre kne", "vondt", "moderat", "2019-03-01", True)]
    preference_rows = [("pref-1", "exercise", "liker ikke beinpress")]
    equipment_rows = [("barbell",), ("dumbbells_20kg",)]
    constraint_rows = [("con-1", "schedule", "kun tirs/tors/lør")]

    cur = AsyncMock()
    cur.fetchone = AsyncMock(side_effect=[user_row])
    cur.fetchall = AsyncMock(side_effect=[injury_rows, preference_rows, equipment_rows, constraint_rows])
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.users.get_conn", make_mock_get_conn(mock_conn))

    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    resp = client.get("/api/users/profile")
    assert resp.status_code == 200
    body = resp.json()
    assert body["activity_level"] == "moderate"
    assert body["years_training"] == 3
    assert body["preferred_training_time"] == "evening"
    assert body["max_session_duration_min"] == 60
    assert body["injuries"][0]["body_part"] == "venstre kne"
    assert body["preferences"][0]["preference"] == "liker ikke beinpress"
    assert body["equipment"] == ["barbell", "dumbbells_20kg"]
    assert body["constraints"][0]["description"] == "kun tirs/tors/lør"
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd api && .venv/bin/pytest tests/test_users_router.py::test_get_profile_returns_lag1_data -v 2>&1 | tail -10
```

Expected: FAIL (current GET doesn't return Lag 1 data).

- [ ] **Step 3: Update `GET /api/users/profile`**

In `api/app/routers/users.py`, find `get_user_profile` (line ~24). Replace its body so it returns all Lag 1 lists plus the 4 new users-columns. Use the SELECT pattern from `app/tools/memory_handlers.py::get_user_profile` as reference (already verified working).

Concretely, the function should:
1. SELECT all user columns (include the 4 new ones)
2. SELECT from `user_injuries WHERE user_id = ? AND is_active = true` (or include inactive too — show all in UI but filter visually)
3. SELECT from `user_preferences`, `user_equipment`, `user_constraints`
4. Return a single dict with everything

If the existing function used Pydantic models or response_model, update those too.

- [ ] **Step 4: Run tests**

```bash
cd api && .venv/bin/pytest tests/test_users_router.py -v 2>&1 | tail -10
```

Expected: all passing including new test.

- [ ] **Step 5: Run full suite**

```bash
cd api && .venv/bin/pytest 2>&1 | tail -5
```

Expected: 92 passed (91 + 1 new).

- [ ] **Step 6: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/routers/users.py api/tests/test_users_router.py
git commit -m "feat(api): extend GET /api/users/profile to include lag 1 data"
```

---

### Task 3: Add `PATCH /api/users/profile`

**Files:**
- Modify: `api/app/routers/users.py`
- Modify: `api/tests/test_users_router.py`

- [ ] **Step 1: Write failing test**

Append to `api/tests/test_users_router.py`:

```python
@pytest.mark.asyncio
async def test_patch_profile_updates_allowed_fields(monkeypatch, mock_conn, make_mock_get_conn):
    captured = {}

    async def fake_execute(sql, params=None):
        captured.setdefault("calls", []).append((sql, params))
        cur = AsyncMock()
        cur.fetchone = AsyncMock(return_value=None)
        return cur

    mock_conn.execute = fake_execute
    monkeypatch.setattr("app.routers.users.get_conn", make_mock_get_conn(mock_conn))

    # The PATCH endpoint will also call GET-style queries to return the refreshed profile.
    # We allow the test to focus on the UPDATE call.

    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    resp = client.patch("/api/users/profile", json={
        "weight_kg": 76.0,
        "activity_level": "moderate",
    })
    assert resp.status_code in (200, 204)

    update_calls = [c for c in captured["calls"] if c[0].strip().upper().startswith("UPDATE USERS")]
    assert update_calls, "expected at least one UPDATE users statement"
    assert any("weight_kg" in c[0] for c in update_calls)
    assert any("activity_level" in c[0] for c in update_calls)


@pytest.mark.asyncio
async def test_patch_profile_rejects_unknown_field(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.routers.users.get_conn", make_mock_get_conn(mock_conn))
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    resp = client.patch("/api/users/profile", json={"persona_mode": "sergeant"})  # not whitelisted
    assert resp.status_code == 400
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd api && .venv/bin/pytest tests/test_users_router.py -v 2>&1 | tail -10
```

Expected: 2 new tests FAIL.

- [ ] **Step 3: Implement `PATCH /api/users/profile`**

Add to `api/app/routers/users.py`:

```python
ALLOWED_PATCH_FIELDS = {
    "first_name", "last_name",
    "goals", "experience_level", "training_days_per_week",
    "height_cm", "weight_kg",
    "activity_level", "years_training", "preferred_training_time", "max_session_duration_min",
}


@router.patch("/users/profile")
async def patch_user_profile(request: Request, body: dict) -> dict:
    user_id = get_current_user_id(request)
    bad_keys = [k for k in body.keys() if k not in ALLOWED_PATCH_FIELDS]
    if bad_keys:
        raise HTTPException(status_code=400, detail=f"Field(s) not allowed: {bad_keys}")
    if not body:
        raise HTTPException(status_code=400, detail="Body is empty")

    set_clauses = ", ".join(f"{k} = %s" for k in body.keys())
    params = list(body.values()) + [user_id]

    async with get_conn() as conn:
        await conn.execute(
            f"UPDATE users SET {set_clauses} WHERE id = %s",
            params,
        )
        await conn.commit()

    # Return the fresh profile by reusing get_user_profile logic
    return await get_user_profile(request)
```

Add imports if needed: `from fastapi import HTTPException`.

- [ ] **Step 4: Run tests**

```bash
cd api && .venv/bin/pytest tests/test_users_router.py -v 2>&1 | tail -10
```

Expected: all pass.

- [ ] **Step 5: Full suite**

```bash
cd api && .venv/bin/pytest 2>&1 | tail -5
```

Expected: 94 passed (92 + 2 new).

- [ ] **Step 6: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/routers/users.py api/tests/test_users_router.py
git commit -m "feat(api): add PATCH /api/users/profile for partial updates"
```

---

## Phase C — Backend: Lag 1 CRUD endpoints

### Task 4: Injuries CRUD router

**Files:**
- Create: `api/app/routers/profile.py`
- Modify: `api/app/main.py`
- Create: `api/tests/test_profile_router.py`

- [ ] **Step 1: Write failing tests**

Create `api/tests/test_profile_router.py`:

```python
import pytest
from unittest.mock import AsyncMock
from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_create_injury_inserts_row(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(
        "inj-1", "venstre kne", "vondt ved knebøy", "moderat", "2019-03-01", True,
    ))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.profile.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.post("/api/users/injuries", json={
        "body_part": "venstre kne",
        "description": "vondt ved knebøy",
        "severity": "moderat",
        "started_at": "2019-03-01",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["body_part"] == "venstre kne"
    assert body["severity"] == "moderat"


@pytest.mark.asyncio
async def test_update_injury(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(
        "inj-1", "venstre kne", "redusert smerte", "lett", "2019-03-01", True,
    ))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.profile.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.patch("/api/users/injuries/inj-1", json={
        "description": "redusert smerte",
        "severity": "lett",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["description"] == "redusert smerte"


@pytest.mark.asyncio
async def test_delete_injury(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.rowcount = 1
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.profile.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.delete("/api/users/injuries/inj-1")
    assert resp.status_code == 200
    assert resp.json()["status"] == "deleted"
```

- [ ] **Step 2: Run to verify failure**

```bash
cd api && .venv/bin/pytest tests/test_profile_router.py -v 2>&1 | tail -15
```

Expected: FAIL (router not registered).

- [ ] **Step 3: Create `api/app/routers/profile.py`**

```python
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
```

- [ ] **Step 4: Register router in `api/app/main.py`**

```python
from app.routers import profile
# ...
app.include_router(profile.router)
```

Place near the other `app.include_router(...)` calls.

- [ ] **Step 5: Run tests**

```bash
cd api && .venv/bin/pytest tests/test_profile_router.py -v 2>&1 | tail -15
```

Expected: 3 tests pass.

- [ ] **Step 6: Full suite**

```bash
cd api && .venv/bin/pytest 2>&1 | tail -5
```

Expected: 97 passed.

- [ ] **Step 7: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/routers/profile.py api/app/main.py api/tests/test_profile_router.py
git commit -m "feat(api): add user_injuries CRUD endpoints"
```

---

### Task 5: Preferences CRUD endpoints

**Files:**
- Modify: `api/app/routers/profile.py`
- Modify: `api/tests/test_profile_router.py`

- [ ] **Step 1: Write failing tests**

Append to `api/tests/test_profile_router.py`:

```python
@pytest.mark.asyncio
async def test_create_preference(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("pref-1", "exercise", "liker ikke beinpress"))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.profile.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.post("/api/users/preferences", json={"category": "exercise", "preference": "liker ikke beinpress"})
    assert resp.status_code == 200
    assert resp.json()["preference"] == "liker ikke beinpress"


@pytest.mark.asyncio
async def test_create_preference_rejects_invalid_category(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.routers.profile.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.post("/api/users/preferences", json={"category": "bogus", "preference": "x"})
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_delete_preference(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.rowcount = 1
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.profile.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.delete("/api/users/preferences/pref-1")
    assert resp.status_code == 200
```

- [ ] **Step 2: Run to verify failure**

```bash
cd api && .venv/bin/pytest tests/test_profile_router.py -v 2>&1 | tail -10
```

Expected: 3 new tests FAIL.

- [ ] **Step 3: Append preferences endpoints in `api/app/routers/profile.py`**

```python
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
```

- [ ] **Step 4: Run tests**

```bash
cd api && .venv/bin/pytest tests/test_profile_router.py -v 2>&1 | tail -10
```

Expected: 6 tests pass.

- [ ] **Step 5: Full suite**

```bash
cd api && .venv/bin/pytest 2>&1 | tail -5
```

Expected: 100 passed.

- [ ] **Step 6: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/routers/profile.py api/tests/test_profile_router.py
git commit -m "feat(api): add user_preferences CRUD endpoints"
```

---

### Task 6: Equipment endpoints

**Files:**
- Modify: `api/app/routers/profile.py`
- Modify: `api/tests/test_profile_router.py`

- [ ] **Step 1: Write failing tests**

Append:

```python
@pytest.mark.asyncio
async def test_create_equipment(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.profile.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.post("/api/users/equipment", json={"equipment": "barbell"})
    assert resp.status_code == 200
    assert resp.json()["equipment"] == "barbell"


@pytest.mark.asyncio
async def test_delete_equipment(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.rowcount = 1
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.profile.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.delete("/api/users/equipment/barbell")
    assert resp.status_code == 200
```

- [ ] **Step 2: Run to verify failure**

```bash
cd api && .venv/bin/pytest tests/test_profile_router.py -v 2>&1 | tail -10
```

- [ ] **Step 3: Append equipment endpoints**

```python
# ---------------- Equipment ----------------

@router.post("/users/equipment")
async def create_equipment(request: Request, body: dict) -> dict:
    user_id = get_current_user_id(request)
    if "equipment" not in body:
        raise HTTPException(status_code=400, detail="equipment required")

    async with get_conn() as conn:
        await conn.execute(
            "INSERT INTO user_equipment (user_id, equipment) VALUES (%s, %s) "
            "ON CONFLICT DO NOTHING",
            (user_id, body["equipment"]),
        )
        await conn.commit()

    return {"equipment": body["equipment"]}


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
```

- [ ] **Step 4: Run tests**

```bash
cd api && .venv/bin/pytest tests/test_profile_router.py -v 2>&1 | tail -10
```

Expected: 8 tests pass.

- [ ] **Step 5: Full suite**

```bash
cd api && .venv/bin/pytest 2>&1 | tail -5
```

Expected: 102 passed.

- [ ] **Step 6: Commit**

```bash
git add api/app/routers/profile.py api/tests/test_profile_router.py
git commit -m "feat(api): add user_equipment endpoints"
```

---

### Task 7: Constraints CRUD endpoints

**Files:**
- Modify: `api/app/routers/profile.py`
- Modify: `api/tests/test_profile_router.py`

- [ ] **Step 1: Write failing tests**

Append:

```python
@pytest.mark.asyncio
async def test_create_constraint(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("c-1", "schedule", "kun tirs/tors/lør"))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.profile.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.post("/api/users/constraints", json={"type": "schedule", "description": "kun tirs/tors/lør"})
    assert resp.status_code == 200
    assert resp.json()["description"] == "kun tirs/tors/lør"


@pytest.mark.asyncio
async def test_create_constraint_rejects_invalid_type(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.routers.profile.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.post("/api/users/constraints", json={"type": "bogus", "description": "x"})
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_delete_constraint(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.rowcount = 1
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.profile.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.delete("/api/users/constraints/c-1")
    assert resp.status_code == 200
```

- [ ] **Step 2: Run to verify failure**

```bash
cd api && .venv/bin/pytest tests/test_profile_router.py -v 2>&1 | tail -10
```

- [ ] **Step 3: Append constraints endpoints (same pattern as preferences)**

```python
# ---------------- Constraints ----------------

@router.post("/users/constraints")
async def create_constraint(request: Request, body: dict) -> dict:
    user_id = get_current_user_id(request)
    if "type" not in body or "description" not in body:
        raise HTTPException(status_code=400, detail="type and description required")
    if body["type"] not in ALLOWED_CONSTRAINT_TYPE:
        raise HTTPException(status_code=400, detail=f"type must be one of {sorted(ALLOWED_CONSTRAINT_TYPE)}")

    async with get_conn() as conn:
        cur = await conn.execute(
            "INSERT INTO user_constraints (user_id, type, description) "
            "VALUES (%s, %s, %s) RETURNING id, type, description",
            (user_id, body["type"], body["description"]),
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
```

- [ ] **Step 4: Run tests**

```bash
cd api && .venv/bin/pytest tests/test_profile_router.py -v 2>&1 | tail -10
```

Expected: 11 tests pass.

- [ ] **Step 5: Full suite**

```bash
cd api && .venv/bin/pytest 2>&1 | tail -5
```

Expected: 105 passed.

- [ ] **Step 6: Commit**

```bash
git add api/app/routers/profile.py api/tests/test_profile_router.py
git commit -m "feat(api): add user_constraints CRUD endpoints"
```

---

## Phase D — Frontend infrastructure

### Task 8: API client in `web/src/lib/profile.ts`

**Files:**
- Create: `web/src/lib/profile.ts`
- Create: `web/src/lib/profile.test.ts`

- [ ] **Step 1: Write failing test**

Create `web/src/lib/profile.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { updateProfile, addInjury, deleteInjury } from "./profile"

describe("profile API client", () => {
  beforeEach(() => {
    global.fetch = vi.fn() as unknown as typeof fetch
  })

  it("updateProfile PATCHes /api/users/profile with body", async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ weight_kg: 76 }),
    })
    await updateProfile("token-123", { weight_kg: 76 })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/users/profile"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ weight_kg: 76 }),
      }),
    )
  })

  it("addInjury POSTs /api/users/injuries", async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ id: "i-1" }),
    })
    await addInjury("token-123", { body_part: "kne", severity: "lett" })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/users/injuries"),
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("deleteInjury DELETEs /api/users/injuries/{id}", async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ status: "deleted" }),
    })
    await deleteInjury("token-123", "i-1")
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/users/injuries/i-1"),
      expect.objectContaining({ method: "DELETE" }),
    )
  })
})
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd web && npm run test -- profile.test 2>&1 | tail -10
```

Expected: ImportError or test failures.

- [ ] **Step 3: Implement `web/src/lib/profile.ts`**

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export interface UserInjury {
  id: string
  body_part: string
  description: string | null
  severity: string | null
  started_at: string | null
  is_active: boolean
}

export interface UserPreference {
  id: string
  category: string
  preference: string
}

export interface UserConstraint {
  id: string
  type: string
  description: string
}

export interface FullProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  goals: string[] | null
  experience_level: string
  training_days_per_week: number
  gender: string
  birth_date: string | null
  height_cm: number
  weight_kg: number
  avatar_url: string | null
  activity_level: string | null
  years_training: number | null
  preferred_training_time: string | null
  max_session_duration_min: number | null
  injuries: UserInjury[]
  preferences: UserPreference[]
  equipment: string[]
  constraints: UserConstraint[]
}

function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return (await res.json()) as T
}

export async function updateProfile(token: string, patch: Partial<FullProfile>): Promise<FullProfile> {
  const res = await fetch(`${API_BASE}/api/users/profile`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(patch),
  })
  return handle<FullProfile>(res)
}

export async function addInjury(token: string, body: Partial<UserInjury>): Promise<UserInjury> {
  const res = await fetch(`${API_BASE}/api/users/injuries`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return handle<UserInjury>(res)
}

export async function updateInjury(token: string, id: string, body: Partial<UserInjury>): Promise<UserInjury> {
  const res = await fetch(`${API_BASE}/api/users/injuries/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return handle<UserInjury>(res)
}

export async function deleteInjury(token: string, id: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/users/injuries/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  })
  return handle<{ status: string }>(res)
}

export async function addPreference(token: string, body: Partial<UserPreference>): Promise<UserPreference> {
  const res = await fetch(`${API_BASE}/api/users/preferences`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return handle<UserPreference>(res)
}

export async function updatePreference(token: string, id: string, body: Partial<UserPreference>): Promise<UserPreference> {
  const res = await fetch(`${API_BASE}/api/users/preferences/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return handle<UserPreference>(res)
}

export async function deletePreference(token: string, id: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/users/preferences/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  })
  return handle<{ status: string }>(res)
}

export async function addEquipment(token: string, equipment: string): Promise<{ equipment: string }> {
  const res = await fetch(`${API_BASE}/api/users/equipment`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ equipment }),
  })
  return handle<{ equipment: string }>(res)
}

export async function deleteEquipment(token: string, equipment: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/users/equipment/${encodeURIComponent(equipment)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  })
  return handle<{ status: string }>(res)
}

export async function addConstraint(token: string, body: Partial<UserConstraint>): Promise<UserConstraint> {
  const res = await fetch(`${API_BASE}/api/users/constraints`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return handle<UserConstraint>(res)
}

export async function updateConstraint(token: string, id: string, body: Partial<UserConstraint>): Promise<UserConstraint> {
  const res = await fetch(`${API_BASE}/api/users/constraints/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return handle<UserConstraint>(res)
}

export async function deleteConstraint(token: string, id: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/users/constraints/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  })
  return handle<{ status: string }>(res)
}
```

- [ ] **Step 4: Run tests**

```bash
cd web && npm run test -- profile.test 2>&1 | tail -10
```

Expected: 3 tests pass.

- [ ] **Step 5: Full frontend test suite**

```bash
cd web && npm run test 2>&1 | tail -5
```

Expected: 4 tests passing (1 existing smoke + 3 new).

- [ ] **Step 6: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/lib/profile.ts web/src/lib/profile.test.ts
git commit -m "feat(web): add profile API client"
```

---

### Task 9: Layout components (`ProfileSection`, `ProfileField`, `ProfileList`)

**Files:**
- Create: `web/src/components/profile/ProfileSection.tsx`
- Create: `web/src/components/profile/ProfileField.tsx`
- Create: `web/src/components/profile/ProfileList.tsx`
- Create: `web/src/components/profile/ProfileSection.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `web/src/components/profile/ProfileSection.test.tsx`:

```tsx
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import ProfileSection from "./ProfileSection"
import ProfileField from "./ProfileField"
import ProfileList from "./ProfileList"

describe("ProfileSection", () => {
  it("renders title and children", () => {
    render(
      <ProfileSection title="Kropp">
        <div>contents</div>
      </ProfileSection>,
    )
    expect(screen.getByText("Kropp")).toBeInTheDocument()
    expect(screen.getByText("contents")).toBeInTheDocument()
  })
})

describe("ProfileField", () => {
  it("renders label, value, and chevron", () => {
    render(<ProfileField label="Vekt" value="75 kg" onClick={() => {}} />)
    expect(screen.getByText("Vekt")).toBeInTheDocument()
    expect(screen.getByText("75 kg")).toBeInTheDocument()
  })
})

describe("ProfileList", () => {
  it("renders items and add button", () => {
    render(
      <ProfileList
        items={[{ id: "1", primary: "Item 1", secondary: "details" }]}
        onAdd={() => {}}
        onItemClick={() => {}}
        addLabel="Legg til"
      />,
    )
    expect(screen.getByText("Item 1")).toBeInTheDocument()
    expect(screen.getByText("Legg til")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

```bash
cd web && npm run test -- ProfileSection 2>&1 | tail -10
```

Expected: FAIL (components don't exist).

- [ ] **Step 3: Implement `ProfileSection.tsx`**

```tsx
import { ReactNode } from "react"

interface Props {
  title: string
  children: ReactNode
}

export default function ProfileSection({ title, children }: Props) {
  return (
    <section className="mb-8">
      <h2 className="text-[11px] uppercase tracking-widest text-neutral-500 mb-3">{title}</h2>
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {children}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Implement `ProfileField.tsx`**

```tsx
"use client"
import { ReactNode } from "react"

interface Props {
  label: string
  value: ReactNode
  onClick?: () => void
  isLast?: boolean
}

export default function ProfileField({ label, value, onClick, isLast = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-800 transition-colors ${
        isLast ? "" : "border-b border-neutral-800"
      }`}
    >
      <span className="text-neutral-400 text-sm">{label}</span>
      <span className="flex items-center gap-2 text-neutral-100 text-sm">
        <span>{value ?? <span className="text-neutral-600">—</span>}</span>
        <span className="text-neutral-500">›</span>
      </span>
    </button>
  )
}
```

- [ ] **Step 5: Implement `ProfileList.tsx`**

```tsx
"use client"
import { ReactNode } from "react"

interface Item {
  id: string
  primary: string
  secondary?: ReactNode
}

interface Props {
  items: Item[]
  onAdd: () => void
  onItemClick: (id: string) => void
  addLabel: string
}

export default function ProfileList({ items, onAdd, onItemClick, addLabel }: Props) {
  return (
    <div>
      {items.map((it, i) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onItemClick(it.id)}
          className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-800 transition-colors ${
            i === items.length - 1 ? "border-b border-neutral-800" : "border-b border-neutral-800"
          }`}
        >
          <div className="flex flex-col">
            <span className="text-neutral-100 text-sm">{it.primary}</span>
            {it.secondary && <span className="text-neutral-500 text-xs mt-0.5">{it.secondary}</span>}
          </div>
          <span className="text-neutral-500">›</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="w-full px-4 py-3 text-left text-orange-400 hover:bg-neutral-800 transition-colors"
      >
        + {addLabel}
      </button>
    </div>
  )
}
```

- [ ] **Step 6: Run tests**

```bash
cd web && npm run test -- ProfileSection 2>&1 | tail -10
```

Expected: 3 tests pass.

- [ ] **Step 7: Full frontend test suite**

```bash
cd web && npm run test 2>&1 | tail -5
```

Expected: 7 tests passing.

- [ ] **Step 8: Commit**

```bash
git add web/src/components/profile/ProfileSection.tsx web/src/components/profile/ProfileField.tsx web/src/components/profile/ProfileList.tsx web/src/components/profile/ProfileSection.test.tsx
git commit -m "feat(web): add ProfileSection/Field/List layout components"
```

---

## Phase E — Frontend: generic edit sheets

### Task 10: Generic sheets (Text, Choice, MultiSelect)

**Files:**
- Create: `web/src/components/profile/sheets/EditTextSheet.tsx`
- Create: `web/src/components/profile/sheets/EditChoiceSheet.tsx`
- Create: `web/src/components/profile/sheets/EditMultiSelectSheet.tsx`
- Create: `web/src/components/profile/sheets/EditTextSheet.test.tsx`

- [ ] **Step 1: Write smoke tests**

Create `web/src/components/profile/sheets/EditTextSheet.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import EditTextSheet from "./EditTextSheet"
import EditChoiceSheet from "./EditChoiceSheet"
import EditMultiSelectSheet from "./EditMultiSelectSheet"

describe("EditTextSheet", () => {
  it("renders input and calls onSave with new value", () => {
    const onSave = vi.fn()
    render(
      <EditTextSheet
        open={true}
        onClose={() => {}}
        title="Edit Weight"
        initialValue="75"
        unit="kg"
        type="number"
        onSave={onSave}
      />,
    )
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    fireEvent.change(input, { target: { value: "76" } })
    fireEvent.click(screen.getByText("Lagre"))
    expect(onSave).toHaveBeenCalledWith("76")
  })
})

describe("EditChoiceSheet", () => {
  it("renders choices and selects one", () => {
    const onSave = vi.fn()
    render(
      <EditChoiceSheet
        open={true}
        onClose={() => {}}
        title="Erfaring"
        choices={[
          { value: "beginner", label: "Nybegynner" },
          { value: "intermediate", label: "Middels" },
        ]}
        initialValue="beginner"
        onSave={onSave}
      />,
    )
    fireEvent.click(screen.getByText("Middels"))
    fireEvent.click(screen.getByText("Lagre"))
    expect(onSave).toHaveBeenCalledWith("intermediate")
  })
})

describe("EditMultiSelectSheet", () => {
  it("toggles selections", () => {
    const onSave = vi.fn()
    render(
      <EditMultiSelectSheet
        open={true}
        onClose={() => {}}
        title="Mål"
        choices={[
          { value: "build_muscle", label: "Bygg muskler" },
          { value: "lose_weight", label: "Gå ned i vekt" },
        ]}
        initialValues={["build_muscle"]}
        onSave={onSave}
      />,
    )
    fireEvent.click(screen.getByText("Gå ned i vekt"))
    fireEvent.click(screen.getByText("Lagre"))
    expect(onSave).toHaveBeenCalledWith(["build_muscle", "lose_weight"])
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

```bash
cd web && npm run test -- EditTextSheet 2>&1 | tail -10
```

Expected: FAIL.

- [ ] **Step 3: Implement `EditTextSheet.tsx`**

```tsx
"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"

interface Props {
  open: boolean
  onClose: () => void
  title: string
  initialValue: string
  unit?: string
  type?: "text" | "number" | "textarea"
  onSave: (value: string) => void
}

export default function EditTextSheet({
  open, onClose, title, initialValue, unit, type = "text", onSave,
}: Props) {
  const [value, setValue] = useState(initialValue)

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl p-5 z-50 max-h-[70vh] overflow-y-auto">
          <Dialog.Title className="text-white text-lg font-semibold mb-4">{title}</Dialog.Title>
          {type === "textarea" ? (
            <textarea
              className="w-full bg-neutral-800 text-white rounded-md p-3 border border-neutral-700 mb-4 min-h-[100px]"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          ) : (
            <div className="flex items-center gap-2 mb-4">
              <input
                type={type}
                className="flex-1 bg-neutral-800 text-white rounded-md p-3 border border-neutral-700"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              {unit && <span className="text-neutral-400">{unit}</span>}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-neutral-400 hover:text-white">
              Avbryt
            </button>
            <button
              type="button"
              onClick={() => { onSave(value); onClose() }}
              className="px-4 py-2 bg-orange-500 text-white rounded-md font-medium hover:bg-orange-600"
            >
              Lagre
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Step 4: Implement `EditChoiceSheet.tsx`**

```tsx
"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"

interface Choice {
  value: string
  label: string
}

interface Props {
  open: boolean
  onClose: () => void
  title: string
  choices: Choice[]
  initialValue: string
  onSave: (value: string) => void
}

export default function EditChoiceSheet({ open, onClose, title, choices, initialValue, onSave }: Props) {
  const [value, setValue] = useState(initialValue)

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl p-5 z-50 max-h-[70vh] overflow-y-auto">
          <Dialog.Title className="text-white text-lg font-semibold mb-4">{title}</Dialog.Title>
          <div className="flex flex-col gap-2 mb-4">
            {choices.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setValue(c.value)}
                className={`w-full px-4 py-3 rounded-md text-left border ${
                  value === c.value
                    ? "bg-orange-500/20 border-orange-500 text-white"
                    : "bg-neutral-800 border-neutral-700 text-neutral-300"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-neutral-400 hover:text-white">
              Avbryt
            </button>
            <button
              type="button"
              onClick={() => { onSave(value); onClose() }}
              className="px-4 py-2 bg-orange-500 text-white rounded-md font-medium hover:bg-orange-600"
            >
              Lagre
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Step 5: Implement `EditMultiSelectSheet.tsx`**

```tsx
"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"

interface Choice {
  value: string
  label: string
}

interface Props {
  open: boolean
  onClose: () => void
  title: string
  choices: Choice[]
  initialValues: string[]
  onSave: (values: string[]) => void
}

export default function EditMultiSelectSheet({ open, onClose, title, choices, initialValues, onSave }: Props) {
  const [values, setValues] = useState<string[]>(initialValues)

  const toggle = (v: string) =>
    setValues((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl p-5 z-50 max-h-[70vh] overflow-y-auto">
          <Dialog.Title className="text-white text-lg font-semibold mb-4">{title}</Dialog.Title>
          <div className="flex flex-wrap gap-2 mb-4">
            {choices.map((c) => {
              const active = values.includes(c.value)
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => toggle(c.value)}
                  className={`px-4 py-2 rounded-full border text-sm ${
                    active
                      ? "bg-orange-500/20 border-orange-500 text-white"
                      : "bg-neutral-800 border-neutral-700 text-neutral-300"
                  }`}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-neutral-400 hover:text-white">
              Avbryt
            </button>
            <button
              type="button"
              onClick={() => { onSave(values); onClose() }}
              className="px-4 py-2 bg-orange-500 text-white rounded-md font-medium hover:bg-orange-600"
            >
              Lagre
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Step 6: Run tests**

```bash
cd web && npm run test -- EditTextSheet 2>&1 | tail -10
```

Expected: 3 tests pass.

- [ ] **Step 7: Full frontend test suite**

```bash
cd web && npm run test 2>&1 | tail -5
```

Expected: 10 tests passing.

- [ ] **Step 8: Commit**

```bash
git add web/src/components/profile/sheets/EditTextSheet.tsx web/src/components/profile/sheets/EditChoiceSheet.tsx web/src/components/profile/sheets/EditMultiSelectSheet.tsx web/src/components/profile/sheets/EditTextSheet.test.tsx
git commit -m "feat(web): add generic edit sheets (text, choice, multiselect)"
```

---

## Phase F — Frontend: domain-specific sheets

### Task 11: `EditInjurySheet`

**Files:**
- Create: `web/src/components/profile/sheets/EditInjurySheet.tsx`
- Create: `web/src/components/profile/sheets/EditInjurySheet.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import EditInjurySheet from "./EditInjurySheet"

describe("EditInjurySheet", () => {
  it("renders and saves new injury", () => {
    const onSave = vi.fn()
    render(
      <EditInjurySheet
        open={true}
        onClose={() => {}}
        injury={null}
        onSave={onSave}
        onDelete={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText("Kroppsdel"), { target: { value: "venstre kne" } })
    fireEvent.change(screen.getByLabelText("Beskrivelse"), { target: { value: "vondt ved knebøy" } })
    fireEvent.click(screen.getByText("Moderat"))
    fireEvent.click(screen.getByText("Lagre"))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      body_part: "venstre kne",
      description: "vondt ved knebøy",
      severity: "moderat",
    }))
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd web && npm run test -- EditInjurySheet 2>&1 | tail -10
```

- [ ] **Step 3: Implement `EditInjurySheet.tsx`**

```tsx
"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import type { UserInjury } from "@/lib/profile"

const SEVERITY: { value: "lett" | "moderat" | "alvorlig"; label: string }[] = [
  { value: "lett", label: "Lett" },
  { value: "moderat", label: "Moderat" },
  { value: "alvorlig", label: "Alvorlig" },
]

interface Props {
  open: boolean
  onClose: () => void
  injury: UserInjury | null  // null = creating new
  onSave: (data: Partial<UserInjury>) => void
  onDelete: (id: string) => void
}

export default function EditInjurySheet({ open, onClose, injury, onSave, onDelete }: Props) {
  const [bodyPart, setBodyPart] = useState(injury?.body_part ?? "")
  const [description, setDescription] = useState(injury?.description ?? "")
  const [severity, setSeverity] = useState<string | null>(injury?.severity ?? null)
  const [startedAt, setStartedAt] = useState(injury?.started_at ?? "")

  const isEditing = injury !== null
  const canSave = bodyPart.trim().length > 0

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl p-5 z-50 max-h-[80vh] overflow-y-auto">
          <Dialog.Title className="text-white text-lg font-semibold mb-4">
            {isEditing ? "Rediger skade" : "Ny skade"}
          </Dialog.Title>

          <label className="block mb-3">
            <span className="block text-neutral-400 text-sm mb-1">Kroppsdel</span>
            <input
              aria-label="Kroppsdel"
              className="w-full bg-neutral-800 text-white rounded-md p-3 border border-neutral-700"
              value={bodyPart}
              onChange={(e) => setBodyPart(e.target.value)}
              placeholder="f.eks. venstre kne"
            />
          </label>

          <label className="block mb-3">
            <span className="block text-neutral-400 text-sm mb-1">Beskrivelse</span>
            <textarea
              aria-label="Beskrivelse"
              className="w-full bg-neutral-800 text-white rounded-md p-3 border border-neutral-700 min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="f.eks. vondt ved dyp bøyning"
            />
          </label>

          <div className="mb-3">
            <span className="block text-neutral-400 text-sm mb-1">Alvorlighet</span>
            <div className="flex gap-2">
              {SEVERITY.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSeverity(s.value)}
                  className={`flex-1 py-2 rounded-md border ${
                    severity === s.value
                      ? "bg-orange-500/20 border-orange-500 text-white"
                      : "bg-neutral-800 border-neutral-700 text-neutral-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block mb-4">
            <span className="block text-neutral-400 text-sm mb-1">Startdato (valgfri)</span>
            <input
              type="date"
              aria-label="Startdato"
              className="w-full bg-neutral-800 text-white rounded-md p-3 border border-neutral-700"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
            />
          </label>

          <div className="flex gap-2 justify-between">
            {isEditing && (
              <button
                type="button"
                onClick={() => { onDelete(injury!.id); onClose() }}
                className="px-4 py-2 text-red-400 hover:text-red-300"
              >
                Markér som leget
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={onClose} className="px-4 py-2 text-neutral-400 hover:text-white">
                Avbryt
              </button>
              <button
                type="button"
                disabled={!canSave}
                onClick={() => {
                  onSave({
                    body_part: bodyPart,
                    description: description || null,
                    severity: severity || null,
                    started_at: startedAt || null,
                  })
                  onClose()
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-md font-medium hover:bg-orange-600 disabled:bg-neutral-700 disabled:text-neutral-500"
              >
                Lagre
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
cd web && npm run test -- EditInjurySheet 2>&1 | tail -10
```

Expected: 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/profile/sheets/EditInjurySheet.tsx web/src/components/profile/sheets/EditInjurySheet.test.tsx
git commit -m "feat(web): add EditInjurySheet"
```

---

### Task 12: `EditPreferenceSheet` and `EditConstraintSheet`

**Files:**
- Create: `web/src/components/profile/sheets/EditPreferenceSheet.tsx`
- Create: `web/src/components/profile/sheets/EditConstraintSheet.tsx`
- Create: `web/src/components/profile/sheets/EditPreferenceSheet.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import EditPreferenceSheet from "./EditPreferenceSheet"
import EditConstraintSheet from "./EditConstraintSheet"

describe("EditPreferenceSheet", () => {
  it("creates new preference", () => {
    const onSave = vi.fn()
    render(<EditPreferenceSheet open={true} onClose={() => {}} preference={null} onSave={onSave} onDelete={() => {}} />)
    fireEvent.click(screen.getByText("Øvelse"))
    fireEvent.change(screen.getByLabelText("Beskrivelse"), { target: { value: "liker ikke beinpress" } })
    fireEvent.click(screen.getByText("Lagre"))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      category: "exercise",
      preference: "liker ikke beinpress",
    }))
  })
})

describe("EditConstraintSheet", () => {
  it("creates new constraint", () => {
    const onSave = vi.fn()
    render(<EditConstraintSheet open={true} onClose={() => {}} constraint={null} onSave={onSave} onDelete={() => {}} />)
    fireEvent.click(screen.getByText("Tidsplan"))
    fireEvent.change(screen.getByLabelText("Beskrivelse"), { target: { value: "kun tirs/tors/lør" } })
    fireEvent.click(screen.getByText("Lagre"))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      type: "schedule",
      description: "kun tirs/tors/lør",
    }))
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd web && npm run test -- EditPreferenceSheet 2>&1 | tail -10
```

- [ ] **Step 3: Implement `EditPreferenceSheet.tsx`**

```tsx
"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import type { UserPreference } from "@/lib/profile"

const CATEGORIES: { value: "exercise" | "time" | "intensity" | "other"; label: string }[] = [
  { value: "exercise", label: "Øvelse" },
  { value: "time", label: "Tid" },
  { value: "intensity", label: "Intensitet" },
  { value: "other", label: "Annet" },
]

interface Props {
  open: boolean
  onClose: () => void
  preference: UserPreference | null
  onSave: (data: Partial<UserPreference>) => void
  onDelete: (id: string) => void
}

export default function EditPreferenceSheet({ open, onClose, preference, onSave, onDelete }: Props) {
  const [category, setCategory] = useState<string | null>(preference?.category ?? null)
  const [text, setText] = useState(preference?.preference ?? "")
  const isEditing = preference !== null
  const canSave = category !== null && text.trim().length > 0

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl p-5 z-50 max-h-[80vh] overflow-y-auto">
          <Dialog.Title className="text-white text-lg font-semibold mb-4">
            {isEditing ? "Rediger preferanse" : "Ny preferanse"}
          </Dialog.Title>

          <div className="mb-3">
            <span className="block text-neutral-400 text-sm mb-1">Kategori</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`px-4 py-2 rounded-full border text-sm ${
                    category === c.value
                      ? "bg-orange-500/20 border-orange-500 text-white"
                      : "bg-neutral-800 border-neutral-700 text-neutral-300"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block mb-4">
            <span className="block text-neutral-400 text-sm mb-1">Beskrivelse</span>
            <textarea
              aria-label="Beskrivelse"
              className="w-full bg-neutral-800 text-white rounded-md p-3 border border-neutral-700 min-h-[80px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="f.eks. liker ikke beinpress"
            />
          </label>

          <div className="flex gap-2 justify-between">
            {isEditing && (
              <button
                type="button"
                onClick={() => { onDelete(preference!.id); onClose() }}
                className="px-4 py-2 text-red-400 hover:text-red-300"
              >
                Slett
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={onClose} className="px-4 py-2 text-neutral-400 hover:text-white">Avbryt</button>
              <button
                type="button"
                disabled={!canSave}
                onClick={() => { onSave({ category: category!, preference: text }); onClose() }}
                className="px-4 py-2 bg-orange-500 text-white rounded-md font-medium hover:bg-orange-600 disabled:bg-neutral-700 disabled:text-neutral-500"
              >
                Lagre
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Step 4: Implement `EditConstraintSheet.tsx`**

```tsx
"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import type { UserConstraint } from "@/lib/profile"

const TYPES: { value: "schedule" | "duration" | "frequency"; label: string }[] = [
  { value: "schedule", label: "Tidsplan" },
  { value: "duration", label: "Varighet" },
  { value: "frequency", label: "Frekvens" },
]

interface Props {
  open: boolean
  onClose: () => void
  constraint: UserConstraint | null
  onSave: (data: Partial<UserConstraint>) => void
  onDelete: (id: string) => void
}

export default function EditConstraintSheet({ open, onClose, constraint, onSave, onDelete }: Props) {
  const [type, setType] = useState<string | null>(constraint?.type ?? null)
  const [description, setDescription] = useState(constraint?.description ?? "")
  const isEditing = constraint !== null
  const canSave = type !== null && description.trim().length > 0

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl p-5 z-50 max-h-[80vh] overflow-y-auto">
          <Dialog.Title className="text-white text-lg font-semibold mb-4">
            {isEditing ? "Rediger begrensning" : "Ny begrensning"}
          </Dialog.Title>

          <div className="mb-3">
            <span className="block text-neutral-400 text-sm mb-1">Type</span>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`px-4 py-2 rounded-full border text-sm ${
                    type === t.value
                      ? "bg-orange-500/20 border-orange-500 text-white"
                      : "bg-neutral-800 border-neutral-700 text-neutral-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block mb-4">
            <span className="block text-neutral-400 text-sm mb-1">Beskrivelse</span>
            <textarea
              aria-label="Beskrivelse"
              className="w-full bg-neutral-800 text-white rounded-md p-3 border border-neutral-700 min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="f.eks. maks 45 min per økt"
            />
          </label>

          <div className="flex gap-2 justify-between">
            {isEditing && (
              <button
                type="button"
                onClick={() => { onDelete(constraint!.id); onClose() }}
                className="px-4 py-2 text-red-400 hover:text-red-300"
              >
                Slett
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={onClose} className="px-4 py-2 text-neutral-400 hover:text-white">Avbryt</button>
              <button
                type="button"
                disabled={!canSave}
                onClick={() => { onSave({ type: type!, description }); onClose() }}
                className="px-4 py-2 bg-orange-500 text-white rounded-md font-medium hover:bg-orange-600 disabled:bg-neutral-700 disabled:text-neutral-500"
              >
                Lagre
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
cd web && npm run test -- EditPreferenceSheet 2>&1 | tail -10
```

Expected: 2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/profile/sheets/EditPreferenceSheet.tsx web/src/components/profile/sheets/EditConstraintSheet.tsx web/src/components/profile/sheets/EditPreferenceSheet.test.tsx
git commit -m "feat(web): add EditPreferenceSheet and EditConstraintSheet"
```

---

### Task 13: `EquipmentSheet` with presets

**Files:**
- Create: `web/src/components/profile/sheets/EquipmentSheet.tsx`
- Create: `web/src/components/profile/sheets/EquipmentSheet.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import EquipmentSheet from "./EquipmentSheet"

describe("EquipmentSheet", () => {
  it("adds custom equipment", () => {
    const onAdd = vi.fn()
    render(<EquipmentSheet open={true} onClose={() => {}} mode="add" existing={[]} onAdd={onAdd} onDelete={() => {}} item={null} />)
    fireEvent.change(screen.getByLabelText("Utstyr"), { target: { value: "kettlebell_16kg" } })
    fireEvent.click(screen.getByText("Lagre"))
    expect(onAdd).toHaveBeenCalledWith("kettlebell_16kg")
  })

  it("applies home gym preset", () => {
    const onAdd = vi.fn()
    render(<EquipmentSheet open={true} onClose={() => {}} mode="add" existing={[]} onAdd={onAdd} onDelete={() => {}} item={null} />)
    fireEvent.click(screen.getByText("Hjemmegym basic"))
    // should have called onAdd for each item in the preset
    expect(onAdd).toHaveBeenCalled()
    expect((onAdd as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(1)
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd web && npm run test -- EquipmentSheet 2>&1 | tail -10
```

- [ ] **Step 3: Implement `EquipmentSheet.tsx`**

```tsx
"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"

const PRESETS: Record<string, string[]> = {
  "Hjemmegym basic": ["barbell", "plates", "bench", "dumbbells_pair"],
  "Treningssenter": ["barbell", "dumbbells_full_range", "cable_machine", "leg_press", "smith_machine", "pull_up_bar"],
  "Bare bodyweight": ["pull_up_bar"],
}

interface Props {
  open: boolean
  onClose: () => void
  mode: "add" | "edit"
  existing: string[]
  item: string | null  // when editing/deleting one
  onAdd: (equipment: string) => void
  onDelete: (equipment: string) => void
}

export default function EquipmentSheet({ open, onClose, mode, existing, item, onAdd, onDelete }: Props) {
  const [value, setValue] = useState("")

  const applyPreset = (preset: string) => {
    for (const eq of PRESETS[preset]) {
      if (!existing.includes(eq)) onAdd(eq)
    }
    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl p-5 z-50 max-h-[80vh] overflow-y-auto">
          <Dialog.Title className="text-white text-lg font-semibold mb-4">
            {mode === "edit" ? `Utstyr: ${item}` : "Legg til utstyr"}
          </Dialog.Title>

          {mode === "add" && (
            <>
              <label className="block mb-3">
                <span className="block text-neutral-400 text-sm mb-1">Utstyr</span>
                <input
                  aria-label="Utstyr"
                  className="w-full bg-neutral-800 text-white rounded-md p-3 border border-neutral-700"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="f.eks. barbell"
                />
              </label>

              <div className="mb-4">
                <span className="block text-neutral-400 text-sm mb-2">Eller velg en preset:</span>
                <div className="flex flex-col gap-2">
                  {Object.keys(PRESETS).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-left text-neutral-300 hover:bg-neutral-700"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 justify-between">
            {mode === "edit" && item && (
              <button
                type="button"
                onClick={() => { onDelete(item); onClose() }}
                className="px-4 py-2 text-red-400 hover:text-red-300"
              >
                Slett
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={onClose} className="px-4 py-2 text-neutral-400 hover:text-white">Avbryt</button>
              {mode === "add" && (
                <button
                  type="button"
                  disabled={value.trim().length === 0}
                  onClick={() => { onAdd(value.trim()); onClose() }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md font-medium hover:bg-orange-600 disabled:bg-neutral-700 disabled:text-neutral-500"
                >
                  Lagre
                </button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
cd web && npm run test -- EquipmentSheet 2>&1 | tail -10
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/profile/sheets/EquipmentSheet.tsx web/src/components/profile/sheets/EquipmentSheet.test.tsx
git commit -m "feat(web): add EquipmentSheet with presets"
```

---

## Phase G — Wire it all together

### Task 14: Rewrite `web/src/app/(tabs)/profile/page.tsx` with all 8 sections

**Files:**
- Modify: `web/src/app/(tabs)/profile/page.tsx`
- Create: `web/src/app/(tabs)/profile/ProfileClient.tsx`

- [ ] **Step 1: Move existing page logic to a client wrapper**

Create `web/src/app/(tabs)/profile/ProfileClient.tsx`:

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { FullProfile, UserInjury, UserPreference, UserConstraint } from "@/lib/profile"
import {
  updateProfile, addInjury, updateInjury, deleteInjury,
  addPreference, updatePreference, deletePreference,
  addEquipment, deleteEquipment,
  addConstraint, updateConstraint, deleteConstraint,
} from "@/lib/profile"
import ProfileSection from "@/components/profile/ProfileSection"
import ProfileField from "@/components/profile/ProfileField"
import ProfileList from "@/components/profile/ProfileList"
import LogoutButton from "@/components/profile/LogoutButton"
import EditTextSheet from "@/components/profile/sheets/EditTextSheet"
import EditChoiceSheet from "@/components/profile/sheets/EditChoiceSheet"
import EditMultiSelectSheet from "@/components/profile/sheets/EditMultiSelectSheet"
import EditInjurySheet from "@/components/profile/sheets/EditInjurySheet"
import EditPreferenceSheet from "@/components/profile/sheets/EditPreferenceSheet"
import EditConstraintSheet from "@/components/profile/sheets/EditConstraintSheet"
import EquipmentSheet from "@/components/profile/sheets/EquipmentSheet"

const GOALS = [
  { value: "build_muscle", label: "Bygg muskler" },
  { value: "lose_weight", label: "Gå ned i vekt" },
  { value: "get_stronger", label: "Bli sterkere" },
  { value: "improve_endurance", label: "Bedre kondis" },
  { value: "maintain", label: "Holde formen" },
]
const EXPERIENCE = [
  { value: "beginner", label: "Nybegynner" },
  { value: "intermediate", label: "Middels" },
  { value: "advanced", label: "Erfaren" },
]
const ACTIVITY = [
  { value: "sedentary", label: "Sedentær" },
  { value: "light", label: "Lett aktiv" },
  { value: "moderate", label: "Moderat" },
  { value: "very_active", label: "Svært aktiv" },
]
const TRAINING_TIME = [
  { value: "morning", label: "Morgen" },
  { value: "lunch", label: "Lunsj" },
  { value: "evening", label: "Kveld" },
  { value: "flexible", label: "Fleksibel" },
]
const FREQUENCY_CHOICES = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: `${n} dager/uke` }))
const SESSION_DURATION = [
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "60 min" },
  { value: "75", label: "75 min" },
  { value: "90", label: "90 min" },
  { value: "0", label: "Ingen grense" },
]

type SheetKey =
  | { kind: "text"; field: keyof FullProfile; title: string; unit?: string; type?: "text" | "number" }
  | { kind: "choice"; field: keyof FullProfile; title: string; choices: { value: string; label: string }[] }
  | { kind: "multi"; field: "goals"; title: string }
  | { kind: "injury"; injury: UserInjury | null }
  | { kind: "preference"; preference: UserPreference | null }
  | { kind: "constraint"; constraint: UserConstraint | null }
  | { kind: "equipment"; mode: "add" | "edit"; item: string | null }
  | null

export default function ProfileClient({ initialProfile, accessToken }: { initialProfile: FullProfile; accessToken: string }) {
  const router = useRouter()
  const [profile] = useState<FullProfile>(initialProfile)
  const [sheet, setSheet] = useState<SheetKey>(null)

  const refresh = () => router.refresh()

  const saveField = async (field: keyof FullProfile, value: unknown) => {
    await updateProfile(accessToken, { [field]: value } as Partial<FullProfile>)
    refresh()
  }

  return (
    <div className="p-5 max-w-md mx-auto">
      {/* Identitet */}
      <ProfileSection title="Identitet">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xl">👤</div>
          <div className="flex flex-col">
            <span className="text-white text-sm font-medium">{profile.first_name} {profile.last_name}</span>
            <span className="text-neutral-500 text-xs">{profile.email}</span>
          </div>
        </div>
      </ProfileSection>

      {/* Kropp */}
      <ProfileSection title="Kropp">
        <ProfileField
          label="Vekt"
          value={profile.weight_kg ? `${profile.weight_kg} kg` : "—"}
          onClick={() => setSheet({ kind: "text", field: "weight_kg", title: "Vekt", unit: "kg", type: "number" })}
        />
        <ProfileField
          label="Høyde"
          value={profile.height_cm ? `${profile.height_cm} cm` : "—"}
          onClick={() => setSheet({ kind: "text", field: "height_cm", title: "Høyde", unit: "cm", type: "number" })}
        />
        <ProfileField
          label="Aktivitetsnivå"
          value={ACTIVITY.find((a) => a.value === profile.activity_level)?.label ?? "—"}
          onClick={() => setSheet({ kind: "choice", field: "activity_level", title: "Aktivitetsnivå", choices: ACTIVITY })}
          isLast
        />
      </ProfileSection>

      {/* Treningsmål og erfaring */}
      <ProfileSection title="Treningsmål og erfaring">
        <ProfileField
          label="Mål"
          value={(profile.goals ?? []).map((g) => GOALS.find((x) => x.value === g)?.label ?? g).join(", ") || "—"}
          onClick={() => setSheet({ kind: "multi", field: "goals", title: "Mål" })}
        />
        <ProfileField
          label="Erfaringsnivå"
          value={EXPERIENCE.find((e) => e.value === profile.experience_level)?.label ?? "—"}
          onClick={() => setSheet({ kind: "choice", field: "experience_level", title: "Erfaringsnivå", choices: EXPERIENCE })}
        />
        <ProfileField
          label="Antall år trent"
          value={profile.years_training !== null ? `${profile.years_training} år` : "—"}
          onClick={() => setSheet({ kind: "text", field: "years_training", title: "Antall år trent", unit: "år", type: "number" })}
          isLast
        />
      </ProfileSection>

      {/* Treningsrutine */}
      <ProfileSection title="Treningsrutine">
        <ProfileField
          label="Frekvens"
          value={profile.training_days_per_week ? `${profile.training_days_per_week} dager/uke` : "—"}
          onClick={() => setSheet({ kind: "choice", field: "training_days_per_week", title: "Frekvens", choices: FREQUENCY_CHOICES })}
        />
        <ProfileField
          label="Foretrukket tid"
          value={TRAINING_TIME.find((t) => t.value === profile.preferred_training_time)?.label ?? "—"}
          onClick={() => setSheet({ kind: "choice", field: "preferred_training_time", title: "Foretrukket tid", choices: TRAINING_TIME })}
        />
        <ProfileField
          label="Maks varighet"
          value={profile.max_session_duration_min ? `${profile.max_session_duration_min} min` : profile.max_session_duration_min === 0 ? "Ingen grense" : "—"}
          onClick={() => setSheet({ kind: "choice", field: "max_session_duration_min", title: "Maks varighet", choices: SESSION_DURATION })}
          isLast
        />
      </ProfileSection>

      {/* Utstyr */}
      <ProfileSection title="Utstyr">
        <ProfileList
          items={profile.equipment.map((eq) => ({ id: eq, primary: eq }))}
          addLabel="Legg til utstyr"
          onAdd={() => setSheet({ kind: "equipment", mode: "add", item: null })}
          onItemClick={(eq) => setSheet({ kind: "equipment", mode: "edit", item: eq })}
        />
      </ProfileSection>

      {/* Skader og begrensninger */}
      <ProfileSection title="Skader og begrensninger">
        <div className="px-4 py-2 text-xs uppercase text-neutral-500">Skader</div>
        <ProfileList
          items={profile.injuries.map((inj) => ({
            id: inj.id,
            primary: inj.body_part,
            secondary: inj.severity || inj.description || undefined,
          }))}
          addLabel="Legg til skade"
          onAdd={() => setSheet({ kind: "injury", injury: null })}
          onItemClick={(id) => setSheet({ kind: "injury", injury: profile.injuries.find((i) => i.id === id) ?? null })}
        />
        <div className="px-4 py-2 text-xs uppercase text-neutral-500 mt-2">Begrensninger</div>
        <ProfileList
          items={profile.constraints.map((c) => ({
            id: c.id,
            primary: c.description,
            secondary: c.type,
          }))}
          addLabel="Legg til begrensning"
          onAdd={() => setSheet({ kind: "constraint", constraint: null })}
          onItemClick={(id) => setSheet({ kind: "constraint", constraint: profile.constraints.find((c) => c.id === id) ?? null })}
        />
      </ProfileSection>

      {/* Preferanser */}
      <ProfileSection title="Preferanser">
        <ProfileList
          items={profile.preferences.map((p) => ({ id: p.id, primary: p.preference, secondary: p.category }))}
          addLabel="Legg til preferanse"
          onAdd={() => setSheet({ kind: "preference", preference: null })}
          onItemClick={(id) => setSheet({ kind: "preference", preference: profile.preferences.find((p) => p.id === id) ?? null })}
        />
      </ProfileSection>

      {/* Konto */}
      <ProfileSection title="Konto">
        <div className="px-4 py-3">
          <LogoutButton />
        </div>
      </ProfileSection>

      {/* Sheets */}
      {sheet?.kind === "text" && (
        <EditTextSheet
          open={true}
          onClose={() => setSheet(null)}
          title={sheet.title}
          initialValue={String(profile[sheet.field] ?? "")}
          unit={sheet.unit}
          type={sheet.type}
          onSave={async (v) => {
            const parsed = sheet.type === "number" ? Number(v) : v
            await saveField(sheet.field, parsed)
          }}
        />
      )}
      {sheet?.kind === "choice" && (
        <EditChoiceSheet
          open={true}
          onClose={() => setSheet(null)}
          title={sheet.title}
          choices={sheet.choices}
          initialValue={String(profile[sheet.field] ?? "")}
          onSave={async (v) => {
            const parsed = sheet.field === "training_days_per_week" || sheet.field === "max_session_duration_min" ? Number(v) : v
            await saveField(sheet.field, parsed)
          }}
        />
      )}
      {sheet?.kind === "multi" && (
        <EditMultiSelectSheet
          open={true}
          onClose={() => setSheet(null)}
          title={sheet.title}
          choices={GOALS}
          initialValues={profile.goals ?? []}
          onSave={async (vs) => { await saveField("goals", vs) }}
        />
      )}
      {sheet?.kind === "injury" && (
        <EditInjurySheet
          open={true}
          onClose={() => setSheet(null)}
          injury={sheet.injury}
          onSave={async (data) => {
            if (sheet.injury) {
              await updateInjury(accessToken, sheet.injury.id, data)
            } else {
              await addInjury(accessToken, data)
            }
            refresh()
          }}
          onDelete={async (id) => { await deleteInjury(accessToken, id); refresh() }}
        />
      )}
      {sheet?.kind === "preference" && (
        <EditPreferenceSheet
          open={true}
          onClose={() => setSheet(null)}
          preference={sheet.preference}
          onSave={async (data) => {
            if (sheet.preference) {
              await updatePreference(accessToken, sheet.preference.id, data)
            } else {
              await addPreference(accessToken, data)
            }
            refresh()
          }}
          onDelete={async (id) => { await deletePreference(accessToken, id); refresh() }}
        />
      )}
      {sheet?.kind === "constraint" && (
        <EditConstraintSheet
          open={true}
          onClose={() => setSheet(null)}
          constraint={sheet.constraint}
          onSave={async (data) => {
            if (sheet.constraint) {
              await updateConstraint(accessToken, sheet.constraint.id, data)
            } else {
              await addConstraint(accessToken, data)
            }
            refresh()
          }}
          onDelete={async (id) => { await deleteConstraint(accessToken, id); refresh() }}
        />
      )}
      {sheet?.kind === "equipment" && (
        <EquipmentSheet
          open={true}
          onClose={() => setSheet(null)}
          mode={sheet.mode}
          existing={profile.equipment}
          item={sheet.item}
          onAdd={async (eq) => { await addEquipment(accessToken, eq); refresh() }}
          onDelete={async (eq) => { await deleteEquipment(accessToken, eq); refresh() }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `page.tsx`**

Replace `web/src/app/(tabs)/profile/page.tsx` with:

```tsx
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import type { FullProfile } from "@/lib/profile"
import ProfileClient from "./ProfileClient"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const accessToken = session.access_token

  const res = await fetch(`${API_BASE}/api/users/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })

  if (res.status === 404) {
    redirect("/onboarding")
  }

  if (!res.ok) {
    throw new Error(`Failed to load profile: ${res.status}`)
  }

  const profile: FullProfile = await res.json()
  return <ProfileClient initialProfile={profile} accessToken={accessToken} />
}
```

- [ ] **Step 3: Run frontend tests**

```bash
cd web && npm run test 2>&1 | tail -5
```

Expected: all passing (smoke tests of new components).

- [ ] **Step 4: Run typecheck + lint**

```bash
cd web && npm run typecheck 2>&1 | tail -5 && npm run lint 2>&1 | tail -5
```

Expected: 0 errors.

- [ ] **Step 5: Local manual test**

```bash
cd /Users/trymvestengen/Desktop/ai-coach && make dev
```

Open browser → login → /home → click Profile tab. Verify:
- All 8 sections render
- Tapping a field opens the right sheet
- Save updates the value
- Adding to a list works

If issues, fix them before committing.

- [ ] **Step 6: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/\(tabs\)/profile/page.tsx web/src/app/\(tabs\)/profile/ProfileClient.tsx
git commit -m "feat(web): rewrite Profile-tab with 8 sections and bottom-sheet editing"
```

---

## Phase H — Verification + PR

### Task 15: E2E verification, open PR

**Files:** none (verification)

- [ ] **Step 1: Run full backend suite**

```bash
cd api && .venv/bin/pytest 2>&1 | tail -5
```

Expected: 105 passing.

- [ ] **Step 2: Run full frontend suite + typecheck + lint + build**

```bash
cd web && npm run test && npm run typecheck && npm run lint && npm run build 2>&1 | tail -10
```

Expected: all pass.

- [ ] **Step 3: Manual flow test**

Start backend + frontend:
```bash
cd /Users/trymvestengen/Desktop/ai-coach && make dev
```

In browser:
1. Log in
2. Go to Profile
3. Edit weight → save → verify value updates
4. Add an injury → verify it appears in the list
5. Edit the injury → mark as healed → verify it disappears from list (is_active=false; we currently only show active in UI per spec)
6. Add a preference → verify it appears
7. Add equipment via custom + via preset → verify both work
8. Add a constraint → verify it appears

If any step fails, fix and re-test.

- [ ] **Step 4: Open PR**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git checkout -b tv/profile-tab
git push -u origin tv/profile-tab
gh pr create --title "feat: Profile-tab UI with editable Lag 1 sections" --body "$(cat <<'EOF'
## Hva
Implementerer [Profile-tab UI spec](docs/superpowers/specs/2026-05-27-profile-tab-design.md). 8 seksjoner i én scroll-bar side med bottom-sheet editing for hvert felt og hver liste.

## Hvorfor
Memory-arkitekturen (PR #3) la til Lag 1-tabeller for skader, preferanser, utstyr, constraints. Uten UI for å fylle dem var coach "blind" på disse. Nå kan brukeren se og redigere alt coach vet om dem.

## Endringer

**Backend:**
- Migrasjon 008: 4 nye felt på users (activity_level, years_training, preferred_training_time, max_session_duration_min)
- GET /api/users/profile utvidet til å returnere alle Lag 1-data
- PATCH /api/users/profile for partial update
- CRUD-endepunkter for user_injuries, user_preferences, user_equipment, user_constraints

**Frontend:**
- Helt ny Profile-side med 8 seksjoner (server-rendered + client wrapper)
- 7 bottom-sheet komponenter (3 generiske + 4 domenespesifikke)
- API-klient i web/src/lib/profile.ts

## Hvordan testet
- [x] Backend pytest: 105 passing
- [x] Frontend Vitest: alle nye komponenter har smoke-tester
- [x] make check: passerer
- [x] Manuell verifisering av alle 8 seksjoner

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Wait for CI and merge**

```bash
until gh run list --branch tv/profile-tab --limit 1 2>&1 | grep -qE "completed"; do sleep 15; done
gh run list --branch tv/profile-tab --limit 1
```

If green: `gh pr merge --squash --delete-branch`.

If red: read logs, fix, push again.

- [ ] **Step 6: Sync local main**

```bash
git checkout main && git fetch && git reset --hard origin/main
```

---

## Out of scope — explicit

Per spec, IKKE i denne planen:

1. Coach memory visibility i Profile-tab (Lag 2 forblir usynlig)
2. Edit av identitet (navn/email/birth_date/gender/avatar)
3. Slett konto + eksport data
4. Notification preferences
5. Body composition fields (body fat %)
6. Visuell polish / premium feel
7. Onboarding-flow oppdatering
8. Avatar-opplasting
9. i18n
10. RLS-policies for de 4 Lag 1-tabellene
