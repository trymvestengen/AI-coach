# Program-tab redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Erstatt dagens `ProgramScreen.tsx`-monolitt med tre separate ruter (bibliotek/detalj/kjør-økt) og introduser brukerstyrte mapper for å organisere programmer.

**Architecture:** Backend først (DB-migration + nye endepunkter for folders + program PATCH + workout discard/in-progress). Frontend etter: ny komponentstruktur under `web/src/components/program/{library,detail,workout}/` med Next.js App Router-ruter for hver flate. Brand-systemet brukes direkte — ingen flere `--ai-accent`/`--bg-2` i nye filer.

**Tech Stack:** FastAPI + psycopg (backend), Next.js 16 App Router + TypeScript + Tailwind (frontend), Vitest + React Testing Library (frontend tester), pytest + httpx ASGITransport (backend tester), Supabase Postgres med RLS.

**Spec-referanse:** [`docs/superpowers/specs/2026-06-06-program-tab-design.md`](../specs/2026-06-06-program-tab-design.md)

---

## Phase 1: Backend foundation

### Task 1: Database migration — folders table + folder_id column

**Files:**
- Create: `api/db/migrations/011_program_folders.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- api/db/migrations/011_program_folders.sql
-- Adds user-managed folders for organizing programs in the library.

CREATE TABLE IF NOT EXISTS program_folders (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_folders_user
    ON program_folders (user_id, created_at DESC);

ALTER TABLE programs
    ADD COLUMN IF NOT EXISTS folder_id UUID
        REFERENCES program_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_programs_folder
    ON programs (folder_id) WHERE folder_id IS NOT NULL;

-- RLS — match pattern from 005_rls.sql
ALTER TABLE program_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "program_folders_select_own" ON program_folders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "program_folders_insert_own" ON program_folders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "program_folders_update_own" ON program_folders
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "program_folders_delete_own" ON program_folders
  FOR DELETE USING (user_id = auth.uid());
```

- [ ] **Step 2: Apply migration to Supabase**

Run via Supabase SQL Editor (paste the file contents and click Run).
Expected: `Success. No rows returned`.

- [ ] **Step 3: Verify column and table exist**

In SQL Editor:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'programs' AND column_name = 'folder_id';

SELECT table_name FROM information_schema.tables
WHERE table_name = 'program_folders';
```
Expected: both queries return one row each.

- [ ] **Step 4: Commit**

```bash
git add api/db/migrations/011_program_folders.sql
git commit -m "feat(db): add program_folders table and folder_id on programs"
```

---

### Task 2: Folders CRUD router

**Files:**
- Create: `api/app/routers/program_folders.py`
- Modify: `api/app/main.py:11-17` (register router)
- Modify: `api/tests/conftest.py:33-40` (patch auth for new router)
- Test: `api/tests/test_program_folders_router.py`

- [ ] **Step 1: Write failing tests**

Create `api/tests/test_program_folders_router.py`:

```python
import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_list_folders_returns_empty(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[])
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.program_folders.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/folders")

    assert res.status_code == 200
    assert res.json() == []


@pytest.mark.asyncio
async def test_list_folders_returns_rows(make_mock_get_conn):
    fid = uuid.UUID("11111111-0000-0000-0000-000000000001")
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[(fid, "Bulk 2026", 3)])
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.program_folders.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/folders")

    body = res.json()
    assert len(body) == 1
    assert body[0]["name"] == "Bulk 2026"
    assert body[0]["program_count"] == 3


@pytest.mark.asyncio
async def test_create_folder_returns_201(make_mock_get_conn):
    fid = uuid.UUID("11111111-0000-0000-0000-000000000002")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(fid, "Sommer-cut"))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.program_folders.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post("/api/folders", json={"name": "Sommer-cut"})

    assert res.status_code == 201
    assert res.json()["name"] == "Sommer-cut"


@pytest.mark.asyncio
async def test_create_folder_rejects_empty_name():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/folders", json={"name": ""})
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_patch_folder_renames(make_mock_get_conn):
    fid = uuid.UUID("11111111-0000-0000-0000-000000000003")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(fid, "Halvmaraton"))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.program_folders.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(f"/api/folders/{fid}", json={"name": "Halvmaraton"})

    assert res.status_code == 200
    assert res.json()["name"] == "Halvmaraton"


