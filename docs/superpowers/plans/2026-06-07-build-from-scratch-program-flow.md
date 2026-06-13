# Build-from-Scratch Program Creation Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Manuell wizard-flyt for å bygge et treningsprogram fra scratch — Dropset-inspirert 4-stegs wizard fra "Bygg fra scratch"-tap til ferdig program-editor.

**Architecture:** Frontend wizard på `/program/new` med 4 steg (programnavn → workout-template → workout-navn → schedule). POSTer til ny `/api/programs`-endepunkt med optional `first_day`. Lander på eksisterende `ProgramDetail` som oppgraderes med edit-in-place affordances (rename, "+ Legg til øvelse", tap-for-rediger, "+ LEGG TIL DAG"). Skjema utvides med `weekdays INTEGER[]`, `frequency_per_week INTEGER`, og `notes TEXT`.

**Tech Stack:** Next.js 16 App Router · TypeScript · Vitest · FastAPI · psycopg-async · pytest · Postgres (Supabase) · Pydantic v2

**Spec:** [`docs/superpowers/specs/2026-06-07-build-from-scratch-program-flow-design.md`](../specs/2026-06-07-build-from-scratch-program-flow-design.md)

---

## Task Overview

**Backend (6 tasks):**
1. Migration 014 — schedule + notes columns
2. POST `/api/programs` med optional first_day
3. POST `/api/programs/{id}/days`
4. PATCH `/api/programs/{id}/days/{day_id}`
5. DELETE `/api/programs/{id}/days/{day_id}`
6. PATCH `/api/programs/{id}/days/{day_id}/exercises/{exercise_id}` (sets sync + notes)

**Frontend API layer (1 task):**
7. `web/src/lib/api.ts` — nye klient-funksjoner og typer

**Frontend wizard (6 tasks):**
8. WizardLayout shell
9. ProgramNameStep
10. WorkoutTemplateStep
11. WorkoutNameStep
12. WorkoutScheduleStep
13. Wizard host route `/program/new` + integrasjon

**Frontend edit-in-place (8 tasks):**
14. Update `NewProgramSheet` — naviger til wizard
15. EditExerciseSheet
16. RenameDaySheet + DayActionsSheet + ExerciseActionsSheet
16b. EditScheduleSheet — endre ukedager på eksisterende dag
17. AddDaySheet (gjenbruker wizard-steg)
18. Update `DayCard` — weekday-label, dots, inline edit
19. Update `ProgramDetail` — header rename, "+ LEGG TIL DAG", AKTIVER
20. Update `getProgram`-shape så frontend mottar `weekdays`/`frequency_per_week`/`notes`

**Verification (1 task):**
21. Manuell e2e i preview

---

## Task 1: Migration 014 — schedule + notes columns

**Files:**
- Create: `api/db/migrations/014_program_day_schedule_and_notes.sql`
- Test: `api/tests/test_migration_014.py`

- [ ] **Step 1: Write the failing migration test**

```python
# api/tests/test_migration_014.py
"""Smoke test for migration 014 SQL content."""
from pathlib import Path

MIGRATION = Path(__file__).parent.parent / "db" / "migrations" / "014_program_day_schedule_and_notes.sql"


def test_migration_014_exists():
    assert MIGRATION.exists()


def test_migration_014_adds_weekdays_column():
    sql = MIGRATION.read_text()
    assert "ALTER TABLE program_days" in sql
    assert "weekdays INTEGER[]" in sql


def test_migration_014_adds_frequency_column():
    sql = MIGRATION.read_text()
    assert "frequency_per_week INTEGER" in sql


def test_migration_014_adds_notes_column():
    sql = MIGRATION.read_text()
    assert "ALTER TABLE program_exercises" in sql
    assert "notes TEXT" in sql


def test_migration_014_is_idempotent():
    sql = MIGRATION.read_text()
    # IF NOT EXISTS clauses make it safe to re-run
    assert sql.count("ADD COLUMN IF NOT EXISTS") >= 3
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && .venv/bin/pytest tests/test_migration_014.py -v`
Expected: FAIL with `FileNotFoundError` or `AssertionError`.

- [ ] **Step 3: Write the migration**

```sql
-- api/db/migrations/014_program_day_schedule_and_notes.sql
--
-- Adds schedule fields to program_days (for build-from-scratch wizard) and
-- a notes column on program_exercises (per-exercise notes in programs).
--
-- weekdays: array of Postgres DOW integers (0=Sunday, 6=Saturday).
-- frequency_per_week: alternative — pick a count instead of specific days.
-- The two are mutually exclusive in the application layer; we do not enforce
-- with a CHECK constraint to keep migrations forward-compatible.

ALTER TABLE program_days
  ADD COLUMN IF NOT EXISTS weekdays INTEGER[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS frequency_per_week INTEGER;

ALTER TABLE program_exercises
  ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN program_days.weekdays IS
  'Array of weekday integers (0=Sunday, 6=Saturday). Empty = no specific days.';
COMMENT ON COLUMN program_days.frequency_per_week IS
  'Alternative to weekdays: just count per week. Null when weekdays is used.';
COMMENT ON COLUMN program_exercises.notes IS
  'Optional per-exercise note in a program (e.g. tempo cues, form notes).';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && .venv/bin/pytest tests/test_migration_014.py -v`
Expected: PASS (5/5 tests).

- [ ] **Step 5: Commit**

```bash
git add api/db/migrations/014_program_day_schedule_and_notes.sql api/tests/test_migration_014.py
git commit -m "feat(db): migration 014 — program_days schedule + program_exercises notes"
```

- [ ] **Step 6: Apply migration in Supabase**

Open Supabase SQL Editor → paste contents of `014_program_day_schedule_and_notes.sql` → Run.
Expected: "Success. No rows returned."

---

## Task 2: POST `/api/programs` with optional first_day

**Files:**
- Modify: `api/app/routers/programs.py` (add `CreateProgramBody`, `FirstDayBody`, `create_program` endpoint)
- Test: `api/tests/test_create_program_router.py` (NEW)

- [ ] **Step 1: Write the failing test**

```python
# api/tests/test_create_program_router.py
import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_create_program_minimal(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000010")
    cur_insert = AsyncMock()
    cur_insert.fetchone = AsyncMock(return_value=(prog_id, "My Program", False, None))

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_insert)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post("/api/programs", json={"name": "My Program"})

    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "My Program"
    assert data["is_active"] is False
    assert data["days"] == []


@pytest.mark.asyncio
async def test_create_program_with_first_day_weekdays(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000011")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000020")

    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=(prog_id, "PPL", False, None))
    cur_day = AsyncMock()
    cur_day.fetchone = AsyncMock(return_value=(day_id, "Push", [1, 3, 5], None, 1))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_day])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post("/api/programs", json={
                "name": "PPL",
                "first_day": {"name": "Push", "weekdays": [1, 3, 5]},
            })

    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "PPL"
    assert len(data["days"]) == 1
    assert data["days"][0]["name"] == "Push"
    assert data["days"][0]["weekdays"] == [1, 3, 5]
    assert data["days"][0]["frequency_per_week"] is None


@pytest.mark.asyncio
async def test_create_program_with_first_day_frequency(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000012")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000021")

    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=(prog_id, "FB", False, None))
    cur_day = AsyncMock()
    cur_day.fetchone = AsyncMock(return_value=(day_id, "Full body", [], 3, 1))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_day])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post("/api/programs", json={
                "name": "FB",
                "first_day": {"name": "Full body", "frequency_per_week": 3},
            })

    assert res.status_code == 201
    data = res.json()
    assert data["days"][0]["weekdays"] == []
    assert data["days"][0]["frequency_per_week"] == 3


@pytest.mark.asyncio
async def test_create_program_rejects_first_day_without_schedule():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/programs", json={
            "name": "Bad",
            "first_day": {"name": "X"},  # no weekdays, no frequency
        })
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_create_program_rejects_first_day_with_both_schedules():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/programs", json={
            "name": "Bad",
            "first_day": {"name": "X", "weekdays": [1], "frequency_per_week": 3},
        })
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_create_program_rejects_invalid_weekday():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/programs", json={
            "name": "Bad",
            "first_day": {"name": "X", "weekdays": [7]},  # 7 is out of range
        })
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_create_program_rejects_empty_name():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/programs", json={"name": ""})
    assert res.status_code == 422
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && .venv/bin/pytest tests/test_create_program_router.py -v`
Expected: All tests FAIL — `POST /api/programs` does not exist (404 or similar).

- [ ] **Step 3: Add Pydantic models and endpoint to `programs.py`**

Add these imports at the top of `api/app/routers/programs.py` if not already present:

```python
from pydantic import BaseModel, Field, model_validator
```

Add these Pydantic models near the top (before `router = APIRouter()`):

```python
class FirstDayBody(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    weekdays: list[int] = Field(default_factory=list)
    frequency_per_week: int | None = Field(default=None, ge=1, le=7)

    @model_validator(mode="after")
    def _xor_schedule(self):
        has_days = len(self.weekdays) > 0
        has_freq = self.frequency_per_week is not None
        if has_days == has_freq:
            raise ValueError("Provide either weekdays or frequency_per_week, not both")
        if has_days and any(d < 0 or d > 6 for d in self.weekdays):
            raise ValueError("weekdays must be integers 0..6")
        return self


class CreateProgramBody(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    first_day: FirstDayBody | None = None
```

Add the endpoint (insert before `@router.post("/programs/from-workout", ...)` near line 621):

```python
@router.post("/programs", status_code=201)
async def create_program(request: Request, body: CreateProgramBody) -> dict:
    """Create a new (empty or one-day) program. Does NOT auto-activate."""
    user_id = get_current_user_id(request)
    program_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "INSERT INTO programs (id, user_id, name, is_active) "
                "VALUES (%s, %s, %s, false) "
                "RETURNING id, name, is_active, folder_id",
                (program_id, user_id, body.name.strip()),
            )
            prog_row = await cur.fetchone()

            day_payload: dict | None = None
            if body.first_day is not None:
                day_id = str(uuid.uuid4())
                cur_day = await conn.execute(
                    "INSERT INTO program_days "
                    "(id, program_id, day_number, name, weekdays, frequency_per_week) "
                    "VALUES (%s, %s, 1, %s, %s, %s) "
                    "RETURNING id, name, weekdays, frequency_per_week, day_number",
                    (
                        day_id, program_id, body.first_day.name.strip(),
                        body.first_day.weekdays, body.first_day.frequency_per_week,
                    ),
                )
                day_row = await cur_day.fetchone()
                day_payload = {
                    "id": str(day_row[0]),
                    "name": day_row[1],
                    "weekdays": list(day_row[2] or []),
                    "frequency_per_week": day_row[3],
                    "day_number": day_row[4],
                    "exercises": [],
                }

            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[create_program] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {
        "id": str(prog_row[0]),
        "name": prog_row[1],
        "is_active": prog_row[2],
        "folder_id": str(prog_row[3]) if prog_row[3] else None,
        "days": [day_payload] if day_payload else [],
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && .venv/bin/pytest tests/test_create_program_router.py -v`
Expected: PASS (7/7 tests).

- [ ] **Step 5: Commit**