@pytest.mark.asyncio
async def test_delete_folder_returns_204(make_mock_get_conn):
    fid = uuid.UUID("11111111-0000-0000-0000-000000000004")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(fid,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.program_folders.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.delete(f"/api/folders/{fid}")

    assert res.status_code == 204
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd api && .venv/bin/pytest tests/test_program_folders_router.py -v`
Expected: All fail with `ModuleNotFoundError: No module named 'app.routers.program_folders'`.

- [ ] **Step 3: Add auth-patch for new router**

Edit `api/tests/conftest.py` — append inside `patch_auth` fixture:

```python
    monkeypatch.setattr("app.routers.program_folders.get_current_user_id", lambda r: TEST_USER_ID)
```

Place it on a new line at the end of the existing `monkeypatch.setattr(...)` block (line ~40), right before the function returns.

- [ ] **Step 4: Implement router**

Create `api/app/routers/program_folders.py`:

```python
import uuid
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from app.db import get_conn
from app.auth import get_current_user_id

router = APIRouter()


class FolderBody(BaseModel):
    name: str = Field(min_length=1, max_length=80)


@router.get("/folders")
async def list_folders(request: Request) -> list:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT f.id, f.name,
                       (SELECT COUNT(*) FROM programs p WHERE p.folder_id = f.id)::int
                FROM program_folders f
                WHERE f.user_id = %s
                ORDER BY f.created_at DESC
                """,
                (user_id,),
            )
            rows = await cur.fetchall()
    except Exception as e:
        print(f"[list_folders] DB error: {e}")
        return []
    return [{"id": str(r[0]), "name": r[1], "program_count": r[2]} for r in rows]


@router.post("/folders", status_code=201)
async def create_folder(request: Request, body: FolderBody) -> dict:
    user_id = get_current_user_id(request)
    folder_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "INSERT INTO program_folders (id, user_id, name) "
                "VALUES (%s, %s, %s) RETURNING id, name",
                (folder_id, user_id, body.name.strip()),
            )
            row = await cur.fetchone()
            await conn.commit()
    except Exception as e:
        print(f"[create_folder] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"id": str(row[0]), "name": row[1], "program_count": 0}


@router.patch("/folders/{folder_id}")
async def rename_folder(folder_id: uuid.UUID, request: Request, body: FolderBody) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "UPDATE program_folders SET name = %s "
                "WHERE id = %s AND user_id = %s RETURNING id, name",
                (body.name.strip(), folder_id, user_id),
            )
            row = await cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Folder not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[rename_folder] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"id": str(row[0]), "name": row[1]}


@router.delete("/folders/{folder_id}", status_code=204)
async def delete_folder(folder_id: uuid.UUID, request: Request) -> None:
    """Slett mappen. Programmer i mappen flyttes til rot via ON DELETE SET NULL."""
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM program_folders WHERE id = %s AND user_id = %s RETURNING id",
                (folder_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Folder not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[delete_folder] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

- [ ] **Step 5: Register router in main**

Edit `api/app/main.py` — add the import and `include_router` call. The current imports look like:

```python
from app.routers import chat
from app.routers import workouts
from app.routers import programs
from app.routers import users
from app.routers import social
from app.routers import profile
from app.routers import chat_sessions
```

Add after `chat_sessions`:

```python
from app.routers import program_folders
```

Find the existing `app.include_router(...)` block and add:

```python
app.include_router(program_folders.router, prefix="/api")
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd api && .venv/bin/pytest tests/test_program_folders_router.py -v`
Expected: All 6 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add api/app/routers/program_folders.py api/app/main.py api/tests/test_program_folders_router.py api/tests/conftest.py
git commit -m "feat(api): add folders CRUD router for program organization"
```

---

### Task 3: PATCH /api/programs/{id} — toggle active, move folder, rename

**Files:**
- Modify: `api/app/routers/programs.py` (append new endpoint)
- Modify: `api/tests/test_programs_router.py` (append new tests)

- [ ] **Step 1: Write failing tests**

Append to `api/tests/test_programs_router.py`:

```python
@pytest.mark.asyncio
async def test_patch_program_sets_active(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000003")
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(prog_id,))
    cur_update = AsyncMock()
    cur_update.fetchone = AsyncMock(return_value=(prog_id, "PPL", True, None))
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, AsyncMock(), cur_update])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(f"/api/programs/{prog_id}", json={"is_active": True})

    assert res.status_code == 200
    body = res.json()
    assert body["is_active"] is True


@pytest.mark.asyncio
async def test_patch_program_renames(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000004")
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(prog_id,))
    cur_update = AsyncMock()
    cur_update.fetchone = AsyncMock(return_value=(prog_id, "Ny tittel", False, None))
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_update])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(f"/api/programs/{prog_id}", json={"name": "Ny tittel"})

    assert res.status_code == 200
    assert res.json()["name"] == "Ny tittel"


@pytest.mark.asyncio
async def test_patch_program_returns_404_when_missing(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000005")
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(f"/api/programs/{prog_id}", json={"name": "X"})
    assert res.status_code == 404
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd api && .venv/bin/pytest tests/test_programs_router.py -v -k "patch_program"`
Expected: All 3 fail with 405 Method Not Allowed or AttributeError.

- [ ] **Step 3: Add endpoint to programs router**

Append to `api/app/routers/programs.py`:

```python
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd api && .venv/bin/pytest tests/test_programs_router.py -v -k "patch_program"`
Expected: All 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add api/app/routers/programs.py api/tests/test_programs_router.py
git commit -m "feat(api): add PATCH /api/programs/{id} for active/folder/name"
```

---

### Task 4: GET /api/workouts/in-progress endpoint

**Files:**
- Modify: `api/app/routers/workouts.py` (append endpoint)
- Modify: `api/tests/test_workouts_router.py` (append tests)

- [ ] **Step 1: Write failing tests**

Append to `api/tests/test_workouts_router.py`:

```python
@pytest.mark.asyncio
async def test_in_progress_returns_null_when_none(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/workouts/in-progress")

    assert res.status_code == 200
    assert res.json() is None


@pytest.mark.asyncio
async def test_in_progress_returns_workout(make_mock_get_conn):
    import datetime as dt
    wid = uuid.UUID("cccccccc-0000-0000-0000-000000000001")
    started = dt.datetime(2026, 6, 6, 10, 0, 0, tzinfo=dt.timezone.utc)
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(wid, started, 2))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/workouts/in-progress")

    body = res.json()
    assert body is not None
    assert body["workout_id"] == str(wid)
    assert body["sets_logged"] == 2
```

(Add `import uuid` at top of file if not already present.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd api && .venv/bin/pytest tests/test_workouts_router.py -v -k "in_progress"`
Expected: FAIL with 404 Not Found (endpoint doesn't exist).

- [ ] **Step 3: Implement endpoint**

Append to `api/app/routers/workouts.py`:

```python
@router.get("/workouts/in-progress")
async def get_in_progress_workout(request: Request) -> dict | None:
    """Returns the oldest uncompleted workout for the user, or null."""
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT w.id, w.started_at,
                       (SELECT COUNT(*) FROM workout_sets ws WHERE ws.workout_id = w.id)::int
                FROM workouts w
                WHERE w.user_id = %s AND w.completed_at IS NULL
                ORDER BY w.started_at ASC
                LIMIT 1
                """,
                (user_id,),
            )
            row = await cur.fetchone()
    except Exception as e:
        print(f"[get_in_progress_workout] DB error: {e}")
        return None
    if row is None:
        return None
    return {
        "workout_id": str(row[0]),
        "started_at": row[1].isoformat() if row[1] else None,
        "sets_logged": row[2],
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd api && .venv/bin/pytest tests/test_workouts_router.py -v -k "in_progress"`
Expected: Both PASS.

- [ ] **Step 5: Commit**

```bash
git add api/app/routers/workouts.py api/tests/test_workouts_router.py
git commit -m "feat(api): add GET /api/workouts/in-progress for banner state"
```

---

### Task 5: DELETE /api/workouts/{id} — discard workout

**Files:**
- Modify: `api/app/routers/workouts.py`
- Modify: `api/tests/test_workouts_router.py`

- [ ] **Step 1: Write failing tests**

Append to `api/tests/test_workouts_router.py`:

```python
@pytest.mark.asyncio
async def test_delete_workout_returns_204(make_mock_get_conn):
    wid = uuid.UUID("cccccccc-0000-0000-0000-000000000002")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(wid,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.delete(f"/api/workouts/{wid}")

    assert res.status_code == 204


@pytest.mark.asyncio
async def test_delete_workout_returns_404_when_missing(make_mock_get_conn):
    wid = uuid.UUID("cccccccc-0000-0000-0000-000000000003")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.delete(f"/api/workouts/{wid}")

    assert res.status_code == 404
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd api && .venv/bin/pytest tests/test_workouts_router.py -v -k "delete_workout"`
Expected: FAIL with 405 Method Not Allowed.

- [ ] **Step 3: Implement endpoint**

Append to `api/app/routers/workouts.py`:

```python
@router.delete("/workouts/{workout_id}", status_code=204)
async def delete_workout(workout_id: uuid.UUID, request: Request) -> None:
    """Discard a workout (works for both in-progress and completed).
    workout_sets cascade-delete via FK."""
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM workouts WHERE id = %s AND user_id = %s RETURNING id",
                (workout_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Workout not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[delete_workout] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd api && .venv/bin/pytest tests/test_workouts_router.py -v -k "delete_workout"`
Expected: Both PASS.

- [ ] **Step 5: Commit**

```bash
git add api/app/routers/workouts.py api/tests/test_workouts_router.py
git commit -m "feat(api): add DELETE /api/workouts/{id} to discard workout"
```

---

## Phase 2: Frontend API client

### Task 6: Extend web/src/lib/api.ts with folder + new program/workout functions

**Files:**
- Modify: `web/src/lib/api.ts` (append types + functions)

- [ ] **Step 1: Append types and client functions**

Append at the bottom of `web/src/lib/api.ts`:

```ts
/* ── Folders ────────────────────────────────────────────── */

export type ProgramFolder = {
  id: string
  name: string
  program_count: number
}

export async function getFolders(): Promise<ProgramFolder[]> {
  const res = await fetch(`${API_BASE}/api/folders`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramFolder[]>
}

export async function createFolder(name: string): Promise<ProgramFolder> {
  const res = await fetch(`${API_BASE}/api/folders`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramFolder>
}

export async function renameFolder(id: string, name: string): Promise<ProgramFolder> {
  const res = await fetch(`${API_BASE}/api/folders/${id}`, {
    method: "PATCH",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramFolder>
}

export async function deleteFolder(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/folders/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

/* ── Program patch ──────────────────────────────────────── */

export async function patchProgram(
  id: string,
  body: { is_active?: boolean; folder_id?: string | null; name?: string }
): Promise<Program> {
  const res = await fetch(`${API_BASE}/api/programs/${id}`, {
    method: "PATCH",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Program>
}

/* ── In-progress workout ────────────────────────────────── */

export type InProgressWorkout = {
  workout_id: string
  started_at: string | null
  sets_logged: number
}

export async function getInProgressWorkout(): Promise<InProgressWorkout | null> {
  const res = await fetch(`${API_BASE}/api/workouts/in-progress`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<InProgressWorkout | null>
}

export async function discardWorkout(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workouts/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}
```

Also update the `Program` type at line ~80 to add the folder_id field — find:

```ts
export type Program = {
  id: string
  name: string
  is_active: boolean
  days_count?: number
  days?: ProgramDay[]
}
```

Replace with:

```ts
export type Program = {
  id: string
  name: string
  is_active: boolean
  days_count?: number
  days?: ProgramDay[]
  folder_id?: string | null
}
```

- [ ] **Step 2: Run typecheck**

Run: `cd web && npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/api.ts
git commit -m "feat(web): add folders/patch/in-progress client functions to lib/api.ts"
```

---

## Phase 3: Library route

### Task 7: TodaysWorkoutBanner — alle 5 states

**Files:**
- Create: `web/src/components/program/library/TodaysWorkoutBanner.tsx`
- Test: `web/src/components/program/library/TodaysWorkoutBanner.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `web/src/components/program/library/TodaysWorkoutBanner.test.tsx`:

```tsx
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import TodaysWorkoutBanner from "./TodaysWorkoutBanner"

describe("TodaysWorkoutBanner", () => {
  it("renders 'Fortsett' when workout is in progress", () => {
    render(
      <TodaysWorkoutBanner
        state={{
          kind: "in-progress",
          workoutId: "w-1",
          dayName: "Underkropp",
          setsLogged: 2,
        }}
      />
    )
    expect(screen.getByText(/Pågående/i)).toBeInTheDocument()
    expect(screen.getByText("Underkropp")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Fortsett/i })).toBeInTheDocument()
  })

  it("renders 'Start' when today has a workout day", () => {
    render(
      <TodaysWorkoutBanner
        state={{
          kind: "today-ready",
          dayId: "d-1",
          dayName: "Underkropp",
          exerciseCount: 4,
        }}
      />
    )
    expect(screen.getByText(/Dagens økt/i)).toBeInTheDocument()
    expect(screen.getByText("Underkropp")).toBeInTheDocument()
    expect(screen.getByText(/4 øvelser/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Start/i })).toBeInTheDocument()
  })

  it("renders rest-day message", () => {
    render(
      <TodaysWorkoutBanner
        state={{ kind: "rest-day", nextDayName: "Overkropp" }}
      />
    )
    expect(screen.getByText(/Hviledag/)).toBeInTheDocument()
    expect(screen.getByText(/Overkropp/)).toBeInTheDocument()
  })

  it("renders 'Velg aktivt program' when no active program", () => {
    render(
      <TodaysWorkoutBanner state={{ kind: "no-active", programCount: 3 }} />
    )
    expect(screen.getByText(/Ingen er aktiv/)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Velg aktivt program/i })
    ).toBeInTheDocument()
  })

  it("renders empty CTA when no programs at all", () => {
    render(<TodaysWorkoutBanner state={{ kind: "empty" }} />)
    expect(screen.getByText(/første program/i)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Lag program/i })
    ).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && npm run test -- TodaysWorkoutBanner.test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement TodaysWorkoutBanner**

Create `web/src/components/program/library/TodaysWorkoutBanner.tsx`:

```tsx
"use client"

export type BannerState =
  | { kind: "in-progress"; workoutId: string; dayName: string; setsLogged: number }
  | { kind: "today-ready"; dayId: string; dayName: string; exerciseCount: number }
  | { kind: "rest-day"; nextDayName: string | null }
  | { kind: "no-active"; programCount: number }
  | { kind: "empty" }

interface Props {
  state: BannerState
  onStart?: () => void
  onContinue?: () => void
  onPickActive?: () => void
  onCreateProgram?: () => void
  onSeeProgram?: () => void
}

function activeBg(): string {
  return "linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-orange-deep) 100%)"
}

function restBg(): string {
  return "linear-gradient(135deg, var(--brand-subtle) 0%, var(--brand-orange-soft) 100%)"
}

export default function TodaysWorkoutBanner({
  state,
  onStart,
  onContinue,
  onPickActive,
  onCreateProgram,
  onSeeProgram,
}: Props) {
  const baseStyle: React.CSSProperties = {
    borderRadius: 16,
    padding: "14px 16px",
    marginBottom: 18,
  }

  if (state.kind === "in-progress") {
    return (
      <div style={{ ...baseStyle, background: activeBg(), color: "#fff" }}>
        <div style={labelStyle}>
          <span style={pulseStyle} aria-hidden /> Pågående
        </div>
        <div style={titleStyle}>{state.dayName}</div>
        <div style={metaStyle(true)}>
          {state.setsLogged} sett logget
        </div>
        <button
          type="button"
          onClick={onContinue}
          style={ctaStyle("white")}
        >
          Fortsett →
        </button>
      </div>
    )
  }

  if (state.kind === "today-ready") {
    return (
      <div style={{ ...baseStyle, background: activeBg(), color: "#fff" }}>
        <div style={labelStyle}>Dagens økt</div>
        <div style={titleStyle}>{state.dayName}</div>
        <div style={metaStyle(true)}>{state.exerciseCount} øvelser</div>
        <button type="button" onClick={onStart} style={ctaStyle("white")}>
          Start →
        </button>
      </div>
    )
  }

  if (state.kind === "rest-day") {
    return (
      <div
        style={{
          ...baseStyle,
          background: restBg(),
          color: "var(--brand-ink)",
          border: "1px solid var(--brand-orange-soft)",
        }}
      >
        <div style={{ ...labelStyle, color: "var(--brand-muted)" }}>I dag</div>
        <div style={titleStyle}>Hviledag 💤</div>
        <div style={metaStyle(false)}>
          {state.nextDayName
            ? `Neste økt: i morgen · ${state.nextDayName}`
            : "Neste økt: senere denne uken"}
        </div>
        <button type="button" onClick={onSeeProgram} style={ctaStyle("muted")}>
          Se programmet →
        </button>
      </div>
    )
  }

  if (state.kind === "no-active") {
    return (
      <div
        style={{
          ...baseStyle,
          background: "var(--brand-surface)",
          border: "1px dashed var(--brand-border)",
          color: "var(--brand-ink)",
        }}
      >
        <div style={{ ...labelStyle, color: "var(--brand-muted)" }}>
          Du har {state.programCount} {state.programCount === 1 ? "program" : "programmer"}
        </div>
        <div style={titleStyle}>Ingen er aktiv akkurat nå</div>
        <div style={metaStyle(false)}>Velg ett for å se dagens økt her.</div>
        <button type="button" onClick={onPickActive} style={ctaStyle("orange")}>
          Velg aktivt program
        </button>
      </div>
    )
  }

  // empty
  return (
    <div
      style={{
        ...baseStyle,
        background: "var(--brand-surface)",
        border: "1px dashed var(--brand-border)",
        color: "var(--brand-ink)",
      }}
    >
      <div style={{ ...labelStyle, color: "var(--brand-muted)" }}>Kom i gang</div>
      <div style={titleStyle}>Lag ditt første program</div>
      <div style={metaStyle(false)}>
        Snakk med coachen, velg en mal, eller bygg selv.
      </div>
      <button type="button" onClick={onCreateProgram} style={ctaStyle("orange")}>
        Lag program
      </button>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: 1,
  textTransform: "uppercase",
  fontWeight: 600,
  opacity: 0.9,
}

const titleStyle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  margin: "4px 0 2px",
  letterSpacing: "-0.02em",
}

function metaStyle(onOrange: boolean): React.CSSProperties {
  return {
    fontSize: 12,
    opacity: onOrange ? 0.9 : 1,
    color: onOrange ? "inherit" : "var(--brand-muted)",
    marginBottom: 10,
  }
}

function ctaStyle(variant: "white" | "muted" | "orange"): React.CSSProperties {
  if (variant === "white") {
    return {
      background: "#fff",
      color: "var(--brand-orange-deep)",
      border: "none",
      borderRadius: 999,
      padding: "8px 14px",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
    }
  }
  if (variant === "orange") {
    return {
      background: "var(--brand-orange)",
      color: "#fff",
      border: "none",
      borderRadius: 999,
      padding: "8px 14px",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
    }
  }
  return {
    background: "rgba(255,255,255,0.85)",
    color: "var(--brand-orange-deep)",
    border: "none",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  }
}

const pulseStyle: React.CSSProperties = {
  display: "inline-block",
  width: 6,
  height: 6,
  borderRadius: 999,
  background: "#fff",
  marginRight: 6,
  verticalAlign: "middle",
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web && npm run test -- TodaysWorkoutBanner.test`
Expected: All 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/program/library/TodaysWorkoutBanner.tsx web/src/components/program/library/TodaysWorkoutBanner.test.tsx
git commit -m "feat(web): add TodaysWorkoutBanner with 5 states"
```

---

### Task 8: FolderCard + ProgramCard

**Files:**
- Create: `web/src/components/program/library/FolderCard.tsx`
- Create: `web/src/components/program/library/ProgramCard.tsx`
- Test: `web/src/components/program/library/FolderCard.test.tsx`
- Test: `web/src/components/program/library/ProgramCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `web/src/components/program/library/FolderCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import FolderCard from "./FolderCard"

describe("FolderCard", () => {
  it("renders name and program count", () => {
    render(<FolderCard folder={{ id: "f-1", name: "Bulk 2026", program_count: 3 }} onOpen={() => {}} />)
    expect(screen.getByText("Bulk 2026")).toBeInTheDocument()
    expect(screen.getByText("3 programmer")).toBeInTheDocument()
  })

  it("renders '1 program' singular when count is 1", () => {
    render(<FolderCard folder={{ id: "f-2", name: "Cut", program_count: 1 }} onOpen={() => {}} />)
    expect(screen.getByText("1 program")).toBeInTheDocument()
  })

  it("fires onOpen when clicked", () => {
    const onOpen = vi.fn()
    render(<FolderCard folder={{ id: "f-3", name: "X", program_count: 0 }} onOpen={onOpen} />)
    fireEvent.click(screen.getByRole("button"))
    expect(onOpen).toHaveBeenCalledWith("f-3")
  })
})
```

Create `web/src/components/program/library/ProgramCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import ProgramCard from "./ProgramCard"

describe("ProgramCard", () => {
  it("renders program name and days count", () => {
    render(
      <ProgramCard
        program={{ id: "p-1", name: "PPL 6-dagers", is_active: false, days_count: 6 }}
        onOpen={() => {}}
      />
    )
    expect(screen.getByText("PPL 6-dagers")).toBeInTheDocument()
    expect(screen.getByText(/6 dager/i)).toBeInTheDocument()
  })

  it("shows AKTIV pill when active", () => {
    render(
      <ProgramCard
        program={{ id: "p-2", name: "X", is_active: true, days_count: 3 }}
        onOpen={() => {}}
      />
    )
    expect(screen.getByText(/AKTIV/i)).toBeInTheDocument()
  })

  it("does not show AKTIV pill when not active", () => {
    render(
      <ProgramCard
        program={{ id: "p-3", name: "Y", is_active: false, days_count: 3 }}
        onOpen={() => {}}
      />
    )
    expect(screen.queryByText(/AKTIV/i)).not.toBeInTheDocument()
  })

  it("fires onOpen with program id", () => {
    const onOpen = vi.fn()
    render(
      <ProgramCard
        program={{ id: "p-4", name: "Z", is_active: false, days_count: 3 }}
        onOpen={onOpen}
      />
    )
    fireEvent.click(screen.getByRole("button"))
    expect(onOpen).toHaveBeenCalledWith("p-4")
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && npm run test -- FolderCard.test ProgramCard.test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement FolderCard**

Create `web/src/components/program/library/FolderCard.tsx`:

```tsx
"use client"
import type { ProgramFolder } from "@/lib/api"

interface Props {
  folder: ProgramFolder
  onOpen: (id: string) => void
}

export default function FolderCard({ folder, onOpen }: Props) {
  const countLabel = folder.program_count === 1 ? "1 program" : `${folder.program_count} programmer`
  return (
    <button
      type="button"
      onClick={() => onOpen(folder.id)}
      style={{
        background: "linear-gradient(180deg, var(--brand-subtle) 0%, var(--brand-surface) 100%)",
        border: "1px solid var(--brand-border)",
        borderRadius: 14,
        padding: "14px 12px",
        minHeight: 100,
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "rgba(249, 115, 22, 0.15)",
          color: "var(--brand-orange)",
          display: "grid",
          placeItems: "center",
          fontSize: 16,
          marginBottom: 10,
        }}
      >
        📁
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-ink)", lineHeight: 1.25 }}>
        {folder.name}
      </div>
      <div style={{ fontSize: 10, color: "var(--brand-muted)", marginTop: 4 }}>
        {countLabel}
      </div>
    </button>
  )
}
```

- [ ] **Step 4: Implement ProgramCard**

Create `web/src/components/program/library/ProgramCard.tsx`:

```tsx
"use client"
import type { Program } from "@/lib/api"

interface Props {
  program: Pick<Program, "id" | "name" | "is_active" | "days_count">
  onOpen: (id: string) => void
}

export default function ProgramCard({ program, onOpen }: Props) {
  const daysLabel =
    program.days_count != null
      ? `${program.days_count} dager`
      : "Program"
  return (
    <button
      type="button"
      onClick={() => onOpen(program.id)}
      style={{
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        borderRadius: 14,
        padding: "14px 12px",
        minHeight: 100,
        textAlign: "left",
        cursor: "pointer",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {program.is_active && (
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "var(--brand-orange)",
            color: "#fff",
            fontSize: 8,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 999,
            letterSpacing: 0.4,
          }}
        >
          AKTIV
        </span>
      )}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "var(--brand-subtle)",
          color: "var(--brand-orange)",
          display: "grid",
          placeItems: "center",
          fontSize: 16,
          marginBottom: 10,
        }}
      >
        💪
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-ink)", lineHeight: 1.25 }}>
        {program.name}
      </div>
      <div style={{ fontSize: 10, color: "var(--brand-muted)", marginTop: 4 }}>
        {daysLabel}
      </div>
    </button>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd web && npm run test -- FolderCard.test ProgramCard.test`
Expected: All 7 PASS.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/program/library/FolderCard.tsx web/src/components/program/library/FolderCard.test.tsx web/src/components/program/library/ProgramCard.tsx web/src/components/program/library/ProgramCard.test.tsx
git commit -m "feat(web): add FolderCard and ProgramCard for library grids"
```

---

### Task 9: NewProgramSheet — bottom sheet with three options

**Files:**
- Create: `web/src/components/program/library/NewProgramSheet.tsx`

- [ ] **Step 1: Implement sheet**

Create `web/src/components/program/library/NewProgramSheet.tsx`:

```tsx
"use client"
import { useRouter } from "next/navigation"

interface Props {
  open: boolean
  onClose: () => void
}

export default function NewProgramSheet({ open, onClose }: Props) {
  const router = useRouter()
  if (!open) return null

  const handleCoach = () => {
    onClose()
    router.push("/coach?prompt=lag-program")
  }
  const handleTemplate = () => {
    onClose()
    // Maler kommer i egen workstream; placeholder router for nå
    alert("Mal-bibliotek kommer snart")
  }
  const handleScratch = () => {
    onClose()
    alert("Bygg fra scratch kommer snart")
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 20px 28px",
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            background: "var(--brand-border)",
            borderRadius: 999,
            margin: "0 auto 14px",
          }}
        />
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--brand-ink)",
            textAlign: "center",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          Hvor skal vi begynne?
        </div>

        <SheetRow
          icon="💬"
          name="Snakk med coachen"
          meta="Coachen lager et program tilpasset deg"
          onClick={handleCoach}
        />
        <SheetRow
          icon="📋"
          name="Velg en mal"
          meta="PPL, full body, push-pull osv."
          onClick={handleTemplate}
        />
        <SheetRow
          icon="✏️"
          name="Bygg fra scratch"
          meta="Definer dager og øvelser selv"
          onClick={handleScratch}
        />
      </div>
    </div>
  )
}

function SheetRow({
  icon,
  name,
  meta,
  onClick,
}: {
  icon: string
  name: string
  meta: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 8,
        display: "flex",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: "var(--brand-subtle)",
          color: "var(--brand-orange)",
          display: "grid",
          placeItems: "center",
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-ink)" }}>{name}</div>
        <div style={{ fontSize: 11, color: "var(--brand-muted)" }}>{meta}</div>
      </div>
    </button>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `cd web && npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/program/library/NewProgramSheet.tsx
git commit -m "feat(web): add NewProgramSheet with coach/template/scratch options"
```

---

### Task 10: NewFolderSheet — name input

**Files:**
- Create: `web/src/components/program/library/NewFolderSheet.tsx`

- [ ] **Step 1: Implement sheet**

Create `web/src/components/program/library/NewFolderSheet.tsx`:

```tsx
"use client"
import { useState } from "react"
import { createFolder } from "@/lib/api"

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export default function NewFolderSheet({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!open) return null

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    setError(null)
    try {
      await createFolder(trimmed)
      setName("")
      onCreated()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke lage mappe")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 20px 28px",
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            background: "var(--brand-border)",
            borderRadius: 999,
            margin: "0 auto 14px",
          }}
        />
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--brand-ink)",
            textAlign: "center",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          Lag ny mappe
        </div>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit() }}
          placeholder="F.eks. Bulk 2027"
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "var(--brand-surface)",
            border: "1.5px solid var(--brand-border)",
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 13,
            color: "var(--brand-ink)",
            marginBottom: 12,
          }}
        />

        {error && (
          <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10 }}>{error}</div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={!name.trim() || busy}
          style={{
            width: "100%",
            background: "var(--brand-orange)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: 12,
            fontSize: 13,
            fontWeight: 700,
            cursor: busy || !name.trim() ? "default" : "pointer",
            opacity: busy || !name.trim() ? 0.6 : 1,
          }}
        >
          {busy ? "Lager…" : "Lag mappe"}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `cd web && npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/program/library/NewFolderSheet.tsx
git commit -m "feat(web): add NewFolderSheet for creating program folders"
```

---

### Task 11: ProgramPickerSheet — choose active program

**Files:**
- Create: `web/src/components/program/library/ProgramPickerSheet.tsx`

- [ ] **Step 1: Implement sheet**

Create `web/src/components/program/library/ProgramPickerSheet.tsx`:

```tsx
"use client"
import { useState } from "react"
import { patchProgram, type Program } from "@/lib/api"

interface Props {
  open: boolean
  onClose: () => void
  programs: Pick<Program, "id" | "name" | "is_active" | "days_count">[]
  onActivated: () => void
}

export default function ProgramPickerSheet({ open, onClose, programs, onActivated }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  if (!open) return null

  const activate = async (id: string) => {
    setBusyId(id)
    setError(null)
    try {
      await patchProgram(id, { is_active: true })
      onActivated()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke aktivere")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 20px 28px",
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            background: "var(--brand-border)",
            borderRadius: 999,
            margin: "0 auto 14px",
          }}
        />
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--brand-ink)",
            textAlign: "center",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          Velg aktivt program
        </div>

        {error && (
          <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10, textAlign: "center" }}>
            {error}
          </div>
        )}

        {programs.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--brand-muted)", padding: "20px 0" }}>
            Ingen programmer å velge mellom
          </div>
        ) : (
          programs.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => activate(p.id)}
              disabled={busyId !== null}
              style={{
                width: "100%",
                background: p.is_active ? "var(--brand-subtle)" : "var(--brand-surface)",
                border: `1px solid ${p.is_active ? "var(--brand-orange)" : "var(--brand-border)"}`,
                borderRadius: 12,
                padding: "12px 14px",
                marginBottom: 8,
                textAlign: "left",
                cursor: busyId === null ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-ink)" }}>{p.name}</div>
                {p.days_count != null && (
                  <div style={{ fontSize: 11, color: "var(--brand-muted)" }}>{p.days_count} dager</div>
                )}
              </div>
              {busyId === p.id ? (
                <span style={{ fontSize: 11, color: "var(--brand-muted)" }}>Aktiverer…</span>
              ) : p.is_active ? (
                <span style={{ fontSize: 11, color: "var(--brand-orange)", fontWeight: 700 }}>✓</span>
              ) : null}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `cd web && npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/program/library/ProgramPickerSheet.tsx
git commit -m "feat(web): add ProgramPickerSheet to choose active program"
```

---

### Task 12: ProgramLibrary orchestrator + new /program/page.tsx

**Files:**
- Create: `web/src/components/program/library/ProgramLibrary.tsx`
- Modify: `web/src/app/(tabs)/program/page.tsx` (replace contents)

- [ ] **Step 1: Implement ProgramLibrary client component**

Create `web/src/components/program/library/ProgramLibrary.tsx`:

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { startWorkout, type Program, type ProgramFolder, type InProgressWorkout } from "@/lib/api"
import TodaysWorkoutBanner, { type BannerState } from "./TodaysWorkoutBanner"
import FolderCard from "./FolderCard"
import ProgramCard from "./ProgramCard"
import NewProgramSheet from "./NewProgramSheet"
import NewFolderSheet from "./NewFolderSheet"
import ProgramPickerSheet from "./ProgramPickerSheet"

export interface TodaysWorkoutInfo {
  programId: string
  dayId: string
  dayName: string
  exerciseCount: number
  nextDayName: string | null
}

interface Props {
  programs: Program[]
  folders: ProgramFolder[]
  todaysWorkout: TodaysWorkoutInfo | null  // null if rest-day OR no active
  hasActiveProgram: boolean
  inProgress: InProgressWorkout | null
}

function deriveBannerState(props: Props): BannerState {
  if (props.inProgress) {
    return {
      kind: "in-progress",
      workoutId: props.inProgress.workout_id,
      dayName: "Pågående økt",
      setsLogged: props.inProgress.sets_logged,
    }
  }
  if (props.todaysWorkout) {
    return {
      kind: "today-ready",
      dayId: props.todaysWorkout.dayId,
      dayName: props.todaysWorkout.dayName,
      exerciseCount: props.todaysWorkout.exerciseCount,
    }
  }
  if (props.hasActiveProgram) {
    return {
      kind: "rest-day",
      nextDayName: null,  // server can populate later
    }
  }
  if (props.programs.length === 0) {
    return { kind: "empty" }
  }
  return { kind: "no-active", programCount: props.programs.length }
}

export default function ProgramLibrary(props: Props) {
  const router = useRouter()
  const [newProgramOpen, setNewProgramOpen] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [starting, setStarting] = useState(false)

  const bannerState = deriveBannerState(props)

  const handleStart = async () => {
    if (!props.todaysWorkout || starting) return
    setStarting(true)
    try {
      const { workout_id } = await startWorkout(props.todaysWorkout.dayId)
      router.push(`/program/workout/${workout_id}`)
    } catch {
      setStarting(false)
    }
  }

  const handleContinue = () => {
    if (props.inProgress) router.push(`/program/workout/${props.inProgress.workout_id}`)
  }

  const handleSeeProgram = () => {
    // Find the active program and go to it
    const active = props.programs.find((p) => p.is_active)
    if (active) router.push(`/program/${active.id}`)
  }

  return (
    <div style={{ padding: 20, background: "var(--brand-canvas)", minHeight: "100%" }}>
      <TodaysWorkoutBanner
        state={bannerState}
        onStart={handleStart}
        onContinue={handleContinue}
        onSeeProgram={handleSeeProgram}
        onPickActive={() => setPickerOpen(true)}
        onCreateProgram={() => setNewProgramOpen(true)}
      />

      <SectionHeader title="Mapper" onAdd={() => setNewFolderOpen(true)} />
      {props.folders.length === 0 ? (
        <EmptyHint text="Ingen mapper enda" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
          {props.folders.map((f) => (
            <FolderCard key={f.id} folder={f} onOpen={() => { /* folder detail later */ }} />
          ))}
        </div>
      )}

      <SectionHeader title="Programmer" onAdd={() => setNewProgramOpen(true)} />
      {props.programs.length === 0 ? (
        <EmptyHint text="Ingen programmer enda" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {props.programs.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              onOpen={(id) => router.push(`/program/${id}`)}
            />
          ))}
        </div>
      )}

      <NewProgramSheet
        open={newProgramOpen}
        onClose={() => setNewProgramOpen(false)}
      />
      <NewFolderSheet
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        onCreated={() => router.refresh()}
      />
      <ProgramPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        programs={props.programs}
        onActivated={() => router.refresh()}
      />
    </div>
  )
}

function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        margin: "14px 4px 8px",
      }}
    >
      <span
        style={{
          fontSize: 11,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "var(--brand-muted)",
          fontWeight: 600,
        }}
      >
        {title}
      </span>
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Legg til ${title.toLowerCase()}`}
        style={{
          background: "none",
          border: "none",
          color: "var(--brand-orange)",
          fontSize: 18,
          fontWeight: 700,
          cursor: "pointer",
          padding: "0 4px",
        }}
      >
        +
      </button>
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div
      style={{
        background: "var(--brand-surface)",
        border: "1px dashed var(--brand-border)",
        borderRadius: 12,
        padding: "16px 12px",
        textAlign: "center",
        color: "var(--brand-muted)",
        fontSize: 12,
        marginBottom: 18,
      }}
    >
      {text}
    </div>
  )
}
```

- [ ] **Step 2: Replace `/program/page.tsx` with the new server component**

Replace the entire contents of `web/src/app/(tabs)/program/page.tsx` with:

```tsx
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import ProgramLibrary, { type TodaysWorkoutInfo } from "@/components/program/library/ProgramLibrary"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function safeFetch(path: string, token: string): Promise<unknown> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function computeTodaysWorkout(active: {
  id: string
  days: { id: string; day_number: number; name: string; exercises: unknown[] }[]
} | null): TodaysWorkoutInfo | null {
  if (!active) return null
  const jsDay = new Date().getDay()
  const todayDayNumber = jsDay === 0 ? 7 : jsDay
  const day = active.days.find((d) => d.day_number === todayDayNumber)
  if (!day || day.exercises.length === 0) return null
  return {
    programId: active.id,
    dayId: day.id,
    dayName: day.name,
    exerciseCount: day.exercises.length,
    nextDayName: null,
  }
}

export default async function ProgramPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const token = session.access_token

  const [programs, folders, active, inProgress] = await Promise.all([
    safeFetch("/api/programs", token),
    safeFetch("/api/folders", token),
    safeFetch("/api/programs/active", token),
    safeFetch("/api/workouts/in-progress", token),
  ])

  type Active = { id: string; days: { id: string; day_number: number; name: string; exercises: unknown[] }[] } | null
  const todays = computeTodaysWorkout(active as Active)
  const hasActive = active !== null

  return (
    <ProgramLibrary
      programs={(programs as Parameters<typeof ProgramLibrary>[0]["programs"]) ?? []}
      folders={(folders as Parameters<typeof ProgramLibrary>[0]["folders"]) ?? []}
      todaysWorkout={todays}
      hasActiveProgram={hasActive}
      inProgress={(inProgress as Parameters<typeof ProgramLibrary>[0]["inProgress"]) ?? null}
    />
  )
}
```

- [ ] **Step 3: Run typecheck**

Run: `cd web && npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Smoke-test in browser**

Open `localhost:3000/program`. Verify: banner renders (either "today-ready" if active program with today's day, otherwise one of the other states), folder/program grids render. Tap "+ on Programmer" opens NewProgramSheet. Tap "+ on Mapper" opens NewFolderSheet and creates a folder.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/program/library/ProgramLibrary.tsx web/src/app/\(tabs\)/program/page.tsx
git commit -m "feat(web): wire up new Program library page with banner + grids + sheets"
```

---

## Phase 4: Program detail route

### Task 13: DayCard

**Files:**
- Create: `web/src/components/program/detail/DayCard.tsx`
- Test: `web/src/components/program/detail/DayCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `web/src/components/program/detail/DayCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import DayCard from "./DayCard"

describe("DayCard", () => {
  it("renders day name and exercise count", () => {
    render(
      <DayCard
        day={{ id: "d-1", day_number: 1, name: "Underkropp", exercise_count: 4 }}
        isToday={false}
        onOpen={() => {}}
      />
    )
    expect(screen.getByText(/Dag 1 · Underkropp/)).toBeInTheDocument()
    expect(screen.getByText(/4 øvelser/)).toBeInTheDocument()
  })

  it("shows 'I dag' pill when isToday is true", () => {
    render(
      <DayCard
        day={{ id: "d-2", day_number: 2, name: "Overkropp", exercise_count: 5 }}
        isToday={true}
        onOpen={() => {}}
      />
    )
    expect(screen.getByText(/I dag/i)).toBeInTheDocument()
  })

  it("renders 'Hviledag' state when exercise_count is 0", () => {
    render(
      <DayCard
        day={{ id: "d-3", day_number: 3, name: "Hviledag", exercise_count: 0 }}
        isToday={false}
        onOpen={() => {}}
      />
    )
    expect(screen.getByText(/Hviledag/)).toBeInTheDocument()
  })

  it("fires onOpen when clicked and has exercises", () => {
    const onOpen = vi.fn()
    render(
      <DayCard
        day={{ id: "d-4", day_number: 4, name: "Legs", exercise_count: 3 }}
        isToday={false}
        onOpen={onOpen}
      />
    )
    fireEvent.click(screen.getByRole("button"))
    expect(onOpen).toHaveBeenCalledWith("d-4")
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && npm run test -- DayCard.test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement DayCard**

Create `web/src/components/program/detail/DayCard.tsx`:

```tsx
"use client"

export interface DaySummary {
  id: string
  day_number: number
  name: string
  exercise_count: number
}

interface Props {
  day: DaySummary
  isToday: boolean
  onOpen: (id: string) => void
}

export default function DayCard({ day, isToday, onOpen }: Props) {
  const isRest = day.exercise_count === 0
  const baseStyle: React.CSSProperties = {
    background: isToday ? "linear-gradient(180deg, var(--brand-subtle) 0%, var(--brand-surface) 100%)" : "var(--brand-surface)",
    border: `${isToday ? "1.5px" : "1px"} solid ${isToday ? "var(--brand-orange)" : "var(--brand-border)"}`,
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 8,
    opacity: isRest ? 0.55 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    textAlign: "left",
    cursor: isRest ? "default" : "pointer",
  }

  const content = (
    <>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-ink)" }}>
          Dag {day.day_number} · {day.name}
        </div>
        <div style={{ fontSize: 11, color: "var(--brand-muted)", marginTop: 2 }}>
          {isRest ? "—" : `${day.exercise_count} øvelser`}
        </div>
      </div>
      {isToday && (
        <span
          style={{
            background: "var(--brand-orange)",
            color: "#fff",
            fontSize: 8,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 999,
            letterSpacing: 0.4,
          }}
        >
          I DAG
        </span>
      )}
      {!isToday && !isRest && <span style={{ color: "var(--brand-faint)", fontSize: 14 }}>›</span>}
    </>
  )

  if (isRest) {
    return <div style={baseStyle}>{content}</div>
  }
  return (
    <button type="button" onClick={() => onOpen(day.id)} style={baseStyle}>
      {content}
    </button>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web && npm run test -- DayCard.test`
Expected: All 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/program/detail/DayCard.tsx web/src/components/program/detail/DayCard.test.tsx
git commit -m "feat(web): add DayCard for program detail view"
```

---

### Task 14: ProgramDetailHeader + ProgramMenuSheet + MoveToFolderSheet

**Files:**
- Create: `web/src/components/program/detail/ProgramDetailHeader.tsx`
- Create: `web/src/components/program/detail/ProgramMenuSheet.tsx`
- Create: `web/src/components/program/detail/MoveToFolderSheet.tsx`

- [ ] **Step 1: Implement ProgramDetailHeader**

Create `web/src/components/program/detail/ProgramDetailHeader.tsx`:

```tsx
"use client"
import { useRouter } from "next/navigation"

interface Props {
  programName: string
  isActive: boolean
  subtitle?: string
  onOpenMenu: () => void
}

export default function ProgramDetailHeader({ programName, isActive, subtitle, onOpenMenu }: Props) {
  const router = useRouter()
  return (
    <>
      <button
        type="button"
        onClick={() => router.push("/program")}
        style={{
          background: "none",
          border: "none",
          color: "var(--brand-muted)",
          fontSize: 12,
          padding: 0,
          marginBottom: 8,
          cursor: "pointer",
        }}
      >
        ‹ Bibliotek
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--brand-ink)",
              letterSpacing: "-0.02em",
            }}
          >
            {programName}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: "var(--brand-muted)", marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Meny"
          style={{
            background: "none",
            border: "none",
            color: "var(--brand-muted)",
            fontSize: 22,
            cursor: "pointer",
            padding: "0 4px",
          }}
        >
          ⋯
        </button>
      </div>
      {isActive && (
        <span
          style={{
            display: "inline-block",
            background: "var(--brand-subtle)",
            color: "var(--brand-orange-deep)",
            fontSize: 9,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 999,
            letterSpacing: 0.4,
            marginBottom: 14,
          }}
        >
          AKTIV
        </span>
      )}
    </>
  )
}
```

- [ ] **Step 2: Implement MoveToFolderSheet**

Create `web/src/components/program/detail/MoveToFolderSheet.tsx`:

```tsx
"use client"
import { useState } from "react"
import { patchProgram, type ProgramFolder } from "@/lib/api"

interface Props {
  open: boolean
  onClose: () => void
  programId: string
  currentFolderId: string | null
  folders: ProgramFolder[]
  onMoved: () => void
}

export default function MoveToFolderSheet({
  open,
  onClose,
  programId,
  currentFolderId,
  folders,
  onMoved,
}: Props) {
  const [busy, setBusy] = useState(false)
  if (!open) return null

  const moveTo = async (folderId: string | null) => {
    setBusy(true)
    try {
      await patchProgram(programId, { folder_id: folderId })
      onMoved()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 20px 28px",
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            background: "var(--brand-border)",
            borderRadius: 999,
            margin: "0 auto 14px",
          }}
        />
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--brand-ink)",
            textAlign: "center",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          Flytt til mappe
        </div>

        {folders.map((f) => (
          <FolderRow
            key={f.id}
            label={`📁 ${f.name}`}
            selected={currentFolderId === f.id}
            disabled={busy}
            onClick={() => moveTo(f.id)}
          />
        ))}
        <FolderRow
          label="↑ Rot (ingen mappe)"
          selected={currentFolderId === null}
          disabled={busy}
          onClick={() => moveTo(null)}
        />
      </div>
    </div>
  )
}

function FolderRow({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string
  selected: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        background: selected ? "var(--brand-subtle)" : "var(--brand-surface)",
        border: `1px solid ${selected ? "var(--brand-orange)" : "var(--brand-border)"}`,
        borderRadius: 10,
        padding: "10px 14px",
        marginBottom: 6,
        textAlign: "left",
        cursor: disabled ? "default" : "pointer",
        fontSize: 13,
        color: "var(--brand-ink)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>{label}</span>
      {selected && <span style={{ color: "var(--brand-orange)", fontWeight: 700 }}>✓</span>}
    </button>
  )
}
```

- [ ] **Step 3: Implement ProgramMenuSheet**

Create `web/src/components/program/detail/ProgramMenuSheet.tsx`:

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { patchProgram, deleteProgram } from "@/lib/api"

interface Props {
  open: boolean
  onClose: () => void
  programId: string
  programName: string
  isActive: boolean
  onOpenMoveSheet: () => void
}

export default function ProgramMenuSheet({
  open,
  onClose,
  programId,
  programName,
  isActive,
  onOpenMoveSheet,
}: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  if (!open) return null

  const handleSetActive = async () => {
    setBusy(true)
    try {
      await patchProgram(programId, { is_active: true })
      router.refresh()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Slett «${programName}»? Dette kan ikke angres.`)) return
    setBusy(true)
    try {
      await deleteProgram(programId)
      router.push("/program")
    } finally {
      setBusy(false)
    }
  }

  const handleMove = () => {
    onClose()
    onOpenMoveSheet()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 20px 28px",
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            background: "var(--brand-border)",
            borderRadius: 999,
            margin: "0 auto 14px",
          }}
        />
        {!isActive && (
          <MenuRow label="Sett som aktivt" onClick={handleSetActive} disabled={busy} />
        )}
        <MenuRow label="Flytt til mappe…" onClick={handleMove} disabled={busy} />
        <MenuRow
          label="Slett program"
          onClick={handleDelete}
          disabled={busy}
          danger
        />
      </div>
    </div>
  )
}

function MenuRow({
  label,
  onClick,
  disabled,
  danger,
}: {
  label: string
  onClick: () => void
  disabled: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        borderRadius: 12,
        padding: "14px",
        marginBottom: 8,
        textAlign: "center",
        cursor: disabled ? "default" : "pointer",
        fontSize: 14,
        fontWeight: 600,
        color: danger ? "var(--danger)" : "var(--brand-ink)",
      }}
    >
      {label}
    </button>
  )
}
```

- [ ] **Step 4: Run typecheck**

Run: `cd web && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/program/detail/ProgramDetailHeader.tsx web/src/components/program/detail/ProgramMenuSheet.tsx web/src/components/program/detail/MoveToFolderSheet.tsx
git commit -m "feat(web): add program detail header + menu + move-to-folder sheets"
```

---

### Task 15: ProgramDetail orchestrator + /program/[programId]/page.tsx

**Files:**
- Create: `web/src/components/program/detail/ProgramDetail.tsx`
- Create: `web/src/app/(tabs)/program/[programId]/page.tsx`

- [ ] **Step 1: Implement ProgramDetail client component**

Create `web/src/components/program/detail/ProgramDetail.tsx`:

```tsx
"use client"
import { useState } from "react"
import type { Program, ProgramFolder } from "@/lib/api"
import ProgramDetailHeader from "./ProgramDetailHeader"
import DayCard from "./DayCard"
import ProgramMenuSheet from "./ProgramMenuSheet"
import MoveToFolderSheet from "./MoveToFolderSheet"

interface Props {
  program: Program
  folders: ProgramFolder[]
  todayDayNumber: number
}

export default function ProgramDetail({ program, folders, todayDayNumber }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)

  const subtitle = `${program.days?.length ?? 0} dager`

  return (
    <div style={{ padding: 20, background: "var(--brand-canvas)", minHeight: "100%" }}>
      <ProgramDetailHeader
        programName={program.name}
        isActive={program.is_active}
        subtitle={subtitle}
        onOpenMenu={() => setMenuOpen(true)}
      />

      <div
        style={{
          fontSize: 11,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "var(--brand-muted)",
          fontWeight: 600,
          margin: "8px 4px",
        }}
      >
        Uken
      </div>

      {(program.days ?? []).map((day) => (
        <DayCard
          key={day.id}
          day={{
            id: day.id,
            day_number: day.day_number,
            name: day.name,
            exercise_count: day.exercises.length,
          }}
          isToday={day.day_number === todayDayNumber && day.exercises.length > 0}
          onOpen={() => { /* day exercise expansion in future iteration */ }}
        />
      ))}

      <ProgramMenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        programId={program.id}
        programName={program.name}
        isActive={program.is_active}
        onOpenMoveSheet={() => setMoveOpen(true)}
      />

      <MoveToFolderSheet
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        programId={program.id}
        currentFolderId={program.folder_id ?? null}
        folders={folders}
        onMoved={() => window.location.reload()}
      />
    </div>
  )
}
```

- [ ] **Step 2: Create the server component page**

Create `web/src/app/(tabs)/program/[programId]/page.tsx`:

```tsx
import { notFound, redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import ProgramDetail from "@/components/program/detail/ProgramDetail"
import type { Program, ProgramFolder } from "@/lib/api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface PageProps {
  params: Promise<{ programId: string }>
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const { programId } = await params

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const headers = { Authorization: `Bearer ${session.access_token}` }

  const [progRes, foldersRes] = await Promise.all([
    fetch(`${API_BASE}/api/programs/${programId}`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/folders`, { headers, cache: "no-store" }),
  ])

  if (progRes.status === 404) notFound()
  if (!progRes.ok) throw new Error(`Failed to load program: ${progRes.status}`)

  const program = (await progRes.json()) as Program
  const folders = (foldersRes.ok ? await foldersRes.json() : []) as ProgramFolder[]

  const jsDay = new Date().getDay()
  const todayDayNumber = jsDay === 0 ? 7 : jsDay

  return <ProgramDetail program={program} folders={folders} todayDayNumber={todayDayNumber} />
}
```

- [ ] **Step 3: Run typecheck**

Run: `cd web && npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Smoke-test**

Open `localhost:3000/program`, tap a program card. Detail page loads, shows days, ⋯ menu opens, "Sett som aktivt"/"Flytt til mappe"/"Slett" all work.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/program/detail/ProgramDetail.tsx web/src/app/\(tabs\)/program/\[programId\]/page.tsx
git commit -m "feat(web): add program detail route with day list and menu sheets"
```

---

## Phase 5: Workout run route

### Task 16: workout/layout.tsx + WorkoutHeader + CloseConfirmSheet

**Files:**
- Create: `web/src/app/(tabs)/program/workout/layout.tsx`
- Create: `web/src/components/program/workout/WorkoutHeader.tsx`
- Create: `web/src/components/program/workout/CloseConfirmSheet.tsx`

- [ ] **Step 1: Create fullscreen layout (no bottom nav)**

Create `web/src/app/(tabs)/program/workout/layout.tsx`:

```tsx
export default function WorkoutLayout({ children }: { children: React.ReactNode }) {
  // Fullscreen — no BottomNav. The (tabs) layout adds BottomNav for its children,
  // but this nested layout overrides only the content area; we still want the
  // workout to take the entire screen. Render a flex column that fills available
  // height and contains nothing but the workout.
  return <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>{children}</div>
}
```

- [ ] **Step 2: Implement WorkoutHeader**

Create `web/src/components/program/workout/WorkoutHeader.tsx`:

```tsx
"use client"
import { useEffect, useState } from "react"

interface Props {
  startedAt: string | null
  dayName: string
  onClose: () => void
}

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function WorkoutHeader({ startedAt, dayName, onClose }: Props) {
  const [elapsed, setElapsed] = useState("00:00")

  useEffect(() => {
    if (!startedAt) return
    const start = new Date(startedAt).getTime()
    const tick = () => setElapsed(formatElapsed(Date.now() - start))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  return (
    <div style={{ padding: "14px 20px 10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Lukk"
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: "var(--brand-surface)",
            border: "1px solid var(--brand-border)",
            color: "var(--brand-muted)",
            fontSize: 18,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
          }}
        >
          ×
        </button>
        <div
          className="tnum"
          style={{ fontSize: 14, fontWeight: 600, color: "var(--brand-ink)", fontVariantNumeric: "tabular-nums" }}
        >
          {elapsed}
        </div>
      </div>
      <div
        style={{
          fontSize: 19,
          fontWeight: 700,
          color: "var(--brand-ink)",
          letterSpacing: "-0.02em",
        }}
      >
        {dayName}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Implement CloseConfirmSheet**

Create `web/src/components/program/workout/CloseConfirmSheet.tsx`:

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { discardWorkout } from "@/lib/api"

interface Props {
  open: boolean
  workoutId: string
  onCancel: () => void
}

export default function CloseConfirmSheet({ open, workoutId, onCancel }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  if (!open) return null

  const handlePause = () => {
    router.push("/program")
  }
  const handleDiscard = async () => {
    setBusy(true)
    try {
      await discardWorkout(workoutId)
      router.push("/program")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 20px 28px",
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            background: "var(--brand-border)",
            borderRadius: 999,
            margin: "0 auto 14px",
          }}
        />
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--brand-ink)",
            textAlign: "center",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          Lukk økten?
        </div>

        <button
          type="button"
          onClick={handlePause}
          disabled={busy}
          style={{
            width: "100%",
            background: "var(--brand-surface)",
            border: "1px solid var(--brand-border)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--brand-ink)",
            cursor: busy ? "default" : "pointer",
          }}
        >
          Lukk og fortsett senere
        </button>
        <button
          type="button"
          onClick={handleDiscard}
          disabled={busy}
          style={{
            width: "100%",
            background: "var(--brand-surface)",
            border: "1px solid var(--brand-border)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--danger)",
            cursor: busy ? "default" : "pointer",
          }}
        >
          {busy ? "Forkaster…" : "Forkast økt"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            color: "var(--brand-muted)",
            fontSize: 13,
            padding: 10,
            cursor: "pointer",
          }}
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run typecheck**

Run: `cd web && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/app/\(tabs\)/program/workout/layout.tsx web/src/components/program/workout/WorkoutHeader.tsx web/src/components/program/workout/CloseConfirmSheet.tsx
git commit -m "feat(web): add workout fullscreen layout, header and close-confirm sheet"
```

---

### Task 17: WorkoutExerciseRow with inline set logging

**Files:**
- Create: `web/src/components/program/workout/WorkoutExerciseRow.tsx`
- Test: `web/src/components/program/workout/WorkoutExerciseRow.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `web/src/components/program/workout/WorkoutExerciseRow.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import WorkoutExerciseRow from "./WorkoutExerciseRow"

const sampleExercise = {
  id: "ex-1",
  exercise_id: "back-squat",
  name: "Back squat",
  muscle_groups: ["quads"],
  order_index: 0,
  sets: [
    { id: "s-1", set_number: 1, reps: 5, weight_kg: 80 },
    { id: "s-2", set_number: 2, reps: 5, weight_kg: 80 },
  ],
}

describe("WorkoutExerciseRow", () => {
  it("renders exercise name and set count", () => {
    render(
      <WorkoutExerciseRow
        ex={sampleExercise}
        log={[
          { reps: 5, weightKg: 80, done: false },
          { reps: 5, weightKg: 80, done: false },
        ]}
        onCheck={() => {}}
      />
    )
    expect(screen.getByText("Back squat")).toBeInTheDocument()
    expect(screen.getByText(/2 × 5/)).toBeInTheDocument()
  })

  it("calls onCheck with set index, reps, weight when ✓ pressed", () => {
    const onCheck = vi.fn()
    render(
      <WorkoutExerciseRow
        ex={sampleExercise}
        log={[
          { reps: 5, weightKg: 80, done: false },
          { reps: 5, weightKg: 80, done: false },
        ]}
        onCheck={onCheck}
      />
    )
    const checks = screen.getAllByRole("button", { name: /Fullfør sett/i })
    fireEvent.click(checks[0])
    expect(onCheck).toHaveBeenCalledWith(0, 5, 80)
  })

  it("disables inputs for done sets", () => {
    render(
      <WorkoutExerciseRow
        ex={sampleExercise}
        log={[
          { reps: 5, weightKg: 80, done: true },
          { reps: 5, weightKg: 80, done: false },
        ]}
        onCheck={() => {}}
      />
    )
    const repsInputs = screen.getAllByLabelText(/Reps sett/i)
    expect(repsInputs[0]).toBeDisabled()
    expect(repsInputs[1]).not.toBeDisabled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && npm run test -- WorkoutExerciseRow.test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement WorkoutExerciseRow**

Create `web/src/components/program/workout/WorkoutExerciseRow.tsx`:

```tsx
"use client"
import { useState, useEffect } from "react"
import type { ProgramExercise } from "@/lib/api"

export interface SetLog {
  reps: number
  weightKg: number | null
  done: boolean
}

interface Props {
  ex: ProgramExercise
  log: SetLog[]
  onCheck: (setIndex: number, reps: number, weightKg: number | null) => void
}

export default function WorkoutExerciseRow({ ex, log, onCheck }: Props) {
  const [local, setLocal] = useState(log)

  // Keep local state synced when parent re-renders with new log
  useEffect(() => { setLocal(log) }, [log])

  const target = ex.sets[0]
  const targetReps = target?.reps ?? "–"
  const targetWeight = target?.weight_kg != null ? `${target.weight_kg} kg` : "BW"

  return (
    <div
      style={{
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 10,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--brand-ink)" }}>{ex.name}</div>
      <div style={{ fontSize: 11, color: "var(--brand-muted)", marginBottom: 8 }}>
        {ex.sets.length} × {targetReps} · {targetWeight}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "20px 1fr 1fr 32px",
          gap: 6,
          marginBottom: 4,
          fontSize: 9,
          color: "var(--brand-faint)",
          fontWeight: 600,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}
      >
        <span>#</span>
        <span>Reps</span>
        <span>Kg</span>
        <span />
      </div>

      {local.map((s, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "20px 1fr 1fr 32px",
            gap: 6,
            padding: "5px 0",
            background: s.done ? "var(--brand-subtle)" : "transparent",
            borderRadius: 6,
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--brand-faint)", fontWeight: 600 }}>{i + 1}</span>
          <input
            type="number"
            inputMode="numeric"
            aria-label={`Reps sett ${i + 1}`}
            value={s.reps}
            disabled={s.done}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10)
              if (isNaN(n)) return
              setLocal((prev) => prev.map((p, idx) => (idx === i ? { ...p, reps: n } : p)))
            }}
            style={inputStyle(s.done)}
          />
          <input
            type="number"
            inputMode="decimal"
            aria-label={`Kg sett ${i + 1}`}
            value={s.weightKg ?? ""}
            placeholder="BW"
            disabled={s.done}
            onChange={(e) => {
              const n = parseFloat(e.target.value)
              const kg = isNaN(n) ? null : n
              setLocal((prev) => prev.map((p, idx) => (idx === i ? { ...p, weightKg: kg } : p)))
            }}
            style={inputStyle(s.done)}
          />
          <button
            type="button"
            aria-label={`Fullfør sett ${i + 1}`}
            disabled={s.done}
            onClick={() => onCheck(i, local[i].reps, local[i].weightKg)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              border: s.done ? "none" : "1px solid var(--brand-border)",
              background: s.done ? "var(--brand-orange)" : "var(--brand-surface)",
              color: s.done ? "#fff" : "var(--brand-muted)",
              cursor: s.done ? "default" : "pointer",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
            }}
          >
            ✓
          </button>
        </div>
      ))}
    </div>
  )
}