```bash
git add api/app/routers/programs.py api/tests/test_create_program_router.py
git commit -m "feat(api): POST /api/programs with optional first_day"
```

---

## Task 3: POST `/api/programs/{id}/days` — add day to existing program

**Files:**
- Modify: `api/app/routers/programs.py` (add `AddDayBody`, `add_day` endpoint)
- Test: `api/tests/test_add_day_router.py` (NEW)

- [ ] **Step 1: Write the failing test**

```python
# api/tests/test_add_day_router.py
import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_add_day_with_weekdays(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000020")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000030")

    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=(prog_id,))
    cur_count = AsyncMock()
    cur_count.fetchone = AsyncMock(return_value=(2,))  # current max day_number
    cur_insert = AsyncMock()
    cur_insert.fetchone = AsyncMock(return_value=(day_id, "Pull", [2, 4], None, 3))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_count, cur_insert])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post(
                f"/api/programs/{prog_id}/days",
                json={"name": "Pull", "weekdays": [2, 4]},
            )

    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Pull"
    assert data["weekdays"] == [2, 4]
    assert data["day_number"] == 3


@pytest.mark.asyncio
async def test_add_day_with_frequency(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000021")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000031")

    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=(prog_id,))
    cur_count = AsyncMock()
    cur_count.fetchone = AsyncMock(return_value=(0,))
    cur_insert = AsyncMock()
    cur_insert.fetchone = AsyncMock(return_value=(day_id, "Cardio", [], 2, 1))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_count, cur_insert])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post(
                f"/api/programs/{prog_id}/days",
                json={"name": "Cardio", "frequency_per_week": 2},
            )

    assert res.status_code == 201
    data = res.json()
    assert data["frequency_per_week"] == 2
    assert data["weekdays"] == []


@pytest.mark.asyncio
async def test_add_day_rejects_missing_program(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000022")
    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_prog)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post(
                f"/api/programs/{prog_id}/days",
                json={"name": "X", "weekdays": [1]},
            )

    assert res.status_code == 404
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && .venv/bin/pytest tests/test_add_day_router.py -v`
Expected: FAIL — endpoint missing.

- [ ] **Step 3: Add `AddDayBody` and endpoint**

In `api/app/routers/programs.py`, add (near `FirstDayBody`):

```python
class AddDayBody(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    weekdays: list[int] = Field(default_factory=list)
    frequency_per_week: int | None = Field(default=None, ge=1, le=7)

    @model_validator(mode="after")
    def _xor_schedule(self):
        has_days = len(self.weekdays) > 0
        has_freq = self.frequency_per_week is not None
        if has_days == has_freq:
            raise ValueError("Provide either weekdays or frequency_per_week, not both")
        if has_days and any(d < 0 or d > 6 for d in self.weekdays):
            raise ValueError("weekdays must be integers 0..6")
        return self
```

Add the endpoint (insert near other day endpoints):

```python
@router.post("/programs/{program_id}/days", status_code=201)
async def add_day(program_id: uuid.UUID, request: Request, body: AddDayBody) -> dict:
    user_id = get_current_user_id(request)
    day_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM programs WHERE id = %s AND user_id = %s",
                (program_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Program not found")

            cur = await conn.execute(
                "SELECT COALESCE(MAX(day_number), 0) FROM program_days WHERE program_id = %s",
                (program_id,),
            )
            next_day_number = (await cur.fetchone())[0] + 1

            cur = await conn.execute(
                "INSERT INTO program_days "
                "(id, program_id, day_number, name, weekdays, frequency_per_week) "
                "VALUES (%s, %s, %s, %s, %s, %s) "
                "RETURNING id, name, weekdays, frequency_per_week, day_number",
                (
                    day_id, program_id, next_day_number, body.name.strip(),
                    body.weekdays, body.frequency_per_week,
                ),
            )
            row = await cur.fetchone()
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[add_day] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {
        "id": str(row[0]),
        "name": row[1],
        "weekdays": list(row[2] or []),
        "frequency_per_week": row[3],
        "day_number": row[4],
        "exercises": [],
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && .venv/bin/pytest tests/test_add_day_router.py -v`
Expected: PASS (3/3 tests).

- [ ] **Step 5: Commit**

```bash
git add api/app/routers/programs.py api/tests/test_add_day_router.py
git commit -m "feat(api): POST /api/programs/{id}/days"
```

---

## Task 4: PATCH `/api/programs/{id}/days/{day_id}` — update day

**Files:**
- Modify: `api/app/routers/programs.py` (add `UpdateDayBody`, `update_day`)
- Test: `api/tests/test_update_day_router.py` (NEW)

- [ ] **Step 1: Write the failing test**

```python
# api/tests/test_update_day_router.py
import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_update_day_rename(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000030")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000040")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=(day_id,))
    cur_update = AsyncMock()
    cur_update.fetchone = AsyncMock(return_value=(day_id, "Push v2", [1, 3, 5], None, 1))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_owner, cur_update])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}",
                json={"name": "Push v2"},
            )

    assert res.status_code == 200
    assert res.json()["name"] == "Push v2"


@pytest.mark.asyncio
async def test_update_day_change_weekdays(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000031")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000041")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=(day_id,))
    cur_update = AsyncMock()
    cur_update.fetchone = AsyncMock(return_value=(day_id, "Push", [2, 4, 6], None, 1))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_owner, cur_update])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}",
                json={"weekdays": [2, 4, 6]},
            )

    assert res.status_code == 200
    assert res.json()["weekdays"] == [2, 4, 6]


@pytest.mark.asyncio
async def test_update_day_switch_to_frequency(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000032")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000042")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=(day_id,))
    cur_update = AsyncMock()
    cur_update.fetchone = AsyncMock(return_value=(day_id, "Cardio", [], 2, 2))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_owner, cur_update])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}",
                json={"weekdays": [], "frequency_per_week": 2},
            )

    assert res.status_code == 200
    assert res.json()["weekdays"] == []
    assert res.json()["frequency_per_week"] == 2


@pytest.mark.asyncio
async def test_update_day_rejects_missing_day(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000033")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000043")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_owner)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}",
                json={"name": "X"},
            )

    assert res.status_code == 404


@pytest.mark.asyncio
async def test_update_day_rejects_empty_body():
    from app.main import app
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000034")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000044")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.patch(
            f"/api/programs/{prog_id}/days/{day_id}",
            json={},
        )
    assert res.status_code == 400
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && .venv/bin/pytest tests/test_update_day_router.py -v`
Expected: FAIL — endpoint missing.

- [ ] **Step 3: Add `UpdateDayBody` and endpoint**

In `api/app/routers/programs.py`, add (near `AddDayBody`):

```python
class UpdateDayBody(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    weekdays: list[int] | None = None
    frequency_per_week: int | None = Field(default=None, ge=1, le=7)

    @model_validator(mode="after")
    def _validate_weekdays_range(self):
        if self.weekdays is not None and any(d < 0 or d > 6 for d in self.weekdays):
            raise ValueError("weekdays must be integers 0..6")
        return self
```

Add the endpoint:

```python
@router.patch("/programs/{program_id}/days/{day_id}")
async def update_day(
    program_id: uuid.UUID, day_id: uuid.UUID,
    request: Request, body: UpdateDayBody,
) -> dict:
    user_id = get_current_user_id(request)
    fields_set = body.model_fields_set
    if not fields_set:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT pd.id FROM program_days pd "
                "JOIN programs p ON p.id = pd.program_id "
                "WHERE pd.id = %s AND p.id = %s AND p.user_id = %s",
                (day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Day not found")

            updates: list[str] = []
            params: list = []
            if "name" in fields_set and body.name is not None:
                updates.append("name = %s")
                params.append(body.name.strip())
            if "weekdays" in fields_set:
                updates.append("weekdays = %s")
                params.append(body.weekdays or [])
            if "frequency_per_week" in fields_set:
                updates.append("frequency_per_week = %s")
                params.append(body.frequency_per_week)

            if not updates:
                raise HTTPException(status_code=400, detail="No fields to update")

            params.append(day_id)
            cur = await conn.execute(
                f"UPDATE program_days SET {', '.join(updates)} "
                "WHERE id = %s "
                "RETURNING id, name, weekdays, frequency_per_week, day_number",
                params,
            )
            row = await cur.fetchone()
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[update_day] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {
        "id": str(row[0]),
        "name": row[1],
        "weekdays": list(row[2] or []),
        "frequency_per_week": row[3],
        "day_number": row[4],
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && .venv/bin/pytest tests/test_update_day_router.py -v`
Expected: PASS (5/5 tests).

- [ ] **Step 5: Commit**

```bash
git add api/app/routers/programs.py api/tests/test_update_day_router.py
git commit -m "feat(api): PATCH /api/programs/{id}/days/{day_id}"
```

---

## Task 5: DELETE `/api/programs/{id}/days/{day_id}` — delete day

**Files:**
- Modify: `api/app/routers/programs.py` (add `delete_day`)
- Test: `api/tests/test_delete_day_router.py` (NEW)

- [ ] **Step 1: Write the failing test**

```python
# api/tests/test_delete_day_router.py
import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_delete_day_success(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000040")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000050")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=(day_id,))
    cur_del = AsyncMock()
    cur_del.fetchone = AsyncMock(return_value=(day_id,))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_owner, cur_del])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.delete(f"/api/programs/{prog_id}/days/{day_id}")

    assert res.status_code == 204


@pytest.mark.asyncio
async def test_delete_day_not_found(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000041")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000051")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_owner)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.delete(f"/api/programs/{prog_id}/days/{day_id}")

    assert res.status_code == 404
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && .venv/bin/pytest tests/test_delete_day_router.py -v`
Expected: FAIL — endpoint missing.

- [ ] **Step 3: Add the endpoint**

In `api/app/routers/programs.py`:

```python
@router.delete("/programs/{program_id}/days/{day_id}", status_code=204)
async def delete_day(
    program_id: uuid.UUID, day_id: uuid.UUID, request: Request
) -> None:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT pd.id FROM program_days pd "
                "JOIN programs p ON p.id = pd.program_id "
                "WHERE pd.id = %s AND p.id = %s AND p.user_id = %s",
                (day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Day not found")

            await conn.execute(
                "DELETE FROM program_days WHERE id = %s RETURNING id",
                (day_id,),
            )
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[delete_day] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && .venv/bin/pytest tests/test_delete_day_router.py -v`
Expected: PASS (2/2 tests).

- [ ] **Step 5: Commit**

```bash
git add api/app/routers/programs.py api/tests/test_delete_day_router.py
git commit -m "feat(api): DELETE /api/programs/{id}/days/{day_id}"
```

---

## Task 6: PATCH `/api/programs/{id}/days/{day_id}/exercises/{exercise_id}` — sets/reps/weight/notes

**Files:**
- Modify: `api/app/routers/programs.py` (add `UpdateProgramExerciseBody`, `update_program_exercise`)
- Test: `api/tests/test_update_program_exercise_router.py` (NEW)

**Note:** This endpoint adjusts `program_exercise_sets` row count when `sets` changes, updates all set rows when `reps`/`weight_kg` changes, and writes `notes` to `program_exercises`.

- [ ] **Step 1: Write the failing test**

```python
# api/tests/test_update_program_exercise_router.py
import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_update_program_exercise_notes_only(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000050")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000060")
    ex_id = uuid.UUID("cccccccc-0000-0000-0000-000000000070")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=(ex_id,))
    cur_update_notes = AsyncMock()
    cur_existing_sets = AsyncMock()
    cur_existing_sets.fetchall = AsyncMock(return_value=[(1, 10, 80.0)])

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_owner, cur_update_notes, cur_existing_sets])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}/exercises/{ex_id}",
                json={"notes": "Kontroller form"},
            )

    assert res.status_code == 200
    assert res.json()["notes"] == "Kontroller form"


@pytest.mark.asyncio
async def test_update_program_exercise_increase_sets(make_mock_get_conn):
    """Setting sets=5 when there are 3 should add 2 new set rows."""
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000051")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000061")
    ex_id = uuid.UUID("cccccccc-0000-0000-0000-000000000071")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=(ex_id,))
    cur_existing = AsyncMock()
    cur_existing.fetchall = AsyncMock(return_value=[(1, 10, 80.0), (2, 10, 80.0), (3, 10, 80.0)])

    conn = AsyncMock()
    # Order: owner check, fetch existing sets, INSERT set 4, INSERT set 5
    conn.execute = AsyncMock(side_effect=[cur_owner, cur_existing, AsyncMock(), AsyncMock()])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}/exercises/{ex_id}",
                json={"sets": 5},
            )

    assert res.status_code == 200
    # INSERT was called 2x (for sets 4 and 5)
    insert_calls = [c for c in conn.execute.await_args_list if "INSERT INTO program_exercise_sets" in str(c.args[0])]
    assert len(insert_calls) == 2


@pytest.mark.asyncio
async def test_update_program_exercise_decrease_sets(make_mock_get_conn):
    """Setting sets=2 when there are 4 should delete sets 3 and 4."""
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000052")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000062")
    ex_id = uuid.UUID("cccccccc-0000-0000-0000-000000000072")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=(ex_id,))
    cur_existing = AsyncMock()
    cur_existing.fetchall = AsyncMock(return_value=[(1, 10, 80.0), (2, 10, 80.0), (3, 10, 80.0), (4, 10, 80.0)])

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_owner, cur_existing, AsyncMock()])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}/exercises/{ex_id}",
                json={"sets": 2},
            )

    assert res.status_code == 200
    delete_calls = [c for c in conn.execute.await_args_list if "DELETE FROM program_exercise_sets" in str(c.args[0])]
    assert len(delete_calls) == 1


@pytest.mark.asyncio
async def test_update_program_exercise_update_reps_and_weight(make_mock_get_conn):
    """Changing reps or weight updates all existing set rows."""
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000053")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000063")
    ex_id = uuid.UUID("cccccccc-0000-0000-0000-000000000073")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=(ex_id,))
    cur_existing = AsyncMock()
    cur_existing.fetchall = AsyncMock(return_value=[(1, 10, 80.0), (2, 10, 80.0)])

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_owner, cur_existing, AsyncMock()])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}/exercises/{ex_id}",
                json={"reps": 12, "weight_kg": 85.0},
            )

    assert res.status_code == 200
    update_calls = [c for c in conn.execute.await_args_list if "UPDATE program_exercise_sets" in str(c.args[0])]
    assert len(update_calls) == 1


@pytest.mark.asyncio
async def test_update_program_exercise_not_found(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000054")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000064")
    ex_id = uuid.UUID("cccccccc-0000-0000-0000-000000000074")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_owner)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}/exercises/{ex_id}",
                json={"sets": 3},
            )

    assert res.status_code == 404
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && .venv/bin/pytest tests/test_update_program_exercise_router.py -v`
Expected: FAIL — endpoint missing.

- [ ] **Step 3: Add the endpoint**

In `api/app/routers/programs.py`:

```python
class UpdateProgramExerciseBody(BaseModel):
    sets: int | None = Field(default=None, ge=1, le=20)
    reps: int | None = Field(default=None, ge=1, le=99)
    weight_kg: float | None = Field(default=None, ge=0, le=999.99)
    notes: str | None = Field(default=None, max_length=500)


@router.patch("/programs/{program_id}/days/{day_id}/exercises/{exercise_id}")
async def update_program_exercise(
    program_id: uuid.UUID, day_id: uuid.UUID, exercise_id: uuid.UUID,
    request: Request, body: UpdateProgramExerciseBody,
) -> dict:
    """Atomically update sets count, reps, weight_kg, and/or notes for a program exercise.

    - sets: adjust the number of program_exercise_sets rows to match.
    - reps / weight_kg: update all existing set rows.
    - notes: update the notes column on program_exercises.
    """
    user_id = get_current_user_id(request)
    fields_set = body.model_fields_set
    if not fields_set:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT pe.id FROM program_exercises pe
                JOIN program_days pd ON pd.id = pe.program_day_id
                JOIN programs p ON p.id = pd.program_id
                WHERE pe.id = %s AND pd.id = %s AND p.id = %s AND p.user_id = %s
                """,
                (exercise_id, day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            if "notes" in fields_set:
                await conn.execute(
                    "UPDATE program_exercises SET notes = %s WHERE id = %s",
                    (body.notes, exercise_id),
                )

            # Read current sets to know how many exist and their reps/weight.
            cur = await conn.execute(
                "SELECT set_number, reps, weight_kg::float "
                "FROM program_exercise_sets WHERE program_exercise_id = %s "
                "ORDER BY set_number",
                (exercise_id,),
            )
            existing = await cur.fetchall()
            current_count = len(existing)
            template_reps = existing[0][1] if existing else 10
            template_weight = existing[0][2] if existing else None

            new_reps = body.reps if "reps" in fields_set else template_reps
            new_weight = body.weight_kg if "weight_kg" in fields_set else template_weight

            # Adjust set count if sets is specified.
            if "sets" in fields_set and body.sets is not None:
                target = body.sets
                if target > current_count:
                    for n in range(current_count + 1, target + 1):
                        await conn.execute(
                            "INSERT INTO program_exercise_sets "
                            "(id, program_exercise_id, set_number, reps, weight_kg) "
                            "VALUES (%s, %s, %s, %s, %s)",
                            (str(uuid.uuid4()), exercise_id, n, new_reps, new_weight),
                        )
                elif target < current_count:
                    await conn.execute(
                        "DELETE FROM program_exercise_sets "
                        "WHERE program_exercise_id = %s AND set_number > %s",
                        (exercise_id, target),
                    )

            # Update reps/weight across all remaining rows if specified.
            if "reps" in fields_set or "weight_kg" in fields_set:
                await conn.execute(
                    "UPDATE program_exercise_sets "
                    "SET reps = %s, weight_kg = %s "
                    "WHERE program_exercise_id = %s",
                    (new_reps, new_weight, exercise_id),
                )

            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[update_program_exercise] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {
        "id": str(exercise_id),
        "notes": body.notes if "notes" in fields_set else None,
        "sets": body.sets if "sets" in fields_set else current_count,
        "reps": new_reps,
        "weight_kg": new_weight,
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && .venv/bin/pytest tests/test_update_program_exercise_router.py -v`
Expected: PASS (5/5 tests).

- [ ] **Step 5: Commit**

```bash
git add api/app/routers/programs.py api/tests/test_update_program_exercise_router.py
git commit -m "feat(api): PATCH program exercise — sets sync + reps/weight/notes"
```

---

## Task 7: Frontend API client — types and functions

**Files:**
- Modify: `web/src/lib/api.ts`

- [ ] **Step 1: Open `web/src/lib/api.ts` and locate the existing `ProgramDay` and `Program` types (around line 76-90).**

- [ ] **Step 2: Update `ProgramDay`, `ProgramExercise`, and add wizard input type**

Replace the existing `ProgramExercise` and `ProgramDay` types in `web/src/lib/api.ts`:

```ts
export interface ProgramExercise {
  id: string
  exercise_id: string
  name: string
  muscle_groups: string[]
  order_index: number
  notes: string | null
  sets: ProgramExerciseSet[]
}

export type ProgramDay = {
  id: string
  day_number: number
  name: string
  weekdays: number[]
  frequency_per_week: number | null
  exercises: ProgramExercise[]
}

export type WorkoutTemplate =
  | "custom" | "push" | "pull" | "legs" | "full-body" | "upper-body"

export type DaySchedule =
  | { kind: "weekdays"; weekdays: number[] }
  | { kind: "frequency"; frequency_per_week: number }
```

- [ ] **Step 3: Append new API client functions at the bottom of `api.ts`**

Add at the end of `web/src/lib/api.ts`:

```ts
/* ── Build-from-scratch program creation ────────────────── */

export async function createProgram(body: {
  name: string
  first_day?: {
    name: string
    weekdays?: number[]
    frequency_per_week?: number | null
  }
}): Promise<Program> {
  const res = await fetch(`${API_BASE}/api/programs`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Program>
}

export async function addProgramDay(
  programId: string,
  body: { name: string; weekdays?: number[]; frequency_per_week?: number | null }
): Promise<ProgramDay> {
  const res = await fetch(`${API_BASE}/api/programs/${programId}/days`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramDay>
}

export async function updateProgramDay(
  programId: string,
  dayId: string,
  body: { name?: string; weekdays?: number[]; frequency_per_week?: number | null }
): Promise<ProgramDay> {
  const res = await fetch(`${API_BASE}/api/programs/${programId}/days/${dayId}`, {
    method: "PATCH",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramDay>
}

export async function deleteProgramDay(
  programId: string,
  dayId: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/programs/${programId}/days/${dayId}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function updateProgramExercise(
  programId: string,
  dayId: string,
  exerciseId: string,
  body: {
    sets?: number
    reps?: number
    weight_kg?: number | null
    notes?: string | null
  }
): Promise<{
  id: string
  sets: number
  reps: number
  weight_kg: number | null
  notes: string | null
}> {
  const res = await fetch(
    `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}`,
    {
      method: "PATCH",
      headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}
```

- [ ] **Step 4: Run typecheck**

Run: `cd web && npm run typecheck`
Expected: PASS (no type errors).

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/api.ts
git commit -m "feat(web): api client for program create/days/exercises"
```

---

## Task 8: WizardLayout — topbar + progress + footer

**Files:**
- Create: `web/src/components/program/wizard/WizardLayout.tsx`
- Create: `web/src/components/program/wizard/WizardLayout.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// web/src/components/program/wizard/WizardLayout.test.tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import WizardLayout from "./WizardLayout"