function inputStyle(done: boolean): React.CSSProperties {
  return {
    background: done ? "transparent" : "var(--brand-canvas)",
    border: done ? "none" : "1px solid var(--brand-border)",
    borderRadius: 8,
    padding: "5px 8px",
    color: done ? "var(--brand-muted)" : "var(--brand-ink)",
    fontSize: 13,
    fontWeight: 600,
    width: "100%",
    boxSizing: "border-box",
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web && npm run test -- WorkoutExerciseRow.test`
Expected: All 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/program/workout/WorkoutExerciseRow.tsx web/src/components/program/workout/WorkoutExerciseRow.test.tsx
git commit -m "feat(web): add WorkoutExerciseRow with inline set logging"
```

---

### Task 18: Move RestTimer and ShareSheet into workout/ folder

**Files:**
- Create: `web/src/components/program/workout/RestTimer.tsx` (copy from existing)
- Create: `web/src/components/program/workout/ShareSheet.tsx`

- [ ] **Step 1: Copy RestTimer into new location**

Read existing `web/src/components/program/RestTimer.tsx`, then create
`web/src/components/program/workout/RestTimer.tsx` with the same code. Update its
styling to use brand-vars only if it currently uses `--ai-accent`/`--bg-2`. If it
already uses brand-vars via legacy aliases, leave the code intact.

```bash
cp web/src/components/program/RestTimer.tsx web/src/components/program/workout/RestTimer.tsx
```

Then open the copy and replace any `var(--ai-accent)` → `var(--brand-orange)`,
`var(--bg-2)` → `var(--brand-surface)`, `var(--bg-3)` → `var(--brand-subtle)`,
`var(--border-1)` → `var(--brand-border)`, `var(--fg-0)` → `var(--brand-ink)`,
`var(--fg-2)` → `var(--brand-muted)`, `var(--fg-3)` → `var(--brand-faint)`.

(Leave the old file in place — it'll be deleted in Task 20.)

- [ ] **Step 2: Implement ShareSheet**

Create `web/src/components/program/workout/ShareSheet.tsx`. This is a slimmer
version of the existing share modal in `ProgramScreen.tsx`. The preview content
is built from the workout snapshot passed in.

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { shareWorkout, type ProgramExercise } from "@/lib/api"
import type { SetLog } from "./WorkoutExerciseRow"

interface Props {
  workoutId: string
  exercises: ProgramExercise[]
  setLog: Record<string, SetLog[]>
  onClose: () => void
}

export default function ShareSheet({ workoutId, exercises, setLog, onClose }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalVolume = exercises.reduce((sum, ex) => {
    const log = setLog[ex.id] ?? []
    return sum + log.reduce((s, set) => s + (set.done ? set.reps * (set.weightKg ?? 0) : 0), 0)
  }, 0)
  const totalSets = exercises.reduce((sum, ex) => {
    const log = setLog[ex.id] ?? []
    return sum + log.filter((s) => s.done).length
  }, 0)
  const muscleGroups = Array.from(new Set(exercises.flatMap((ex) => ex.muscle_groups))).slice(0, 3)

  const handleShare = async () => {
    setBusy(true)
    setError(null)
    try {
      await shareWorkout(workoutId)
      router.push("/program")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deling feilet")
    } finally {
      setBusy(false)
    }
  }

  const handleSkip = () => router.push("/program")

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "20px 20px 28px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            color: "var(--brand-muted)",
            marginBottom: 14,
          }}
        >
          Økt fullført 🎉
        </div>

        <div
          style={{
            background: "var(--brand-surface)",
            border: "1px solid var(--brand-border)",
            borderRadius: 14,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--brand-ink)", marginBottom: 6 }}>
            {muscleGroups.length > 0 ? muscleGroups.join(" · ") : "Økt"}
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--brand-muted)" }}>
            <span>{Math.round(totalVolume).toLocaleString("nb-NO")} kg</span>
            <span>{totalSets} sett</span>
          </div>
        </div>

        {error && (
          <div style={{ color: "var(--danger)", fontSize: 12, textAlign: "center", marginBottom: 10 }}>
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleShare}
          disabled={busy}
          style={{
            width: "100%",
            background: "var(--brand-orange)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            fontWeight: 700,
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.7 : 1,
            marginBottom: 8,
          }}
        >
          {busy ? "Deler…" : "Del nå"}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px solid var(--brand-border)",
            color: "var(--brand-muted)",
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Ikke nå
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run typecheck**

Run: `cd web && npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/program/workout/RestTimer.tsx web/src/components/program/workout/ShareSheet.tsx
git commit -m "feat(web): add RestTimer (rebranded) and ShareSheet to workout/"
```

---

### Task 19: WorkoutRun orchestrator + workout/[workoutId]/page.tsx

**Files:**
- Create: `web/src/components/program/workout/WorkoutRun.tsx`
- Create: `web/src/app/(tabs)/program/workout/[workoutId]/page.tsx`
- Modify: `api/app/routers/workouts.py` — add endpoint to fetch a single workout with its program day exercises (only if not already implemented)

- [ ] **Step 1: Check if single-workout endpoint exists**

Run: `grep -n "workouts/{workout_id}" api/app/routers/workouts.py`
If there's a `GET /api/workouts/{workout_id}` endpoint, skip Step 2. If not, do Step 2.

- [ ] **Step 2: Add GET /api/workouts/{workout_id} endpoint (only if missing)**

Append to `api/app/routers/workouts.py`:

```python
@router.get("/workouts/{workout_id}")
async def get_workout(workout_id: uuid.UUID, request: Request) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT w.id, w.started_at, w.completed_at, w.program_day_id
                FROM workouts w
                WHERE w.id = %s AND w.user_id = %s
                """,
                (workout_id, user_id),
            )
            row = await cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Workout not found")

            cur = await conn.execute(
                "SELECT exercise_id, set_number, reps, weight_kg::float, rpe "
                "FROM workout_sets WHERE workout_id = %s ORDER BY exercise_id, set_number",
                (workout_id,),
            )
            set_rows = await cur.fetchall()

            day_id = row[3]
            day_name = None
            exercises: list[dict] = []
            if day_id:
                cur = await conn.execute(
                    "SELECT name FROM program_days WHERE id = %s", (day_id,),
                )
                day_row = await cur.fetchone()
                day_name = day_row[0] if day_row else None

                cur = await conn.execute(
                    """
                    SELECT pe.id, pe.exercise_id, e.name, e.muscle_groups, pe.order_index,
                           COALESCE(
                               (SELECT json_agg(
                                   json_build_object(
                                       'id', pes.id::text,
                                       'set_number', pes.set_number,
                                       'reps', pes.reps,
                                       'weight_kg', pes.weight_kg::float
                                   ) ORDER BY pes.set_number
                               )
                               FROM program_exercise_sets pes
                               WHERE pes.program_exercise_id = pe.id),
                               '[]'::json
                           )
                    FROM program_exercises pe
                    JOIN exercises e ON e.id = pe.exercise_id
                    WHERE pe.program_day_id = %s
                    ORDER BY pe.order_index
                    """,
                    (day_id,),
                )
                ex_rows = await cur.fetchall()
                exercises = [
                    {
                        "id": str(r[0]),
                        "exercise_id": r[1],
                        "name": r[2],
                        "muscle_groups": r[3],
                        "order_index": r[4],
                        "sets": r[5],
                    }
                    for r in ex_rows
                ]
    except HTTPException:
        raise
    except Exception as e:
        print(f"[get_workout] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {
        "workout_id": str(row[0]),
        "started_at": row[1].isoformat() if row[1] else None,
        "completed_at": row[2].isoformat() if row[2] else None,
        "day_name": day_name,
        "exercises": exercises,
        "logged_sets": [
            {"exercise_id": s[0], "set_number": s[1], "reps": s[2], "weight_kg": s[3], "rpe": s[4]}
            for s in set_rows
        ],
    }
```

Add a client function in `web/src/lib/api.ts`:

```ts
export type WorkoutDetail = {
  workout_id: string
  started_at: string | null
  completed_at: string | null
  day_name: string | null
  exercises: ProgramExercise[]
  logged_sets: { exercise_id: string; set_number: number; reps: number; weight_kg: number | null; rpe: number | null }[]
}

export async function getWorkout(id: string): Promise<WorkoutDetail> {
  const res = await fetch(`${API_BASE}/api/workouts/${id}`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<WorkoutDetail>
}
```

Also: the existing `start_workout` endpoint doesn't store `program_day_id` on
the workout row. Update it. Find this block in `api/app/routers/workouts.py`:

```python
            cur = await conn.execute(
                "INSERT INTO workouts (id, user_id) VALUES (%s, %s) RETURNING id, started_at",
                (workout_id, user_id),
            )
```

Replace with:

```python
            cur = await conn.execute(
                "INSERT INTO workouts (id, user_id, program_day_id) VALUES (%s, %s, %s) "
                "RETURNING id, started_at",
                (workout_id, user_id, body.program_day_id),
            )
```

The `program_day_id` column needs to exist. Check via SQL Editor:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name='workouts' AND column_name='program_day_id';
```
If missing, add via Supabase SQL Editor:
```sql
ALTER TABLE workouts ADD COLUMN program_day_id UUID REFERENCES program_days(id) ON DELETE SET NULL;
```
…and create `api/db/migrations/012_workouts_program_day.sql` with the same statement so it stays in source control.

- [ ] **Step 3: Implement WorkoutRun client component**

Create `web/src/components/program/workout/WorkoutRun.tsx`:

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { logSet, completeWorkout, type ProgramExercise, type WorkoutDetail } from "@/lib/api"
import WorkoutHeader from "./WorkoutHeader"
import CloseConfirmSheet from "./CloseConfirmSheet"
import WorkoutExerciseRow, { type SetLog } from "./WorkoutExerciseRow"
import RestTimer from "./RestTimer"
import ShareSheet from "./ShareSheet"

interface Props {
  workout: WorkoutDetail
}

function buildInitialLog(
  exercises: ProgramExercise[],
  logged: WorkoutDetail["logged_sets"]
): Record<string, SetLog[]> {
  const out: Record<string, SetLog[]> = {}
  for (const ex of exercises) {
    out[ex.id] = ex.sets.map((s) => {
      const matched = logged.find(
        (l) => l.exercise_id === ex.exercise_id && l.set_number === s.set_number
      )
      return matched
        ? { reps: matched.reps, weightKg: matched.weight_kg, done: true }
        : { reps: s.reps, weightKg: s.weight_kg, done: false }
    })
  }
  return out
}

export default function WorkoutRun({ workout }: Props) {
  const router = useRouter()
  const [setLog, setSetLog] = useState<Record<string, SetLog[]>>(
    buildInitialLog(workout.exercises, workout.logged_sets)
  )
  const [closeOpen, setCloseOpen] = useState(false)
  const [restOpen, setRestOpen] = useState(false)
  const [restSeconds] = useState(() => {
    if (typeof window === "undefined") return 90
    return parseInt(localStorage.getItem("restTimerSeconds") ?? "90", 10)
  })
  const [completing, setCompleting] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const allDone = workout.exercises.every((ex) =>
    (setLog[ex.id] ?? []).every((s) => s.done)
  )

  const handleCheck = async (ex: ProgramExercise, setIndex: number, reps: number, weightKg: number | null) => {
    // optimistic
    setSetLog((prev) => ({
      ...prev,
      [ex.id]: prev[ex.id].map((s, i) => (i === setIndex ? { ...s, reps, weightKg, done: true } : s)),
    }))
    setRestOpen(true)
    try {
      await logSet(workout.workout_id, {
        exercise_id: ex.exercise_id,
        set_number: setIndex + 1,
        reps,
        weight_kg: weightKg,
      })
    } catch {
      // one retry, swallow errors — UI stays optimistic
      try {
        await logSet(workout.workout_id, {
          exercise_id: ex.exercise_id,
          set_number: setIndex + 1,
          reps,
          weight_kg: weightKg,
        })
      } catch { /* silent — set stays optimistically logged */ }
    }
  }

  const handleComplete = async () => {
    if (completing) return
    setCompleting(true)
    try {
      await completeWorkout(workout.workout_id)
      setShareOpen(true)
    } catch {
      setCompleting(false)
    }
  }

  return (
    <div style={{ background: "var(--brand-canvas)", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <WorkoutHeader
        startedAt={workout.started_at}
        dayName={workout.day_name ?? "Økt"}
        onClose={() => setCloseOpen(true)}
      />

      <div style={{ flex: 1, padding: "0 20px 100px", overflowY: "auto" }}>
        {workout.exercises.map((ex) => (
          <WorkoutExerciseRow
            key={ex.id}
            ex={ex}
            log={setLog[ex.id] ?? []}
            onCheck={(i, reps, kg) => handleCheck(ex, i, reps, kg)}
          />
        ))}
      </div>

      {allDone && !shareOpen && (
        <div style={{ padding: "12px 20px 20px", borderTop: "1px solid var(--brand-border)", background: "var(--brand-canvas)" }}>
          <button
            type="button"
            onClick={handleComplete}
            disabled={completing}
            style={{
              width: "100%",
              background: "var(--brand-orange)",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              padding: 14,
              fontSize: 15,
              fontWeight: 700,
              cursor: completing ? "default" : "pointer",
              opacity: completing ? 0.7 : 1,
            }}
          >
            {completing ? "Fullfører…" : "Fullfør økt ✓"}
          </button>
        </div>
      )}

      {restOpen && (
        <RestTimer
          seconds={restSeconds}
          onDone={() => setRestOpen(false)}
          onChangeDefault={(s) => localStorage.setItem("restTimerSeconds", String(s))}
        />
      )}

      <CloseConfirmSheet
        open={closeOpen}
        workoutId={workout.workout_id}
        onCancel={() => setCloseOpen(false)}
      />

      {shareOpen && (
        <ShareSheet
          workoutId={workout.workout_id}
          exercises={workout.exercises}
          setLog={setLog}
          onClose={() => router.push("/program")}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create server page**

Create `web/src/app/(tabs)/program/workout/[workoutId]/page.tsx`:

```tsx
import { redirect, notFound } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import WorkoutRun from "@/components/program/workout/WorkoutRun"
import type { WorkoutDetail } from "@/lib/api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface PageProps {
  params: Promise<{ workoutId: string }>
}

export default async function WorkoutRunPage({ params }: PageProps) {
  const { workoutId } = await params

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const res = await fetch(`${API_BASE}/api/workouts/${workoutId}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  })
  if (res.status === 404) notFound()
  if (!res.ok) throw new Error(`Failed to load workout: ${res.status}`)

  const workout = (await res.json()) as WorkoutDetail
  return <WorkoutRun workout={workout} />
}
```

- [ ] **Step 5: Run typecheck + tests**

Run: `cd web && npm run typecheck && npm run test -- WorkoutExerciseRow.test`
Expected: PASS.

- [ ] **Step 6: Smoke-test**

Open `localhost:3000/program`, start a workout from the banner. WorkoutRun loads,
sets can be logged (orange highlight + checkmark), all-done shows Fullfør CTA,
× shows close-confirm.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/program/workout/WorkoutRun.tsx web/src/app/\(tabs\)/program/workout/\[workoutId\]/page.tsx web/src/lib/api.ts api/app/routers/workouts.py
[ -f api/db/migrations/012_workouts_program_day.sql ] && git add api/db/migrations/012_workouts_program_day.sql
git commit -m "feat: add workout run route with set logging, complete, share sheet"
```

---

## Phase 6: Cleanup

### Task 20: Delete legacy files

**Files:**
- Delete: `web/src/components/program/ProgramScreen.tsx`
- Delete: `web/src/components/program/ProgramList.tsx`
- Delete: `web/src/components/program/ProgramDetail.tsx`
- Delete: `web/src/components/program/RestTimer.tsx`
- Possibly delete: `web/src/components/program/ExerciseDetail.tsx`, `web/src/components/program/ExerciseLibrary.tsx`

- [ ] **Step 1: Confirm no imports remain**

Run:
```bash
grep -rn "from.*components/program/ProgramScreen\|from.*components/program/ProgramList\|from.*components/program/ProgramDetail\|from.*components/program/RestTimer\|from.*components/program/ExerciseDetail\|from.*components/program/ExerciseLibrary" web/src
```
Expected: no matches (or only self-references inside the files being deleted).

If any import from `web/src/app/exercises/` or `web/src/app/(tabs)/exercises/` references `web/src/components/program/ExerciseDetail.tsx` or `ExerciseLibrary.tsx`, leave those two files in place for now and note as follow-up. The exercises route is separate from program redesign.

- [ ] **Step 2: Delete files**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
rm web/src/components/program/ProgramScreen.tsx
rm web/src/components/program/ProgramList.tsx
rm web/src/components/program/ProgramDetail.tsx
rm web/src/components/program/RestTimer.tsx
# Only if confirmed unused (see Step 1):
# rm web/src/components/program/ExerciseDetail.tsx
# rm web/src/components/program/ExerciseLibrary.tsx
```

- [ ] **Step 3: Run full check**

Run: `make check`
Expected: lint + typecheck + tests + build all PASS.

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "chore(web): remove legacy ProgramScreen monolith and dead files"
```

---

## Self-Review

Etter at planen er skrevet, sjekker jeg mot speccen.

**1. Spec coverage:**
- ✅ Full re-arkitektur (3 ruter) — Task 12, 15, 19
- ✅ Mappestøtte — Task 1, 2, 6, 10, 14
- ✅ Brukerstyrte mapper — Task 2, 10, 14
- ✅ TodaysWorkoutBanner 5 states — Task 7
- ✅ 2-kol grid for både mapper og programmer — Task 8, 12
- ✅ Liste-visning workout — Task 17, 19
- ✅ Aktiv-program-pille — Task 8
- ✅ Coach + templates + manuelt-valg i NewProgramSheet — Task 9
- ✅ PATCH program (active/folder/name) — Task 3
- ✅ DELETE workout (discard) — Task 5, 16
- ✅ GET workouts/in-progress — Task 4
- ✅ Folders CRUD — Task 2
- ✅ Cleanup legacy filer — Task 20
- ✅ Forkast-økt-flyt — Task 16

**2. Placeholder scan:** Søkte etter «TBD/TODO/fill in». Ingen i planen — kun i kommentarer som er forklaringer, ikke handlinger.

**3. Type consistency:** `BannerState`, `DaySummary`, `SetLog`, `WorkoutDetail`, `InProgressWorkout`, `ProgramFolder` defineres alle og brukes konsistent på tvers av oppgaver.

**4. Ambiguity check:** `program_day_id` på workout-row var en gap — Task 19 håndterer ved å legge til kolonnen i migration 012 og oppdatere `start_workout` til å lagre den. Konsistens-fix.

Ingen åpne gaps — planen er klar for utførelse.