describe("WizardLayout", () => {
  it("shows progress bar with given percent", () => {
    render(
      <WizardLayout progressPercent={50} onBack={() => {}}>
        <div>child</div>
      </WizardLayout>
    )
    expect(screen.getByTestId("wizard-progress")).toHaveStyle({ width: "50%" })
  })

  it("calls onBack when back button is clicked", () => {
    const onBack = vi.fn()
    render(
      <WizardLayout progressPercent={25} onBack={onBack}>
        <div>child</div>
      </WizardLayout>
    )
    fireEvent.click(screen.getByLabelText("Tilbake"))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it("renders children", () => {
    render(
      <WizardLayout progressPercent={25} onBack={() => {}}>
        <div>my content</div>
      </WizardLayout>
    )
    expect(screen.getByText("my content")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm run test -- WizardLayout`
Expected: FAIL — file does not exist.

- [ ] **Step 3: Create `WizardLayout.tsx`**

```tsx
// web/src/components/program/wizard/WizardLayout.tsx
"use client"
import type { ReactNode } from "react"

interface Props {
  progressPercent: number
  onBack: () => void
  children: ReactNode
}

export default function WizardLayout({ progressPercent, onBack, children }: Props) {
  return (
    <div
      style={{
        background: "var(--brand-canvas)",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "14px 18px 24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <button
          type="button"
          aria-label="Tilbake"
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "var(--brand-orange)",
            fontSize: 22,
            cursor: "pointer",
            padding: 0,
            lineHeight: 1,
          }}
        >
          ←
        </button>
        <div
          style={{
            flex: 1,
            height: 3,
            background: "var(--brand-border)",
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            data-testid="wizard-progress"
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              background: "var(--brand-orange)",
              transition: "width 200ms ease",
            }}
          />
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm run test -- WizardLayout`
Expected: PASS (3/3 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/components/program/wizard/WizardLayout.tsx web/src/components/program/wizard/WizardLayout.test.tsx
git commit -m "feat(web): WizardLayout — topbar with progress + back"
```

---

## Task 9: ProgramNameStep — wizard step 1

**Files:**
- Create: `web/src/components/program/wizard/ProgramNameStep.tsx`
- Create: `web/src/components/program/wizard/ProgramNameStep.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// web/src/components/program/wizard/ProgramNameStep.test.tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import ProgramNameStep from "./ProgramNameStep"

describe("ProgramNameStep", () => {
  it("disables Fortsett when input is empty", () => {
    render(<ProgramNameStep initialName="" onNext={() => {}} />)
    expect(screen.getByRole("button", { name: /fortsett/i })).toBeDisabled()
  })

  it("enables Fortsett when input has at least one char", () => {
    render(<ProgramNameStep initialName="PPL" onNext={() => {}} />)
    expect(screen.getByRole("button", { name: /fortsett/i })).toBeEnabled()
  })

  it("calls onNext with trimmed name when Fortsett is clicked", () => {
    const onNext = vi.fn()
    render(<ProgramNameStep initialName="  PPL  " onNext={onNext} />)
    fireEvent.click(screen.getByRole("button", { name: /fortsett/i }))
    expect(onNext).toHaveBeenCalledWith("PPL")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm run test -- ProgramNameStep`
Expected: FAIL — file does not exist.

- [ ] **Step 3: Create component**

```tsx
// web/src/components/program/wizard/ProgramNameStep.tsx
"use client"
import { useState } from "react"

interface Props {
  initialName: string
  onNext: (name: string) => void
}

export default function ProgramNameStep({ initialName, onNext }: Props) {
  const [name, setName] = useState(initialName)
  const trimmed = name.trim()
  const canContinue = trimmed.length > 0

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
        Programnavn
      </h1>
      <p style={{ fontSize: 13, color: "var(--brand-muted)", marginBottom: 26 }}>
        Hva skal programmet hete?
      </p>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
        placeholder="F.eks. PPL 4-dagers"
        style={{
          fontSize: 18,
          padding: "8px 0",
          border: "none",
          borderBottom: "1px solid var(--brand-ink)",
          background: "transparent",
          outline: "none",
          width: "100%",
        }}
      />
      <p style={{ fontSize: 11, color: "var(--brand-muted)", marginTop: 8 }}>
        Du kan endre senere.
      </p>
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          disabled={!canContinue}
          onClick={() => onNext(trimmed)}
          style={{
            background: canContinue ? "var(--brand-orange)" : "var(--brand-border)",
            color: "white",
            border: "none",
            borderRadius: 99,
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 700,
            cursor: canContinue ? "pointer" : "not-allowed",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          → Fortsett
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm run test -- ProgramNameStep`
Expected: PASS (3/3 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/components/program/wizard/ProgramNameStep.tsx web/src/components/program/wizard/ProgramNameStep.test.tsx
git commit -m "feat(web): wizard step 1 — ProgramNameStep"
```

---

## Task 10: WorkoutTemplateStep — wizard step 2

**Files:**
- Create: `web/src/components/program/wizard/WorkoutTemplateStep.tsx`
- Create: `web/src/components/program/wizard/WorkoutTemplateStep.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// web/src/components/program/wizard/WorkoutTemplateStep.test.tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import WorkoutTemplateStep from "./WorkoutTemplateStep"

describe("WorkoutTemplateStep", () => {
  it("renders all templates with Custom on top", () => {
    render(<WorkoutTemplateStep onSelect={() => {}} />)
    const rows = screen.getAllByRole("button", { name: /custom|push|pull|legs|full body|upper body/i })
    expect(rows[0]).toHaveTextContent(/custom/i)
  })

  it("calls onSelect with template id when tapped", () => {
    const onSelect = vi.fn()
    render(<WorkoutTemplateStep onSelect={onSelect} />)
    fireEvent.click(screen.getByRole("button", { name: /^push$/i }))
    expect(onSelect).toHaveBeenCalledWith("push")
  })

  it("calls onSelect with 'custom' when Custom is tapped", () => {
    const onSelect = vi.fn()
    render(<WorkoutTemplateStep onSelect={onSelect} />)
    fireEvent.click(screen.getByRole("button", { name: /^custom$/i }))
    expect(onSelect).toHaveBeenCalledWith("custom")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm run test -- WorkoutTemplateStep`
Expected: FAIL — file does not exist.

- [ ] **Step 3: Create component**

```tsx
// web/src/components/program/wizard/WorkoutTemplateStep.tsx
"use client"
import type { WorkoutTemplate } from "@/lib/api"

interface Props {
  onSelect: (template: WorkoutTemplate) => void
}

const TEMPLATES: { id: WorkoutTemplate; label: string }[] = [
  { id: "custom", label: "Custom" },
  { id: "push", label: "Push" },
  { id: "pull", label: "Pull" },
  { id: "legs", label: "Legs" },
  { id: "full-body", label: "Full body" },
  { id: "upper-body", label: "Upper body" },
]

export default function WorkoutTemplateStep({ onSelect }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
        Velg første økt
      </h1>
      <p style={{ fontSize: 13, color: "var(--brand-muted)", marginBottom: 18 }}>
        Vi hjelper deg fylle på med øvelser etterpå.
      </p>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            style={{
              background: "none",
              border: "none",
              padding: "16px 0",
              textAlign: "left",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--brand-ink)",
              borderBottom: "1px solid var(--brand-border)",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm run test -- WorkoutTemplateStep`
Expected: PASS (3/3 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/components/program/wizard/WorkoutTemplateStep.tsx web/src/components/program/wizard/WorkoutTemplateStep.test.tsx
git commit -m "feat(web): wizard step 2 — WorkoutTemplateStep"
```

---

## Task 11: WorkoutNameStep — wizard step 3

**Files:**
- Create: `web/src/components/program/wizard/WorkoutNameStep.tsx`
- Create: `web/src/components/program/wizard/WorkoutNameStep.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// web/src/components/program/wizard/WorkoutNameStep.test.tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import WorkoutNameStep from "./WorkoutNameStep"

describe("WorkoutNameStep", () => {
  it("pre-fills input with initialName", () => {
    render(<WorkoutNameStep initialName="Push" onNext={() => {}} />)
    expect(screen.getByRole("textbox")).toHaveValue("Push")
  })

  it("disables Fortsett when empty", () => {
    render(<WorkoutNameStep initialName="" onNext={() => {}} />)
    expect(screen.getByRole("button", { name: /fortsett/i })).toBeDisabled()
  })

  it("calls onNext with trimmed name", () => {
    const onNext = vi.fn()
    render(<WorkoutNameStep initialName=" Push " onNext={onNext} />)
    fireEvent.click(screen.getByRole("button", { name: /fortsett/i }))
    expect(onNext).toHaveBeenCalledWith("Push")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm run test -- WorkoutNameStep`
Expected: FAIL — file does not exist.

- [ ] **Step 3: Create component**

```tsx
// web/src/components/program/wizard/WorkoutNameStep.tsx
"use client"
import { useState } from "react"

interface Props {
  initialName: string
  onNext: (name: string) => void
}

export default function WorkoutNameStep({ initialName, onNext }: Props) {
  const [name, setName] = useState(initialName)
  const trimmed = name.trim()
  const canContinue = trimmed.length > 0

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
        Navn
      </h1>
      <p style={{ fontSize: 13, color: "var(--brand-muted)", marginBottom: 32 }}>
        Tilpass navnet hvis du vil
      </p>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        placeholder="Min økt"
        style={{
          fontSize: 18,
          padding: "8px 0",
          border: "none",
          borderBottom: "1px solid var(--brand-ink)",
          background: "transparent",
          outline: "none",
          width: "100%",
        }}
      />
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          disabled={!canContinue}
          onClick={() => onNext(trimmed)}
          style={{
            background: canContinue ? "var(--brand-orange)" : "var(--brand-border)",
            color: "white",
            border: "none",
            borderRadius: 99,
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 700,
            cursor: canContinue ? "pointer" : "not-allowed",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          → Fortsett
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm run test -- WorkoutNameStep`
Expected: PASS (3/3 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/components/program/wizard/WorkoutNameStep.tsx web/src/components/program/wizard/WorkoutNameStep.test.tsx
git commit -m "feat(web): wizard step 3 — WorkoutNameStep"
```

---

## Task 12: WorkoutScheduleStep — wizard step 4 with tabs

**Files:**
- Create: `web/src/components/program/wizard/WorkoutScheduleStep.tsx`
- Create: `web/src/components/program/wizard/WorkoutScheduleStep.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// web/src/components/program/wizard/WorkoutScheduleStep.test.tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import WorkoutScheduleStep from "./WorkoutScheduleStep"

describe("WorkoutScheduleStep", () => {
  it("starts in weekdays tab with no days selected — button disabled", () => {
    render(<WorkoutScheduleStep workoutName="Push" onNext={() => {}} />)
    expect(screen.getByRole("button", { name: /fortsett/i })).toBeDisabled()
  })

  it("toggles weekdays on tap", () => {
    render(<WorkoutScheduleStep workoutName="Push" onNext={() => {}} />)
    fireEvent.click(screen.getByRole("button", { name: /^man$/i }))
    fireEvent.click(screen.getByRole("button", { name: /^ons$/i }))
    expect(screen.getByRole("button", { name: /fortsett/i })).toBeEnabled()
    expect(screen.getByText(/Push på/i)).toHaveTextContent(/Man.*Ons/)
  })

  it("calls onNext with weekdays schedule", () => {
    const onNext = vi.fn()
    render(<WorkoutScheduleStep workoutName="Push" onNext={onNext} />)
    fireEvent.click(screen.getByRole("button", { name: /^man$/i }))
    fireEvent.click(screen.getByRole("button", { name: /fortsett/i }))
    expect(onNext).toHaveBeenCalledWith({ kind: "weekdays", weekdays: [1] })
  })

  it("switches to frequency tab and selects 3x", () => {
    const onNext = vi.fn()
    render(<WorkoutScheduleStep workoutName="Push" onNext={onNext} />)
    fireEvent.click(screen.getByRole("button", { name: /hyppighet/i }))
    fireEvent.click(screen.getByRole("button", { name: "3×" }))
    fireEvent.click(screen.getByRole("button", { name: /fortsett/i }))
    expect(onNext).toHaveBeenCalledWith({ kind: "frequency", frequency_per_week: 3 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm run test -- WorkoutScheduleStep`
Expected: FAIL — file does not exist.

- [ ] **Step 3: Create component**

```tsx
// web/src/components/program/wizard/WorkoutScheduleStep.tsx
"use client"
import { useState } from "react"
import type { DaySchedule } from "@/lib/api"

interface Props {
  workoutName: string
  onNext: (schedule: DaySchedule) => void
}

const DOW_LABELS = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"]
// Order for display: Mon-first (Norwegian convention)
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const LONG = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"]

export default function WorkoutScheduleStep({ workoutName, onNext }: Props) {
  const [tab, setTab] = useState<"weekdays" | "frequency">("weekdays")
  const [days, setDays] = useState<number[]>([])
  const [freq, setFreq] = useState<number | null>(null)

  const canContinue =
    tab === "weekdays" ? days.length > 0 : freq !== null

  const handleContinue = () => {
    if (tab === "weekdays" && days.length > 0) {
      onNext({ kind: "weekdays", weekdays: [...days].sort((a, b) => a - b) })
    } else if (tab === "frequency" && freq !== null) {
      onNext({ kind: "frequency", frequency_per_week: freq })
    }
  }

  const sortedSelectedLabels = [...days]
    .sort((a, b) => a - b)
    .map((d) => DOW_LABELS[d])

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ height: 20 }} />
      <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--brand-border)", marginBottom: 18 }}>
        <button
          type="button"
          onClick={() => setTab("weekdays")}
          style={{
            background: "none",
            border: "none",
            padding: "0 0 8px",
            fontSize: 14,
            fontWeight: 700,
            color: tab === "weekdays" ? "var(--brand-ink)" : "var(--brand-muted)",
            borderBottom: tab === "weekdays" ? "2px solid var(--brand-orange)" : "none",
            cursor: "pointer",
          }}
        >
          Ukedager
        </button>
        <button
          type="button"
          onClick={() => setTab("frequency")}
          style={{
            background: "none",
            border: "none",
            padding: "0 0 8px",
            fontSize: 14,
            fontWeight: 700,
            color: tab === "frequency" ? "var(--brand-ink)" : "var(--brand-muted)",
            borderBottom: tab === "frequency" ? "2px solid var(--brand-orange)" : "none",
            cursor: "pointer",
          }}
        >
          Hyppighet
        </button>
      </div>

      {tab === "weekdays" && (
        <>
          <p style={{ fontSize: 13, color: "var(--brand-muted)", marginBottom: 16 }}>
            Hvilke <b style={{ color: "var(--brand-ink)" }}>ukedager</b> vil du gjøre{" "}
            <b style={{ color: "var(--brand-ink)" }}>{workoutName.toLowerCase()}</b>-økter?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {DISPLAY_ORDER.map((dow) => {
              const on = days.includes(dow)
              return (
                <button
                  key={dow}
                  type="button"
                  onClick={() =>
                    setDays((prev) => (prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow]))
                  }
                  style={{
                    padding: "10px 14px",
                    borderRadius: 99,
                    border: "none",
                    background: on ? "var(--brand-orange)" : "var(--brand-subtle)",
                    color: on ? "white" : "var(--brand-ink)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {DOW_LABELS[dow]}
                </button>
              )
            })}
          </div>
          {days.length > 0 && (
            <p style={{ fontSize: 12, color: "var(--brand-muted)" }}>
              {workoutName} på{" "}
              <b style={{ color: "var(--brand-ink)" }}>
                {sortedSelectedLabels.join(", ")}
              </b>
            </p>
          )}
        </>
      )}

      {tab === "frequency" && (
        <>
          <p style={{ fontSize: 13, color: "var(--brand-muted)", marginBottom: 16 }}>
            <b style={{ color: "var(--brand-ink)" }}>Hvor mange ganger</b> i uka vil du gjøre{" "}
            <b style={{ color: "var(--brand-ink)" }}>{workoutName.toLowerCase()}</b>?
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const on = freq === n
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFreq(n)}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    borderRadius: 10,
                    border: "none",
                    background: on ? "var(--brand-orange)" : "var(--brand-subtle)",
                    color: on ? "white" : "var(--brand-ink)",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {n}×
                </button>
              )
            })}
          </div>
          {freq !== null && (
            <p style={{ fontSize: 12, color: "var(--brand-muted)" }}>
              {workoutName} <b style={{ color: "var(--brand-ink)" }}>{freq} ganger</b> i uka
            </p>
          )}
        </>
      )}

      <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          disabled={!canContinue}
          onClick={handleContinue}
          style={{
            background: canContinue ? "var(--brand-orange)" : "var(--brand-border)",
            color: "white",
            border: "none",
            borderRadius: 99,
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 700,
            cursor: canContinue ? "pointer" : "not-allowed",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          → Fortsett
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm run test -- WorkoutScheduleStep`
Expected: PASS (4/4 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/components/program/wizard/WorkoutScheduleStep.tsx web/src/components/program/wizard/WorkoutScheduleStep.test.tsx
git commit -m "feat(web): wizard step 4 — schedule (weekdays/frequency tabs)"
```

---

## Task 13: Wizard host at `/program/new`

**Files:**
- Create: `web/src/app/(tabs)/program/new/page.tsx`

- [ ] **Step 1: Create wizard host page**

```tsx
// web/src/app/(tabs)/program/new/page.tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import WizardLayout from "@/components/program/wizard/WizardLayout"
import ProgramNameStep from "@/components/program/wizard/ProgramNameStep"
import WorkoutTemplateStep from "@/components/program/wizard/WorkoutTemplateStep"
import WorkoutNameStep from "@/components/program/wizard/WorkoutNameStep"
import WorkoutScheduleStep from "@/components/program/wizard/WorkoutScheduleStep"
import { createProgram, type DaySchedule, type WorkoutTemplate } from "@/lib/api"

const TEMPLATE_NAME: Record<WorkoutTemplate, string> = {
  "custom": "",
  "push": "Push",
  "pull": "Pull",
  "legs": "Legs",
  "full-body": "Full body",
  "upper-body": "Upper body",
}

type Step = 1 | 2 | 3 | 4

export default function NewProgramWizardPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [programName, setProgramName] = useState("")
  const [workoutTemplate, setWorkoutTemplate] = useState<WorkoutTemplate | null>(null)
  const [workoutName, setWorkoutName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const progress = step * 25

  const goBack = () => {
    if (step === 1) {
      router.push("/program")
    } else {
      setStep((s) => (s - 1) as Step)
    }
  }

  const submitFinal = async (schedule: DaySchedule) => {
    setSubmitting(true)
    setError(null)
    try {
      const body =
        schedule.kind === "weekdays"
          ? { name: workoutName, weekdays: schedule.weekdays }
          : { name: workoutName, frequency_per_week: schedule.frequency_per_week }
      const program = await createProgram({ name: programName, first_day: body })
      router.replace(`/program/${program.id}`)
    } catch (e) {
      setError("Kunne ikke lage program. Prøv igjen.")
      setSubmitting(false)
    }
  }

  return (
    <WizardLayout progressPercent={progress} onBack={goBack}>
      {step === 1 && (
        <ProgramNameStep
          initialName={programName}
          onNext={(name) => {
            setProgramName(name)
            setStep(2)
          }}
        />
      )}
      {step === 2 && (
        <WorkoutTemplateStep
          onSelect={(template) => {
            setWorkoutTemplate(template)
            setWorkoutName(TEMPLATE_NAME[template])
            setStep(3)
          }}
        />
      )}
      {step === 3 && (
        <WorkoutNameStep
          initialName={workoutName}
          onNext={(name) => {
            setWorkoutName(name)
            setStep(4)
          }}
        />
      )}
      {step === 4 && (
        <WorkoutScheduleStep
          workoutName={workoutName}
          onNext={submitFinal}
        />
      )}
      {submitting && (
        <p style={{ position: "fixed", bottom: 80, left: 0, right: 0, textAlign: "center", fontSize: 12, color: "var(--brand-muted)" }}>
          Lager program...
        </p>
      )}
      {error && (
        <p style={{ position: "fixed", bottom: 80, left: 0, right: 0, textAlign: "center", fontSize: 12, color: "#dc2626" }}>
          {error}
        </p>
      )}
    </WizardLayout>
  )
}
```

- [ ] **Step 2: Run build to verify imports resolve**

Run: `cd web && npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/\(tabs\)/program/new/page.tsx
git commit -m "feat(web): wizard host at /program/new"
```

---

## Task 14: Wire up `NewProgramSheet` to navigate to wizard

**Files:**
- Modify: `web/src/components/program/library/NewProgramSheet.tsx` (line 22-25)

- [ ] **Step 1: Open `web/src/components/program/library/NewProgramSheet.tsx` and find `handleScratch`:**

```tsx
const handleScratch = () => {
  onClose()
  alert("Bygg fra scratch kommer snart")
}
```

- [ ] **Step 2: Replace with router navigation**

```tsx
const handleScratch = () => {
  onClose()
  router.push("/program/new")
}
```

- [ ] **Step 3: Verify dev build works**

Run: `cd web && npm run build` (or `npm run typecheck`)
Expected: PASS, no errors.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/program/library/NewProgramSheet.tsx
git commit -m "feat(web): wire NewProgramSheet 'Bygg fra scratch' to /program/new wizard"
```

---

## Task 15: EditExerciseSheet — sets/reps/weight/notes editor

**Files:**
- Create: `web/src/components/program/detail/EditExerciseSheet.tsx`
- Create: `web/src/components/program/detail/EditExerciseSheet.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// web/src/components/program/detail/EditExerciseSheet.test.tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import EditExerciseSheet from "./EditExerciseSheet"

describe("EditExerciseSheet", () => {
  it("does not render when open is false", () => {
    render(
      <EditExerciseSheet
        open={false}
        initial={{ sets: 3, reps: 10, weight_kg: 80, notes: "" }}
        onClose={() => {}}
        onSave={() => {}}
      />
    )
    expect(screen.queryByRole("button", { name: /lagre/i })).not.toBeInTheDocument()
  })

  it("pre-fills inputs with initial values", () => {
    render(
      <EditExerciseSheet
        open={true}
        initial={{ sets: 4, reps: 8, weight_kg: 60, notes: "note" }}
        onClose={() => {}}
        onSave={() => {}}
      />
    )
    expect(screen.getByLabelText(/sett/i)).toHaveValue(4)
    expect(screen.getByLabelText(/reps/i)).toHaveValue(8)
    expect(screen.getByLabelText(/vekt/i)).toHaveValue(60)
    expect(screen.getByLabelText(/notes/i)).toHaveValue("note")
  })

  it("calls onSave with all 4 fields", () => {
    const onSave = vi.fn()
    render(
      <EditExerciseSheet
        open={true}
        initial={{ sets: 3, reps: 10, weight_kg: 80, notes: "" }}
        onClose={() => {}}
        onSave={onSave}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /lagre/i }))
    expect(onSave).toHaveBeenCalledWith({ sets: 3, reps: 10, weight_kg: 80, notes: "" })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm run test -- EditExerciseSheet`
Expected: FAIL.

- [ ] **Step 3: Create component**

```tsx
// web/src/components/program/detail/EditExerciseSheet.tsx
"use client"
import { useState, useEffect } from "react"

interface Props {
  open: boolean
  initial: { sets: number; reps: number; weight_kg: number | null; notes: string }
  onClose: () => void
  onSave: (body: { sets: number; reps: number; weight_kg: number | null; notes: string }) => void
}

export default function EditExerciseSheet({ open, initial, onClose, onSave }: Props) {
  const [sets, setSets] = useState(initial.sets)
  const [reps, setReps] = useState(initial.reps)
  const [weight, setWeight] = useState<number | null>(initial.weight_kg)
  const [notes, setNotes] = useState(initial.notes)

  useEffect(() => {
    if (open) {
      setSets(initial.sets)
      setReps(initial.reps)
      setWeight(initial.weight_kg)
      setNotes(initial.notes)
    }
  }, [open, initial])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
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
        <div style={{ width: 32, height: 4, background: "var(--brand-border)", borderRadius: 99, margin: "0 auto 14px" }} />
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, textAlign: "center" }}>Rediger sett</h2>

        <Field id="sets-input" label="Sett">
          <input
            id="sets-input"
            type="number"
            min={1}
            max={20}
            value={sets}
            onChange={(e) => setSets(Math.max(1, Number(e.target.value) || 1))}
            style={fieldInput}
          />
        </Field>
        <Field id="reps-input" label="Reps">
          <input
            id="reps-input"
            type="number"
            min={1}
            max={99}
            value={reps}
            onChange={(e) => setReps(Math.max(1, Number(e.target.value) || 1))}
            style={fieldInput}
          />
        </Field>
        <Field id="weight-input" label="Vekt (kg)">
          <input
            id="weight-input"
            type="number"
            min={0}
            step={0.5}
            value={weight ?? ""}
            onChange={(e) => setWeight(e.target.value === "" ? null : Number(e.target.value))}
            placeholder="(bodyweight)"
            style={fieldInput}
          />
        </Field>
        <Field id="notes-input" label="Notes">
          <textarea
            id="notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            placeholder="F.eks. kontroller form, øk vekt neste uke"
            rows={3}
            style={{ ...fieldInput, resize: "vertical", minHeight: 60 }}
          />
        </Field>

        <button
          type="button"
          onClick={() => onSave({ sets, reps, weight_kg: weight, notes })}
          style={{
            width: "100%",
            background: "var(--brand-orange)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "12px 0",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            marginTop: 10,
          }}
        >
          Lagre
        </button>
      </div>
    </div>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <label htmlFor={id} style={{ display: "block", marginBottom: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--brand-muted)", display: "block", marginBottom: 4 }}>
        {label}
      </span>
      {children}
    </label>
  )
}

const fieldInput: React.CSSProperties = {
  width: "100%",
  padding: "9px 11px",
  fontSize: 14,
  border: "1px solid var(--brand-border)",
  borderRadius: 8,
  background: "white",
  outline: "none",
  boxSizing: "border-box",
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm run test -- EditExerciseSheet`
Expected: PASS (3/3 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/components/program/detail/EditExerciseSheet.tsx web/src/components/program/detail/EditExerciseSheet.test.tsx
git commit -m "feat(web): EditExerciseSheet — sets/reps/weight/notes"
```

---

## Task 16: RenameDaySheet + DayActionsSheet + ExerciseActionsSheet

**Files:**
- Create: `web/src/components/program/detail/RenameDaySheet.tsx`
- Create: `web/src/components/program/detail/DayActionsSheet.tsx`
- Create: `web/src/components/program/detail/ExerciseActionsSheet.tsx`

**Note:** Three small sheets, all similar structure. Group in one task for efficiency.

- [ ] **Step 1: Create `RenameDaySheet.tsx`**

```tsx
// web/src/components/program/detail/RenameDaySheet.tsx
"use client"
import { useState, useEffect } from "react"

interface Props {
  open: boolean
  initialName: string
  onClose: () => void
  onSave: (name: string) => void
}

export default function RenameDaySheet({ open, initialName, onClose, onSave }: Props) {
  const [name, setName] = useState(initialName)

  useEffect(() => {
    if (open) setName(initialName)
  }, [open, initialName])

  if (!open) return null
  const trimmed = name.trim()

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 20px 28px",
        }}
      >
        <div style={{ width: 32, height: 4, background: "var(--brand-border)", borderRadius: 99, margin: "0 auto 14px" }} />
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, textAlign: "center" }}>Endre navn</h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          style={{
            width: "100%", padding: "10px 12px", fontSize: 14,
            border: "1px solid var(--brand-border)", borderRadius: 8,
            background: "white", outline: "none", boxSizing: "border-box",
            marginBottom: 12,
          }}
        />
        <button
          type="button"
          disabled={trimmed.length === 0}
          onClick={() => onSave(trimmed)}
          style={{
            width: "100%",
            background: trimmed ? "var(--brand-orange)" : "var(--brand-border)",
            color: "white", border: "none", borderRadius: 12,
            padding: "12px 0", fontSize: 14, fontWeight: 700,
            cursor: trimmed ? "pointer" : "not-allowed",
          }}
        >
          Lagre
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `DayActionsSheet.tsx`**

```tsx
// web/src/components/program/detail/DayActionsSheet.tsx
"use client"

interface Props {
  open: boolean
  onClose: () => void
  onRename: () => void
  onEditSchedule: () => void
  onDelete: () => void
}

export default function DayActionsSheet({ open, onClose, onRename, onEditSchedule, onDelete }: Props) {
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 12px 24px",
        }}
      >
        <div style={{ width: 32, height: 4, background: "var(--brand-border)", borderRadius: 99, margin: "0 auto 14px" }} />
        <Row label="Endre navn" onClick={() => { onClose(); onRename() }} />
        <Row label="Endre ukedager" onClick={() => { onClose(); onEditSchedule() }} />
        <Row label="Slett dag" onClick={() => { onClose(); onDelete() }} destructive />
      </div>
    </div>
  )
}

function Row({ label, onClick, destructive }: { label: string; onClick: () => void; destructive?: boolean }) {
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
        textAlign: "left",
        fontSize: 14,
        fontWeight: 600,
        color: destructive ? "#dc2626" : "var(--brand-ink)",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  )
}
```

- [ ] **Step 3: Create `ExerciseActionsSheet.tsx`**

```tsx
// web/src/components/program/detail/ExerciseActionsSheet.tsx
"use client"

interface Props {
  open: boolean
  onClose: () => void
  onEdit: () => void
  onRemove: () => void
}

export default function ExerciseActionsSheet({ open, onClose, onEdit, onRemove }: Props) {
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 12px 24px",
        }}
      >
        <div style={{ width: 32, height: 4, background: "var(--brand-border)", borderRadius: 99, margin: "0 auto 14px" }} />
        <Row label="Rediger sett" onClick={() => { onClose(); onEdit() }} />
        <Row label="Fjern øvelse" onClick={() => { onClose(); onRemove() }} destructive />
      </div>
    </div>
  )
}

function Row({ label, onClick, destructive }: { label: string; onClick: () => void; destructive?: boolean }) {
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
        textAlign: "left",
        fontSize: 14,
        fontWeight: 600,
        color: destructive ? "#dc2626" : "var(--brand-ink)",
        cursor: "pointer",
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
git add web/src/components/program/detail/RenameDaySheet.tsx web/src/components/program/detail/DayActionsSheet.tsx web/src/components/program/detail/ExerciseActionsSheet.tsx
git commit -m "feat(web): rename/day-actions/exercise-actions sheets"
```

---

## Task 16b: EditScheduleSheet — change weekdays/frequency on existing day

**Files:**
- Create: `web/src/components/program/detail/EditScheduleSheet.tsx`

**Note:** Small wrapper around `WorkoutScheduleStep` that takes initial values and lets the user change schedule for an existing day.

- [ ] **Step 1: Create the component**

```tsx
// web/src/components/program/detail/EditScheduleSheet.tsx
"use client"
import WorkoutScheduleStep from "../wizard/WorkoutScheduleStep"
import { updateProgramDay, type DaySchedule } from "@/lib/api"

interface Props {
  open: boolean
  programId: string
  dayId: string
  dayName: string
  onClose: () => void
  onSaved: () => void
}

export default function EditScheduleSheet({ open, programId, dayId, dayName, onClose, onSaved }: Props) {
  if (!open) return null

  const handleNext = async (schedule: DaySchedule) => {
    try {
      if (schedule.kind === "weekdays") {
        await updateProgramDay(programId, dayId, {
          weekdays: schedule.weekdays,
          frequency_per_week: null,
        })
      } else {
        await updateProgramDay(programId, dayId, {
          weekdays: [],
          frequency_per_week: schedule.frequency_per_week,
        })
      }
      onSaved()
      onClose()
    } catch {
      // surface error in UI via parent's reload-fail path
      onClose()
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, height: "70vh",
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 18px 24px",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ width: 32, height: 4, background: "var(--brand-border)", borderRadius: 99, margin: "0 auto 14px" }} />
        <WorkoutScheduleStep workoutName={dayName} onNext={handleNext} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd web && npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/program/detail/EditScheduleSheet.tsx
git commit -m "feat(web): EditScheduleSheet — change weekdays/frequency on existing day"
```

---

## Task 17: AddDaySheet — reuses wizard steps 2-4 for a new day

**Files:**
- Create: `web/src/components/program/detail/AddDaySheet.tsx`

**Note:** This is a multi-step sheet (template → name → schedule) that wraps the existing wizard step components. No new step components required.

- [ ] **Step 1: Create the component**

```tsx
// web/src/components/program/detail/AddDaySheet.tsx
"use client"
import { useState } from "react"
import WorkoutTemplateStep from "../wizard/WorkoutTemplateStep"
import WorkoutNameStep from "../wizard/WorkoutNameStep"
import WorkoutScheduleStep from "../wizard/WorkoutScheduleStep"
import { addProgramDay, type DaySchedule, type WorkoutTemplate, type ProgramDay } from "@/lib/api"

interface Props {
  open: boolean
  programId: string
  onClose: () => void
  onAdded: (day: ProgramDay) => void
}

const TEMPLATE_NAME: Record<WorkoutTemplate, string> = {
  "custom": "",
  "push": "Push",
  "pull": "Pull",
  "legs": "Legs",
  "full-body": "Full body",
  "upper-body": "Upper body",
}

export default function AddDaySheet({ open, programId, onClose, onAdded }: Props) {
  const [step, setStep] = useState<2 | 3 | 4>(2)
  const [workoutName, setWorkoutName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    setStep(2)
    setWorkoutName("")
    setError(null)
    onClose()
  }

  const handleFinal = async (schedule: DaySchedule) => {
    setSubmitting(true)
    setError(null)
    try {
      const body =
        schedule.kind === "weekdays"
          ? { name: workoutName, weekdays: schedule.weekdays }
          : { name: workoutName, frequency_per_week: schedule.frequency_per_week }
      const day = await addProgramDay(programId, body)
      onAdded(day)
      close()
    } catch (e) {
      setError("Kunne ikke legge til dag. Prøv igjen.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div
      onClick={close}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          height: "85vh",
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 18px 24px",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ width: 32, height: 4, background: "var(--brand-border)", borderRadius: 99, margin: "0 auto 14px" }} />
        {step === 2 && (
          <WorkoutTemplateStep
            onSelect={(template) => {
              setWorkoutName(TEMPLATE_NAME[template])
              setStep(3)
            }}
          />
        )}
        {step === 3 && (
          <WorkoutNameStep
            initialName={workoutName}
            onNext={(name) => {
              setWorkoutName(name)
              setStep(4)
            }}
          />
        )}
        {step === 4 && (
          <WorkoutScheduleStep
            workoutName={workoutName}
            onNext={handleFinal}
          />
        )}
        {submitting && (
          <p style={{ textAlign: "center", fontSize: 12, color: "var(--brand-muted)" }}>Lagrer...</p>
        )}
        {error && (
          <p style={{ textAlign: "center", fontSize: 12, color: "#dc2626" }}>{error}</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `cd web && npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/program/detail/AddDaySheet.tsx
git commit -m "feat(web): AddDaySheet — reuse wizard steps 2-4 for new day"
```

---

## Task 18: Update `DayCard` — weekday label, dots, edit affordances

**Files:**
- Modify: `web/src/components/program/detail/DayCard.tsx`

- [ ] **Step 1: Read current `DayCard.tsx`**

Open `web/src/components/program/detail/DayCard.tsx` to understand current structure.

- [ ] **Step 2: Update `DayCard` props type to include `weekdays`, `frequency_per_week`**

Find the existing `Day` type/props near top of `DayCard.tsx`. Add the fields:

```tsx
interface Day {
  id: string
  day_number: number
  name: string
  weekdays: number[]
  frequency_per_week: number | null
  exercise_count: number
  exercises?: Array<{
    id: string
    exercise_id: string
    name: string
    image_url: string | null
    notes?: string | null
    sets?: number
    reps?: number
    weight_kg?: number | null
  }>
}

interface Props {
  day: Day
  programId: string
  isToday: boolean
  onChanged?: () => void
}
```

- [ ] **Step 3: Add weekday-label rendering**

Inside the DayCard render, above the day name, add:

```tsx
const DOW_LABELS = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"]
const scheduleLabel =
  day.weekdays.length > 0
    ? [...day.weekdays].sort((a, b) => a - b).map((d) => DOW_LABELS[d]).join(" · ")
    : day.frequency_per_week
    ? `${day.frequency_per_week}× per uke`
    : "Ingen schedule"

// ... in render:
<div style={{
  fontSize: 10,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: "var(--brand-orange)",
  fontWeight: 700,
  marginBottom: 2,
}}>
  {scheduleLabel}
</div>
```

- [ ] **Step 4: Add "+ Legg til øvelse"-link inside expanded day**

At the bottom of the expanded exercise list inside the DayCard:

```tsx
import ExercisePickerSheet from "@/components/program/workout/ExercisePickerSheet"
import { addExerciseToDay } from "@/lib/api"

// Inside DayCard component:
const [pickerOpen, setPickerOpen] = useState(false)

// In render, below exercises:
<button
  type="button"
  onClick={() => setPickerOpen(true)}
  style={{
    background: "none",
    border: "none",
    color: "var(--brand-orange)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    padding: "8px 0",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
  }}
>
  + LEGG TIL ØVELSE
</button>

<ExercisePickerSheet
  open={pickerOpen}
  onClose={() => setPickerOpen(false)}
  onSelect={async (exerciseId) => {
    await addExerciseToDay(props.programId, day.id, { exercise_id: exerciseId })
    setPickerOpen(false)
    props.onChanged?.()
  }}
/>
```

- [ ] **Step 5: Wire up dots menu + sheets**

Import sheets at top:

```tsx
import DayActionsSheet from "./DayActionsSheet"
import RenameDaySheet from "./RenameDaySheet"
import EditExerciseSheet from "./EditExerciseSheet"
import ExerciseActionsSheet from "./ExerciseActionsSheet"
import EditScheduleSheet from "./EditScheduleSheet"
import { updateProgramDay, deleteProgramDay, updateProgramExercise, deleteExercise } from "@/lib/api"
```

Add state for sheets:

```tsx
const [actionsOpen, setActionsOpen] = useState(false)
const [renameOpen, setRenameOpen] = useState(false)
const [scheduleOpen, setScheduleOpen] = useState(false)
const [editExOpen, setEditExOpen] = useState<{ id: string; initial: { sets: number; reps: number; weight_kg: number | null; notes: string } } | null>(null)
const [exActionsOpen, setExActionsOpen] = useState<{ id: string; initial: { sets: number; reps: number; weight_kg: number | null; notes: string } } | null>(null)
```

Render the day name row with dots:

```tsx
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
  <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{day.name}</h3>
  <button
    type="button"
    aria-label="Dag-handlinger"
    onClick={(e) => { e.stopPropagation(); setActionsOpen(true) }}
    style={{ background: "none", border: "none", color: "var(--brand-muted)", fontSize: 18, cursor: "pointer" }}
  >
    ⋯
  </button>
</div>
```

For each exercise row, attach edit + dots:

```tsx
{day.exercises?.map((ex) => (
  <div key={ex.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
    {/* thumbnail */}
    <div
      onClick={() => setEditExOpen({
        id: ex.id,
        initial: {
          sets: ex.sets ?? 3,
          reps: ex.reps ?? 10,
          weight_kg: ex.weight_kg ?? null,
          notes: ex.notes ?? "",
        },
      })}
      style={{ flex: 1, cursor: "pointer" }}
    >
      <div style={{ fontSize: 13, fontWeight: 600 }}>{ex.name}</div>
      <div style={{ fontSize: 11, color: "var(--brand-muted)" }}>
        {ex.sets ?? 3} × {ex.reps ?? 10}
        {ex.weight_kg != null ? ` · ${ex.weight_kg} kg` : ""}
      </div>
    </div>
    <button
      type="button"
      onClick={() => setExActionsOpen({
        id: ex.id,
        initial: {
          sets: ex.sets ?? 3,
          reps: ex.reps ?? 10,
          weight_kg: ex.weight_kg ?? null,
          notes: ex.notes ?? "",
        },
      })}
      style={{ background: "none", border: "none", color: "var(--brand-muted)", fontSize: 16, cursor: "pointer" }}
    >
      ⋯
    </button>
  </div>
))}
```

Render the sheets at the bottom of DayCard:

```tsx
<DayActionsSheet
  open={actionsOpen}
  onClose={() => setActionsOpen(false)}
  onRename={() => setRenameOpen(true)}
  onEditSchedule={() => setScheduleOpen(true)}
  onDelete={async () => {
    if (confirm(`Slett "${day.name}"?`)) {
      await deleteProgramDay(props.programId, day.id)
      props.onChanged?.()
    }
  }}
/>
<EditScheduleSheet
  open={scheduleOpen}
  programId={props.programId}
  dayId={day.id}
  dayName={day.name}
  onClose={() => setScheduleOpen(false)}
  onSaved={() => props.onChanged?.()}
/>
<RenameDaySheet
  open={renameOpen}
  initialName={day.name}
  onClose={() => setRenameOpen(false)}
  onSave={async (name) => {
    await updateProgramDay(props.programId, day.id, { name })
    setRenameOpen(false)
    props.onChanged?.()
  }}
/>
{editExOpen && (
  <EditExerciseSheet
    open={true}
    initial={editExOpen.initial}
    onClose={() => setEditExOpen(null)}
    onSave={async (body) => {
      await updateProgramExercise(props.programId, day.id, editExOpen.id, body)
      setEditExOpen(null)
      props.onChanged?.()
    }}
  />
)}
{exActionsOpen && (
  <ExerciseActionsSheet
    open={true}
    onClose={() => setExActionsOpen(null)}
    onEdit={() => {
      setEditExOpen(exActionsOpen)
      setExActionsOpen(null)
    }}
    onRemove={async () => {
      await deleteExercise(props.programId, day.id, exActionsOpen.id)
      setExActionsOpen(null)
      props.onChanged?.()
    }}
  />
)}
```

- [ ] **Step 6: Run typecheck and existing DayCard tests**

Run: `cd web && npm run test -- DayCard && npm run typecheck`
Expected: existing tests may need updates if assertions check on the new structure; update assertion(s) to include `weekdays: []`. Tests should PASS.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/program/detail/DayCard.tsx web/src/components/program/detail/DayCard.test.tsx
git commit -m "feat(web): DayCard — weekday label, dots menu, inline edit affordances"
```

---

## Task 19: Update `ProgramDetail` — rename header, AKTIVER, "+ LEGG TIL DAG"

**Files:**
- Modify: `web/src/components/program/detail/ProgramDetail.tsx`

- [ ] **Step 1: Open and find the existing `subtitle` calculation**

It currently shows: `const subtitle = \`${program.days?.length ?? 0} dager\``

- [ ] **Step 2: Update subtitle to also show økter/uke**

Replace with:

```tsx
const totalSessionsPerWeek = (program.days ?? []).reduce((sum, d) => {
  if (d.weekdays && d.weekdays.length > 0) return sum + d.weekdays.length
  if (d.frequency_per_week) return sum + d.frequency_per_week
  return sum
}, 0)
const subtitle =
  totalSessionsPerWeek > 0
    ? `${program.days?.length ?? 0} dager · ${totalSessionsPerWeek} økter/uke`
    : `${program.days?.length ?? 0} dager`
```

- [ ] **Step 3: Add state and handlers**

Add to the imports:

```tsx
import { useState } from "react"
import AddDaySheet from "./AddDaySheet"
import RenameDaySheet from "./RenameDaySheet"
import { patchProgram } from "@/lib/api"
```

Inside `ProgramDetail`, add state:

```tsx
const [addDayOpen, setAddDayOpen] = useState(false)
const [renameProgOpen, setRenameProgOpen] = useState(false)
```

- [ ] **Step 4: Make `ProgramDetailHeader` clickable for rename + add AKTIVER**

Modify the header render in `ProgramDetail`:

```tsx
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
  <button
    type="button"
    onClick={() => setRenameProgOpen(true)}
    style={{
      background: "none", border: "none",
      fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em",
      color: "var(--brand-ink)", padding: 0, cursor: "pointer",
      textAlign: "left",
    }}
  >
    {program.name} ✎
  </button>
  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    {!program.is_active && (
      <button
        type="button"
        onClick={async () => {
          await patchProgram(program.id, { is_active: true })
          window.location.reload()
        }}
        style={{
          background: "none", border: "none",
          color: "var(--brand-orange)", fontSize: 12, fontWeight: 700,
          letterSpacing: 0.6, cursor: "pointer",
        }}
      >
        AKTIVER
      </button>
    )}
    <button
      type="button"
      aria-label="Program-meny"
      onClick={() => setMenuOpen(true)}
      style={{ background: "none", border: "none", color: "var(--brand-muted)", fontSize: 20, cursor: "pointer" }}
    >
      ⋯
    </button>
  </div>
</div>
<div style={{ fontSize: 12, color: "var(--brand-muted)", marginBottom: 22 }}>
  {subtitle}{program.is_active ? " · aktiv" : ""}
</div>
```

Remove the existing `<ProgramDetailHeader>` usage if it's superseded by the inline render above. (If `ProgramDetailHeader` is still needed elsewhere, leave it. Otherwise delete.)

- [ ] **Step 5: Pass `programId` and `onChanged` to each `DayCard`**

Replace existing DayCard usage:

```tsx
{(program.days ?? []).map((day) => (
  <DayCard
    key={day.id}
    programId={program.id}
    day={{
      id: day.id,
      day_number: day.day_number,
      name: day.name,
      weekdays: day.weekdays ?? [],
      frequency_per_week: day.frequency_per_week ?? null,
      exercise_count: day.exercises?.length ?? 0,
      exercises: day.exercises?.map((ex) => ({
        id: ex.id,
        exercise_id: ex.exercise_id,
        name: ex.name,
        image_url: null,
        notes: ex.notes,
        sets: ex.sets?.length,
        reps: ex.sets?.[0]?.reps,
        weight_kg: ex.sets?.[0]?.weight_kg,
      })),
    }}
    isToday={day.day_number === todayDayNumber && (day.exercises?.length ?? 0) > 0}
    onChanged={() => window.location.reload()}
  />
))}
```

- [ ] **Step 6: Add "+ LEGG TIL DAG" at the bottom + sheets**

After the days map, add:

```tsx
<button
  type="button"
  onClick={() => setAddDayOpen(true)}
  style={{
    background: "none", border: "none",
    color: "var(--brand-orange)",
    fontSize: 12, fontWeight: 700, letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center", width: "100%",
    padding: "16px 0", marginTop: 24,
    borderTop: "1px solid var(--brand-border)",
    cursor: "pointer",
  }}
>
  + LEGG TIL DAG
</button>

<AddDaySheet
  open={addDayOpen}
  programId={program.id}
  onClose={() => setAddDayOpen(false)}
  onAdded={() => window.location.reload()}
/>
<RenameDaySheet
  open={renameProgOpen}
  initialName={program.name}
  onClose={() => setRenameProgOpen(false)}
  onSave={async (name) => {
    await patchProgram(program.id, { name })
    setRenameProgOpen(false)
    window.location.reload()
  }}
/>
```

- [ ] **Step 7: Run typecheck**

Run: `cd web && npm run typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add web/src/components/program/detail/ProgramDetail.tsx
git commit -m "feat(web): ProgramDetail — rename, activate, add-day affordances"
```

---

## Task 20: Backend — return weekdays/frequency_per_week/notes in `GET /api/programs/{id}`

**Files:**
- Modify: `api/app/routers/programs.py` (the `get_program` SQL/return shape near line 47-160)

- [ ] **Step 1: Read existing `get_program` query**

The SELECT in `get_program` (and `get_active_program`) needs to include the new columns.

- [ ] **Step 2: Update `get_program` SQL to include `weekdays`, `frequency_per_week`, `notes`**

In `api/app/routers/programs.py`, find the query that returns `pd.id, pd.day_number, pd.name` and JSON-aggregates exercises. Update to include the new columns. The exact change:

Find:
```sql
SELECT pd.id, pd.day_number, pd.name,
```

Replace with:
```sql
SELECT pd.id, pd.day_number, pd.name, pd.weekdays, pd.frequency_per_week,
```

Inside the same query, the inner `json_build_object` for exercises currently has no `notes`. Add `'notes', pe.notes,`:

Find (around line 65):
```sql
'order_index', pe.order_index,
```

Replace with:
```sql
'order_index', pe.order_index,
'notes', pe.notes,
```

Then update the return mapping at the bottom of `get_program` and `get_active_program`. Find:

```python
"days": [
    {
        "id": str(r[0]),
        "day_number": r[1],
        "name": r[2],
        "exercises": r[3] or [],
    }
    for r in rows
],
```

Replace with:
```python
"days": [
    {
        "id": str(r[0]),
        "day_number": r[1],
        "name": r[2],
        "weekdays": list(r[3] or []),
        "frequency_per_week": r[4],
        "exercises": r[5] or [],
    }
    for r in rows
],
```

(Indices shifted: r[3]→weekdays, r[4]→frequency, r[5]→exercises since two new columns inserted before exercises.)

- [ ] **Step 3: Update existing test mocks to match new column order**

In `api/tests/test_programs_router.py`, find `test_get_program_detail_returns_days` and update the day-row mock:

Find:
```python
cur_days.fetchall = AsyncMock(return_value=[
    (
        day_id, 1, "Legs",
        [{"id": "cc", "exercise_id": "squat", "name": "Squat",
          "muscle_groups": ["quads"], "order_index": 0,
          "sets": [{"id": "ss", "set_number": 1, "reps": 5, "weight_kg": 80.0}]}],
    )
])
```

Replace with:
```python
cur_days.fetchall = AsyncMock(return_value=[
    (
        day_id, 1, "Legs", [1, 3, 5], None,
        [{"id": "cc", "exercise_id": "squat", "name": "Squat",
          "muscle_groups": ["quads"], "order_index": 0, "notes": None,
          "sets": [{"id": "ss", "set_number": 1, "reps": 5, "weight_kg": 80.0}]}],
    )
])
```

Add assertions:

```python
assert data["days"][0]["weekdays"] == [1, 3, 5]
assert data["days"][0]["frequency_per_week"] is None
```

Also check `test_active_program_router.py` and update similarly if it has a comparable mock.

- [ ] **Step 4: Run tests**

Run: `cd api && .venv/bin/pytest tests/test_programs_router.py tests/test_active_program_router.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/app/routers/programs.py api/tests/test_programs_router.py api/tests/test_active_program_router.py
git commit -m "feat(api): include weekdays/frequency/notes in program GET responses"
```

---

## Task 21: Manual e2e verification

**Files:**
- None (manual testing)

- [ ] **Step 1: Apply migration 014 in Supabase (already done in Task 1 step 6)**

Verify in Supabase Table Editor that:
- `program_days` has columns `weekdays` (int[]) and `frequency_per_week` (int)
- `program_exercises` has column `notes` (text)

- [ ] **Step 2: Start dev servers**

Open two terminals.

Terminal 1:
```bash
cd api && .venv/bin/uvicorn app.main:app --reload --port 8000
```

Terminal 2:
```bash
cd web && npm run dev
```

- [ ] **Step 3: Walk the flow**

1. Log in via the dev frontend
2. Navigate to "Programmer" tab
3. Tap "+ Nytt program" → sheet opens
4. Tap "Bygg fra scratch" → router pushes to `/program/new` (no more alert!)
5. **Step 1**: Type "Test PPL" → tap Fortsett. Progress bar shows 25→50%.
6. **Step 2**: Tap "Push" → no continue button, instant navigation. Progress 50→75%.
7. **Step 3**: Name is pre-filled "Push" → tap Fortsett. Progress 75→100%.
8. **Step 4**:
   - Confirm "Ukedager" tab is active
   - Tap "Man" → confirm orange highlight
   - Tap "Ons" and "Fre" → bekreftelse: "Push på Man, Ons, Fre"
   - Tap Fortsett
9. **Editor**:
   - URL is `/program/{id}`
   - Header shows "Test PPL ✎" + "AKTIVER" + "..."
   - Day shows weekday label "MANDAG · ONSDAG · FREDAG" + name "Push" + dots
   - "+ LEGG TIL ØVELSE" link visible
   - "+ LEGG TIL DAG" link at bottom
10. **Add exercise**:
    - Tap "+ LEGG TIL ØVELSE" → ExercisePickerSheet opens with 873 exercises
    - Search "benkpress" → tap result → either "Legg til denne" or callback fires → øvelsen vises i Push-dagen
11. **Edit exercise**:
    - Tap the exercise row → EditExerciseSheet opens
    - Change sets=4, reps=8, weight=80, notes="Kontroller form"
    - Tap Lagre → row updates to "4 × 8 · 80 kg"
12. **Add second day**:
    - Tap "+ LEGG TIL DAG" → sheet slides up
    - Tap "Pull" → name pre-filled → Fortsett
    - Switch to "Hyppighet" tab → tap "2×" → Fortsett
    - Sheet closes; Pull day appears below Push with "2× per uke" label
13. **Rename day**:
    - Tap dots on Push → "Endre navn" → sheet → "Push v2" → Lagre → updates
14. **Activate**:
    - Tap "AKTIVER" → reloads, header shows "aktiv" subtitle
15. **Verify in library**:
    - Go back to /program — new program shows with green "Aktiv" pill

- [ ] **Step 4: Confirm in browser DevTools network tab**

For each action, confirm the network calls:
- Create: `POST /api/programs` 201
- Add day: `POST /api/programs/{id}/days` 201
- Rename day: `PATCH /api/programs/{id}/days/{day_id}` 200
- Add exercise: `POST /api/programs/{id}/days/{day_id}/exercises` 200
- Edit exercise: `PATCH /api/programs/{id}/days/{day_id}/exercises/{ex_id}` 200
- Activate: `PATCH /api/programs/{id}` 200

- [ ] **Step 5: Report results**

If anything fails, report which step + the error in browser console / network tab. Otherwise mark this task complete.

---

## Self-Review Summary

**Spec coverage:** Every section in the spec is covered by tasks 1-21:
- Migration 014 → Task 1
- POST /programs → Task 2
- POST /programs/{id}/days → Task 3
- PATCH /programs/{id}/days/{day_id} → Task 4
- DELETE /programs/{id}/days/{day_id} → Task 5
- PATCH /programs/{id}/days/{day_id}/exercises/{ex_id} → Task 6
- api.ts client → Task 7
- WizardLayout → Task 8
- ProgramNameStep → Task 9
- WorkoutTemplateStep → Task 10
- WorkoutNameStep → Task 11
- WorkoutScheduleStep → Task 12
- Wizard host route → Task 13
- NewProgramSheet wire-up → Task 14
- EditExerciseSheet → Task 15
- RenameDaySheet, DayActionsSheet, ExerciseActionsSheet → Task 16
- EditScheduleSheet → Task 16b
- AddDaySheet → Task 17
- DayCard updates → Task 18
- ProgramDetail updates → Task 19
- GET /programs response updates → Task 20
- Manual e2e → Task 21

**Existing endpoints reused:** PATCH `/programs/{id}` (already exists for rename + activate), DELETE `/programs/{id}` (exists), POST `/programs/{id}/days/{day_id}/exercises` (exists for adding exercise).

**Out-of-scope items confirmed:**
- Tool dispatcher fix for `program_exercise_sets` schema mismatch — separate workstream (referenced in spec)
- Calendar view — future work
- Drag-to-reorder — future work
- Templates picker ("Velg en mal") — separate workstream

**Type consistency check:** All types (`Program`, `ProgramDay`, `ProgramExercise`, `DaySchedule`, `WorkoutTemplate`) defined consistently in api.ts and used the same way across components.
