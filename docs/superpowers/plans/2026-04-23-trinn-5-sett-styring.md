# Trinn 5: Sett-styring i program — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace aggregate sets/reps/weight_kg with individual set rows per exercise, add a direct-add "+" button, and a dedicated ExerciseDetail view for managing sets.

**Architecture:** New DB migration creates `program_exercise_sets` and migrates existing data by expanding aggregate rows. Backend endpoints updated to return sets arrays. New endpoints for GET exercise detail, POST/PATCH/DELETE set. ExerciseLibrary simplified to one-tap add. New ExerciseDetail component shows SET | FORRIGE | KG | REPS rows with inline editing.

**Tech Stack:** FastAPI, psycopg3 (AsyncConnectionPool), pytest-asyncio, Next.js 15, TypeScript

---

## File Map

**Created:**
- `api/db/migrations/003_program_exercise_sets.sql`
- `api/tests/test_sets_router.py`
- `web/src/components/program/ExerciseDetail.tsx`

**Modified:**
- `api/db/seed_programs.sql`
- `api/app/routers/programs.py`
- `api/tests/test_add_exercise_router.py`
- `api/tests/test_programs_router.py`
- `web/src/lib/api.ts`
- `web/src/components/program/ExerciseLibrary.tsx`
- `web/src/components/program/ProgramDetail.tsx`

---

### Task 1: DB Migration + Seed Update

**Files:**
- Create: `api/db/migrations/003_program_exercise_sets.sql`
- Modify: `api/db/seed_programs.sql`

- [ ] **Step 1: Create migration file**

Create `api/db/migrations/003_program_exercise_sets.sql`:

```sql
-- 003_program_exercise_sets.sql
CREATE TABLE IF NOT EXISTS program_exercise_sets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_exercise_id UUID NOT NULL REFERENCES program_exercises(id) ON DELETE CASCADE,
    set_number          INTEGER NOT NULL,
    reps                INTEGER NOT NULL CHECK (reps > 0),
    weight_kg           NUMERIC(6, 2),
    CONSTRAINT uq_exercise_set_order UNIQUE (program_exercise_id, set_number)
);

-- Migrate existing aggregate rows into individual set rows
INSERT INTO program_exercise_sets (program_exercise_id, set_number, reps, weight_kg)
SELECT
    pe.id,
    generate_series(1, pe.sets) AS set_number,
    pe.reps,
    pe.weight_kg
FROM program_exercises pe
WHERE pe.sets > 0
ON CONFLICT ON CONSTRAINT uq_exercise_set_order DO NOTHING;

-- Drop aggregate columns superseded by program_exercise_sets
ALTER TABLE program_exercises DROP COLUMN IF EXISTS sets;
ALTER TABLE program_exercises DROP COLUMN IF EXISTS reps;
ALTER TABLE program_exercises DROP COLUMN IF EXISTS weight_kg;
```

- [ ] **Step 2: Update seed file**

The seed currently inserts `program_exercises` rows with `sets, reps, weight_kg` columns which no longer exist after the migration. The migration handles the live Supabase data. Update the seed for future fresh-DB use.

Replace the `INSERT INTO program_exercises` blocks (keeping `program_days` inserts unchanged). Give each `program_exercises` row an explicit `id` so `program_exercise_sets` can reference it.

Full replacement for the three exercise blocks in `api/db/seed_programs.sql`:

```sql
-- Day 1: Ben
INSERT INTO program_exercises (id, program_day_id, exercise_id, order_index) VALUES
('00000000-0000-0001-0001-000000000001', '00000000-0000-0000-0000-000000000010', 'squat',             0),
('00000000-0000-0001-0001-000000000002', '00000000-0000-0000-0000-000000000010', 'leg-press',         1),
('00000000-0000-0001-0001-000000000003', '00000000-0000-0000-0000-000000000010', 'lunge',             2),
('00000000-0000-0001-0001-000000000004', '00000000-0000-0000-0000-000000000010', 'romanian-deadlift', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO program_exercise_sets (program_exercise_id, set_number, reps, weight_kg) VALUES
('00000000-0000-0001-0001-000000000001', 1, 5, 80),  ('00000000-0000-0001-0001-000000000001', 2, 5, 80),
('00000000-0000-0001-0001-000000000001', 3, 5, 80),  ('00000000-0000-0001-0001-000000000001', 4, 5, 80),
('00000000-0000-0001-0001-000000000002', 1, 10, 100), ('00000000-0000-0001-0001-000000000002', 2, 10, 100),
('00000000-0000-0001-0001-000000000002', 3, 10, 100),
('00000000-0000-0001-0001-000000000003', 1, 12, 20), ('00000000-0000-0001-0001-000000000003', 2, 12, 20),
('00000000-0000-0001-0001-000000000003', 3, 12, 20),
('00000000-0000-0001-0001-000000000004', 1, 10, 60), ('00000000-0000-0001-0001-000000000004', 2, 10, 60),
('00000000-0000-0001-0001-000000000004', 3, 10, 60)
ON CONFLICT ON CONSTRAINT uq_exercise_set_order DO NOTHING;

-- Day 2: Overkropp
INSERT INTO program_exercises (id, program_day_id, exercise_id, order_index) VALUES
('00000000-0000-0001-0002-000000000001', '00000000-0000-0000-0000-000000000011', 'bench-press',     0),
('00000000-0000-0001-0002-000000000002', '00000000-0000-0000-0000-000000000011', 'overhead-press',  1),
('00000000-0000-0001-0002-000000000003', '00000000-0000-0000-0000-000000000011', 'dumbbell-row',    2),
('00000000-0000-0001-0002-000000000004', '00000000-0000-0000-0000-000000000011', 'bicep-curl',      3),
('00000000-0000-0001-0002-000000000005', '00000000-0000-0000-0000-000000000011', 'tricep-pushdown', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO program_exercise_sets (program_exercise_id, set_number, reps, weight_kg) VALUES
('00000000-0000-0001-0002-000000000001', 1, 5, 70), ('00000000-0000-0001-0002-000000000001', 2, 5, 70),
('00000000-0000-0001-0002-000000000001', 3, 5, 70), ('00000000-0000-0001-0002-000000000001', 4, 5, 70),
('00000000-0000-0001-0002-000000000002', 1, 8, 50), ('00000000-0000-0001-0002-000000000002', 2, 8, 50),
('00000000-0000-0001-0002-000000000002', 3, 8, 50),
('00000000-0000-0001-0002-000000000003', 1, 10, 30), ('00000000-0000-0001-0002-000000000003', 2, 10, 30),
('00000000-0000-0001-0002-000000000003', 3, 10, 30),
('00000000-0000-0001-0002-000000000004', 1, 12, 15), ('00000000-0000-0001-0002-000000000004', 2, 12, 15),
('00000000-0000-0001-0002-000000000004', 3, 12, 15),
('00000000-0000-0001-0002-000000000005', 1, 12, 20), ('00000000-0000-0001-0002-000000000005', 2, 12, 20),
('00000000-0000-0001-0002-000000000005', 3, 12, 20)
ON CONFLICT ON CONSTRAINT uq_exercise_set_order DO NOTHING;

-- Day 3: Helkropp
INSERT INTO program_exercises (id, program_day_id, exercise_id, order_index) VALUES
('00000000-0000-0001-0003-000000000001', '00000000-0000-0000-0000-000000000012', 'deadlift',     0),
('00000000-0000-0001-0003-000000000002', '00000000-0000-0000-0000-000000000012', 'pull-up',      1),
('00000000-0000-0001-0003-000000000003', '00000000-0000-0000-0000-000000000012', 'lat-pulldown', 2),
('00000000-0000-0001-0003-000000000004', '00000000-0000-0000-0000-000000000012', 'face-pull',    3),
('00000000-0000-0001-0003-000000000005', '00000000-0000-0000-0000-000000000012', 'dip',          4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO program_exercise_sets (program_exercise_id, set_number, reps, weight_kg) VALUES
('00000000-0000-0001-0003-000000000001', 1, 5, 100), ('00000000-0000-0001-0003-000000000001', 2, 5, 100),
('00000000-0000-0001-0003-000000000001', 3, 5, 100), ('00000000-0000-0001-0003-000000000001', 4, 5, 100),
('00000000-0000-0001-0003-000000000002', 1, 8, null), ('00000000-0000-0001-0003-000000000002', 2, 8, null),
('00000000-0000-0001-0003-000000000002', 3, 8, null),
('00000000-0000-0001-0003-000000000003', 1, 10, 60), ('00000000-0000-0001-0003-000000000003', 2, 10, 60),
('00000000-0000-0001-0003-000000000003', 3, 10, 60),
('00000000-0000-0001-0003-000000000004', 1, 15, 20), ('00000000-0000-0001-0003-000000000004', 2, 15, 20),
('00000000-0000-0001-0003-000000000004', 3, 15, 20),
('00000000-0000-0001-0003-000000000005', 1, 10, null), ('00000000-0000-0001-0003-000000000005', 2, 10, null),
('00000000-0000-0001-0003-000000000005', 3, 10, null)
ON CONFLICT ON CONSTRAINT uq_exercise_set_order DO NOTHING;
```

- [ ] **Step 3: Commit**

```bash
git add api/db/migrations/003_program_exercise_sets.sql api/db/seed_programs.sql
git commit -m "feat: add program_exercise_sets migration, update seed for new schema"
```

---

### Task 2: Update existing backend endpoints + tests

**Context:** After the migration, `program_exercises` has no `sets/reps/weight_kg` columns. `add_exercise_to_day` must be simplified and must insert a default set. `get_program` must embed a sets array in each exercise object.

**Files:**
- Modify: `api/app/routers/programs.py`
- Modify: `api/tests/test_add_exercise_router.py`
- Modify: `api/tests/test_programs_router.py`

- [ ] **Step 1: Rewrite test_add_exercise_router.py**

The old tests send `sets/reps/weight_kg` in the body and assert `data["sets"] == 3` (a number). After this change the body has only `exercise_id` and the response has `sets: [...]` (a list). Also, the mock needs 6 `side_effect` entries because there is now an extra INSERT for the default set.

Replace the entire file:

```python
import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_add_exercise_to_day_returns_new_exercise(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000002")
    day_id  = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000010")

    cur_prog       = AsyncMock(); cur_prog.fetchone       = AsyncMock(return_value=(prog_id,))
    cur_day        = AsyncMock(); cur_day.fetchone        = AsyncMock(return_value=(day_id,))
    cur_order      = AsyncMock(); cur_order.fetchone      = AsyncMock(return_value=(2,))
    cur_ex         = AsyncMock(); cur_ex.fetchone         = AsyncMock(return_value=("Squat", ["quads", "glutes"]))
    cur_insert_ex  = AsyncMock()
    cur_insert_set = AsyncMock()

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_day, cur_order, cur_ex, cur_insert_ex, cur_insert_set])
    conn.commit  = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/programs/{prog_id}/days/{day_id}/exercises",
                json={"exercise_id": "squat"},
            )

    assert response.status_code == 200
    data = response.json()
    assert data["exercise_id"] == "squat"
    assert data["order_index"] == 2
    assert len(data["sets"]) == 1
    assert data["sets"][0]["set_number"] == 1
    assert data["sets"][0]["reps"] == 10
    assert data["sets"][0]["weight_kg"] is None


@pytest.mark.asyncio
async def test_add_exercise_to_day_returns_404_for_invalid_day(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000002")
    day_id  = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000099")

    cur_prog = AsyncMock(); cur_prog.fetchone = AsyncMock(return_value=(prog_id,))
    cur_day  = AsyncMock(); cur_day.fetchone  = AsyncMock(return_value=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_day])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/programs/{prog_id}/days/{day_id}/exercises",
                json={"exercise_id": "squat"},
            )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_add_first_exercise_to_empty_day_gets_order_index_zero(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000002")
    day_id  = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000010")

    cur_prog       = AsyncMock(); cur_prog.fetchone       = AsyncMock(return_value=(prog_id,))
    cur_day        = AsyncMock(); cur_day.fetchone        = AsyncMock(return_value=(day_id,))
    cur_order      = AsyncMock(); cur_order.fetchone      = AsyncMock(return_value=(0,))
    cur_ex         = AsyncMock(); cur_ex.fetchone         = AsyncMock(return_value=("Squat", ["quads"]))
    cur_insert_ex  = AsyncMock()
    cur_insert_set = AsyncMock()

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_day, cur_order, cur_ex, cur_insert_ex, cur_insert_set])
    conn.commit  = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/programs/{prog_id}/days/{day_id}/exercises",
                json={"exercise_id": "squat"},
            )

    assert response.status_code == 200
    assert response.json()["order_index"] == 0


@pytest.mark.asyncio
async def test_add_exercise_to_day_returns_404_when_program_not_found(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000099")
    day_id  = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000010")

    cur_prog = AsyncMock(); cur_prog.fetchone = AsyncMock(return_value=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_prog)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/programs/{prog_id}/days/{day_id}/exercises",
                json={"exercise_id": "squat"},
            )

    assert response.status_code == 404
```

- [ ] **Step 2: Update test_get_program_detail_returns_days in test_programs_router.py**

In `test_programs_router.py`, the mock for `cur_days.fetchall` currently returns exercises with `sets`, `reps`, `weight_kg` keys. Update the exercise dict in the mock to use the new shape (sets array, no aggregate fields):

Find this block (lines 55-61):
```python
cur_days.fetchall = AsyncMock(return_value=[
    (
        day_id, 1, "Legs",
        [{"id": "cc", "exercise_id": "squat", "name": "Squat",
          "sets": 4, "reps": 5, "weight_kg": 80.0, "muscle_groups": ["quads"]}],
    )
])
```

Replace with:
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

Also add an assertion after the existing ones (line 76):
```python
assert data["days"][0]["exercises"][0]["sets"][0]["reps"] == 5
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api
python -m pytest tests/test_add_exercise_router.py tests/test_programs_router.py -v
```

Expected: failures because code still has old `AddExerciseBody` with `sets/reps/weight_kg` and `get_program` still returns old fields.

- [ ] **Step 4: Update AddExerciseBody and add_exercise_to_day in programs.py**

Replace the `AddExerciseBody` class:

```python
class AddExerciseBody(BaseModel):
    exercise_id: str = Field(min_length=1)
```

Replace the `add_exercise_to_day` function body (keep the decorator and signature):

```python
@router.post("/programs/{program_id}/days/{day_id}/exercises")
async def add_exercise_to_day(
    program_id: uuid.UUID, day_id: uuid.UUID, body: AddExerciseBody
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM programs WHERE id = %s AND user_id = %s",
                (program_id, TEST_USER_ID),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Program not found")

            cur = await conn.execute(
                "SELECT id FROM program_days WHERE id = %s AND program_id = %s",
                (day_id, program_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Day not found")

            cur = await conn.execute(
                "SELECT COALESCE(MAX(order_index) + 1, 0) FROM program_exercises WHERE program_day_id = %s",
                (day_id,),
            )
            order_index = (await cur.fetchone())[0]

            cur = await conn.execute(
                "SELECT name, muscle_groups FROM exercises WHERE id = %s",
                (body.exercise_id,),
            )
            ex = await cur.fetchone()
            if ex is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            exercise_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO program_exercises (id, program_day_id, exercise_id, order_index) "
                "VALUES (%s, %s, %s, %s)",
                (exercise_id, day_id, body.exercise_id, order_index),
            )

            set_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO program_exercise_sets (id, program_exercise_id, set_number, reps) "
                "VALUES (%s, %s, %s, %s)",
                (set_id, exercise_id, 1, 10),
            )
            await conn.commit()

        return {
            "id": exercise_id,
            "exercise_id": body.exercise_id,
            "name": ex[0],
            "muscle_groups": ex[1],
            "order_index": order_index,
            "sets": [{"id": set_id, "set_number": 1, "reps": 10, "weight_kg": None}],
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[add_exercise_to_day] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

- [ ] **Step 5: Update get_program to embed sets array**

In `get_program`, replace the inner SQL string (the multi-line string inside `conn.execute`) with:

```python
cur = await conn.execute(
    """
    SELECT pd.id, pd.day_number, pd.name,
           COALESCE(
               json_agg(
                   json_build_object(
                       'id',          pe.id::text,
                       'exercise_id', pe.exercise_id,
                       'name',        e.name,
                       'muscle_groups', e.muscle_groups,
                       'order_index', pe.order_index,
                       'sets', (
                           SELECT COALESCE(
                               json_agg(
                                   json_build_object(
                                       'id',         pes.id::text,
                                       'set_number', pes.set_number,
                                       'reps',       pes.reps,
                                       'weight_kg',  pes.weight_kg::float
                                   ) ORDER BY pes.set_number
                               ),
                               '[]'::json
                           )
                           FROM program_exercise_sets pes
                           WHERE pes.program_exercise_id = pe.id
                       )
                   ) ORDER BY pe.order_index
               ) FILTER (WHERE pe.id IS NOT NULL),
               '[]'
           ) AS exercises
    FROM program_days pd
    LEFT JOIN program_exercises pe ON pe.program_day_id = pd.id
    LEFT JOIN exercises e ON e.id = pe.exercise_id
    WHERE pd.program_id = %s
    GROUP BY pd.id, pd.day_number, pd.name
    ORDER BY pd.day_number
    """,
    (program_id,),
)
```

- [ ] **Step 6: Run tests**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api
python -m pytest tests/test_add_exercise_router.py tests/test_programs_router.py -v
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add api/app/routers/programs.py api/tests/test_add_exercise_router.py api/tests/test_programs_router.py
git commit -m "feat: update add-exercise and get-program for individual set schema"
```

---

### Task 3: New set CRUD endpoints + tests

**Context:** Four new endpoints added to `programs.py`. Each validates ownership with a single JOIN query. Tests use 2-3 mock `execute` side_effects per endpoint.

**Files:**
- Modify: `api/app/routers/programs.py`
- Create: `api/tests/test_sets_router.py`

- [ ] **Step 1: Write failing tests**

Create `api/tests/test_sets_router.py`:

```python
import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")

PROG_ID = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000002")
DAY_ID  = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000010")
EX_ID   = uuid.UUID("cccccccc-0000-0000-0000-000000000001")
SET_ID  = uuid.UUID("dddddddd-0000-0000-0000-000000000001")


def _cur(fetchone=None, fetchall=None):
    c = AsyncMock()
    c.fetchone = AsyncMock(return_value=fetchone)
    if fetchall is not None:
        c.fetchall = AsyncMock(return_value=fetchall)
    return c


# --- GET exercise detail ---

@pytest.mark.asyncio
async def test_get_exercise_detail_returns_exercise_with_sets(make_mock_get_conn):
    cur_ex   = _cur(fetchone=(EX_ID, "squat", "Squat", ["quads"], 0))
    cur_sets = _cur(fetchall=[(SET_ID, 1, 10, 80.0)])

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_ex, cur_sets])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}"
            )

    assert response.status_code == 200
    data = response.json()
    assert data["exercise_id"] == "squat"
    assert len(data["sets"]) == 1
    assert data["sets"][0]["set_number"] == 1
    assert data["sets"][0]["reps"] == 10
    assert data["sets"][0]["weight_kg"] == 80.0


@pytest.mark.asyncio
async def test_get_exercise_detail_returns_404_for_unknown_exercise(make_mock_get_conn):
    cur_ex = _cur(fetchone=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_ex)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}"
            )

    assert response.status_code == 404


# --- POST set ---

@pytest.mark.asyncio
async def test_add_set_returns_new_set(make_mock_get_conn):
    cur_ex      = _cur(fetchone=(EX_ID,))
    cur_set_num = _cur(fetchone=(3,))
    cur_insert  = AsyncMock()

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_ex, cur_set_num, cur_insert])
    conn.commit  = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}/sets",
                json={"reps": 10, "weight_kg": 80.0},
            )

    assert response.status_code == 200
    data = response.json()
    assert data["set_number"] == 3
    assert data["reps"] == 10
    assert data["weight_kg"] == 80.0


@pytest.mark.asyncio
async def test_add_set_to_empty_exercise_gets_set_number_one(make_mock_get_conn):
    cur_ex      = _cur(fetchone=(EX_ID,))
    cur_set_num = _cur(fetchone=(1,))
    cur_insert  = AsyncMock()

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_ex, cur_set_num, cur_insert])
    conn.commit  = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}/sets",
                json={"reps": 10},
            )

    assert response.status_code == 200
    assert response.json()["set_number"] == 1


# --- PATCH set ---

@pytest.mark.asyncio
async def test_update_set_returns_updated_values(make_mock_get_conn):
    cur_ex     = _cur(fetchone=(EX_ID,))
    cur_update = _cur(fetchone=(SET_ID, 1, 12, 82.5))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_ex, cur_update])
    conn.commit  = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.patch(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}/sets/{SET_ID}",
                json={"reps": 12, "weight_kg": 82.5},
            )

    assert response.status_code == 200
    data = response.json()
    assert data["reps"] == 12
    assert data["weight_kg"] == 82.5


@pytest.mark.asyncio
async def test_update_set_returns_404_for_unknown_set(make_mock_get_conn):
    cur_ex     = _cur(fetchone=(EX_ID,))
    cur_update = _cur(fetchone=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_ex, cur_update])
    conn.commit  = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.patch(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}/sets/{SET_ID}",
                json={"reps": 12, "weight_kg": 82.5},
            )

    assert response.status_code == 404


# --- DELETE set ---

@pytest.mark.asyncio
async def test_delete_set_returns_204(make_mock_get_conn):
    cur_ex     = _cur(fetchone=(EX_ID,))
    cur_delete = _cur(fetchone=(SET_ID,))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_ex, cur_delete])
    conn.commit  = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}/sets/{SET_ID}"
            )

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_set_returns_404_for_unknown_set(make_mock_get_conn):
    cur_ex     = _cur(fetchone=(EX_ID,))
    cur_delete = _cur(fetchone=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_ex, cur_delete])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}/sets/{SET_ID}"
            )

    assert response.status_code == 404
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api
python -m pytest tests/test_sets_router.py -v
```

Expected: all 8 tests FAIL with 404 (endpoints don't exist yet).

- [ ] **Step 3: Add new endpoints to programs.py**

Add these four functions after `add_exercise_to_day`. The exercise validation uses a single JOIN query that checks ownership in one round-trip.

```python
@router.get("/programs/{program_id}/days/{day_id}/exercises/{exercise_id}")
async def get_exercise_detail(
    program_id: uuid.UUID, day_id: uuid.UUID, exercise_id: uuid.UUID
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT pe.id, pe.exercise_id, e.name, e.muscle_groups, pe.order_index
                FROM program_exercises pe
                JOIN exercises e ON e.id = pe.exercise_id
                JOIN program_days pd ON pd.id = pe.program_day_id
                JOIN programs p ON p.id = pd.program_id
                WHERE pe.id = %s AND pd.id = %s AND p.id = %s AND p.user_id = %s
                """,
                (exercise_id, day_id, program_id, TEST_USER_ID),
            )
            row = await cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            cur = await conn.execute(
                "SELECT id, set_number, reps, weight_kg::float "
                "FROM program_exercise_sets WHERE program_exercise_id = %s ORDER BY set_number",
                (exercise_id,),
            )
            set_rows = await cur.fetchall()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[get_exercise_detail] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {
        "id": str(row[0]),
        "exercise_id": row[1],
        "name": row[2],
        "muscle_groups": row[3],
        "order_index": row[4],
        "sets": [
            {"id": str(s[0]), "set_number": s[1], "reps": s[2], "weight_kg": s[3]}
            for s in set_rows
        ],
    }


class AddSetBody(BaseModel):
    reps: int = Field(ge=1)
    weight_kg: float | None = None


@router.post("/programs/{program_id}/days/{day_id}/exercises/{exercise_id}/sets")
async def add_set(
    program_id: uuid.UUID, day_id: uuid.UUID, exercise_id: uuid.UUID, body: AddSetBody
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT pe.id FROM program_exercises pe
                JOIN program_days pd ON pd.id = pe.program_day_id
                JOIN programs p ON p.id = pd.program_id
                WHERE pe.id = %s AND pd.id = %s AND p.id = %s AND p.user_id = %s
                """,
                (exercise_id, day_id, program_id, TEST_USER_ID),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            cur = await conn.execute(
                "SELECT COALESCE(MAX(set_number) + 1, 1) "
                "FROM program_exercise_sets WHERE program_exercise_id = %s",
                (exercise_id,),
            )
            set_number = (await cur.fetchone())[0]

            set_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO program_exercise_sets "
                "(id, program_exercise_id, set_number, reps, weight_kg) "
                "VALUES (%s, %s, %s, %s, %s)",
                (set_id, exercise_id, set_number, body.reps, body.weight_kg),
            )
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[add_set] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {"id": set_id, "set_number": set_number, "reps": body.reps, "weight_kg": body.weight_kg}


class UpdateSetBody(BaseModel):
    reps: int = Field(ge=1)
    weight_kg: float | None = None


@router.patch("/programs/{program_id}/days/{day_id}/exercises/{exercise_id}/sets/{set_id}")
async def update_set(
    program_id: uuid.UUID,
    day_id: uuid.UUID,
    exercise_id: uuid.UUID,
    set_id: uuid.UUID,
    body: UpdateSetBody,
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT pe.id FROM program_exercises pe
                JOIN program_days pd ON pd.id = pe.program_day_id
                JOIN programs p ON p.id = pd.program_id
                WHERE pe.id = %s AND pd.id = %s AND p.id = %s AND p.user_id = %s
                """,
                (exercise_id, day_id, program_id, TEST_USER_ID),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            cur = await conn.execute(
                "UPDATE program_exercise_sets SET reps = %s, weight_kg = %s "
                "WHERE id = %s AND program_exercise_id = %s "
                "RETURNING id, set_number, reps, weight_kg::float",
                (body.reps, body.weight_kg, set_id, exercise_id),
            )
            row = await cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Set not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[update_set] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {"id": str(row[0]), "set_number": row[1], "reps": row[2], "weight_kg": row[3]}


@router.delete(
    "/programs/{program_id}/days/{day_id}/exercises/{exercise_id}/sets/{set_id}",
    status_code=204,
)
async def delete_set(
    program_id: uuid.UUID, day_id: uuid.UUID, exercise_id: uuid.UUID, set_id: uuid.UUID
) -> None:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT pe.id FROM program_exercises pe
                JOIN program_days pd ON pd.id = pe.program_day_id
                JOIN programs p ON p.id = pd.program_id
                WHERE pe.id = %s AND pd.id = %s AND p.id = %s AND p.user_id = %s
                """,
                (exercise_id, day_id, program_id, TEST_USER_ID),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            cur = await conn.execute(
                "DELETE FROM program_exercise_sets "
                "WHERE id = %s AND program_exercise_id = %s RETURNING id",
                (set_id, exercise_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Set not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[delete_set] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

- [ ] **Step 4: Run all tests**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api
python -m pytest tests/ -v
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add api/app/routers/programs.py api/tests/test_sets_router.py
git commit -m "feat: add GET exercise detail and set CRUD endpoints"
```

---

### Task 4: Frontend — api.ts

**Files:**
- Modify: `web/src/lib/api.ts`

- [ ] **Step 1: Update types and functions**

Replace the `ProgramExercise` type and the section below it. Also update `addExerciseToDay` and add new functions.

Replace from `export type ProgramExercise` through the end of `addExerciseToDay`:

```ts
export interface ProgramExerciseSet {
  id: string
  set_number: number
  reps: number
  weight_kg: number | null
}

export interface ProgramExercise {
  id: string
  exercise_id: string
  name: string
  muscle_groups: string[]
  order_index: number
  sets: ProgramExerciseSet[]
}

export type ProgramDay = {
  id: string
  day_number: number
  name: string
  exercises: ProgramExercise[]
}

export type Program = {
  id: string
  name: string
  is_active: boolean
  days_count?: number
  days?: ProgramDay[]
}

export type Exercise = {
  id: string
  name: string
  muscle_groups: string[]
  equipment: string[]
  difficulty: string
}
```

Replace `addExerciseToDay`:

```ts
export async function addExerciseToDay(
  programId: string,
  dayId: string,
  body: { exercise_id: string }
): Promise<ProgramExercise> {
  const url = `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramExercise>
}
```

Add after `addExerciseToDay`:

```ts
export async function getExerciseDetail(
  programId: string,
  dayId: string,
  exerciseId: string
): Promise<ProgramExercise> {
  const url = `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramExercise>
}

export async function addSet(
  programId: string,
  dayId: string,
  exerciseId: string,
  body: { reps: number; weight_kg?: number }
): Promise<ProgramExerciseSet> {
  const url = `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}/sets`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramExerciseSet>
}

export async function updateSet(
  programId: string,
  dayId: string,
  exerciseId: string,
  setId: string,
  body: { reps: number; weight_kg: number | null }
): Promise<ProgramExerciseSet> {
  const url = `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}/sets/${setId}`
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramExerciseSet>
}

export async function deleteSet(
  programId: string,
  dayId: string,
  exerciseId: string,
  setId: string
): Promise<void> {
  const url = `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}/sets/${setId}`
  const res = await fetch(url, { method: "DELETE" })
  if (!res.ok) throw new Error(`API ${res.status}`)
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npx tsc --noEmit
```

Expected: type errors in `ExerciseLibrary.tsx` (old body shape) and `ProgramDetail.tsx` (old exercise shape). These are fixed in later tasks. Verify no errors in `api.ts` itself.

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/api.ts
git commit -m "feat: update api.ts types for sets array and add set CRUD functions"
```

---

### Task 5: Frontend — ExerciseLibrary.tsx

**Files:**
- Modify: `web/src/components/program/ExerciseLibrary.tsx`

- [ ] **Step 1: Rewrite ExerciseLibrary.tsx**

Remove all inline-expand state and logic. Replace with direct one-tap add.

```tsx
"use client"

import { useEffect, useState } from "react"
import { getExercises, addExerciseToDay, type Exercise } from "@/lib/api"

const MUSCLE_GROUPS: { id: string; label: string }[] = [
  { id: "quads", label: "Ben" },
  { id: "chest", label: "Bryst" },
  { id: "lats", label: "Lats" },
  { id: "back", label: "Rygg" },
  { id: "front_deltoid", label: "Skuldre" },
  { id: "rear_deltoid", label: "Bakskuldre" },
  { id: "biceps", label: "Biceps" },
  { id: "triceps", label: "Triceps" },
  { id: "hamstrings", label: "Hamstrings" },
  { id: "glutes", label: "Glutes" },
]

interface Props {
  programId: string
  dayId: string
  onClose: () => void
  onAdd: () => void
}

export default function ExerciseLibrary({ programId, dayId, onClose, onAdd }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | undefined>()
  const [search, setSearch] = useState("")
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getExercises(filter)
      .then(setExercises)
      .catch((err) => console.error("Failed to fetch exercises:", err))
      .finally(() => setLoading(false))
  }, [filter])

  const visible = search
    ? exercises.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
    : exercises

  async function handleAdd(exerciseId: string) {
    setAddingId(exerciseId)
    try {
      await addExerciseToDay(programId, dayId, { exercise_id: exerciseId })
      onAdd()
    } catch (err) {
      console.error("Failed to add exercise:", err)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div>
      <div className="p-4 border-b flex items-center gap-3">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">←</button>
        <h2 className="font-bold text-lg">Øvelsesbibliotek</h2>
      </div>

      <div className="px-4 pt-3">
        <input
          type="text"
          placeholder="Søk øvelse..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-muted rounded-md px-3 py-2 text-sm outline-none"
        />
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        <button
          onClick={() => setFilter(undefined)}
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            !filter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          Alle
        </button>
        {MUSCLE_GROUPS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(filter === id ? undefined : id)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 px-4 pb-4">
        {loading && <p className="text-muted-foreground text-sm">Laster øvelser...</p>}
        {!loading &&
          visible.map((ex) => (
            <div key={ex.id} className="bg-card border rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{ex.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {ex.muscle_groups.join(", ")} · {ex.difficulty}
                </p>
              </div>
              <button
                onClick={() => handleAdd(ex.id)}
                disabled={addingId === ex.id}
                className="text-primary font-bold text-lg px-2 disabled:opacity-40"
                aria-label={`Legg til ${ex.name}`}
              >
                {addingId === ex.id ? "…" : "+"}
              </button>
            </div>
          ))}
        {!loading && visible.length === 0 && (
          <p className="text-muted-foreground text-sm">Ingen øvelser funnet.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npx tsc --noEmit
```

Expected: remaining type errors only in `ProgramDetail.tsx`.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/program/ExerciseLibrary.tsx
git commit -m "feat: simplify ExerciseLibrary to direct one-tap add"
```

---

### Task 6: Frontend — ExerciseDetail + ProgramDetail

**Files:**
- Create: `web/src/components/program/ExerciseDetail.tsx`
- Modify: `web/src/components/program/ProgramDetail.tsx`

- [ ] **Step 1: Create ExerciseDetail.tsx**

```tsx
"use client"

import { useEffect, useState } from "react"
import { getExerciseDetail, addSet, updateSet, type ProgramExerciseSet } from "@/lib/api"

interface SetRowProps {
  set: ProgramExerciseSet
  onUpdate: (reps: number, weight_kg: number | null) => void
}

function SetRow({ set, onUpdate }: SetRowProps) {
  const [reps, setReps] = useState(String(set.reps))
  const [weight, setWeight] = useState(set.weight_kg != null ? String(set.weight_kg) : "")

  function handleBlur() {
    const r = parseInt(reps) || set.reps
    const w = weight ? parseFloat(weight) : null
    onUpdate(r, w)
  }

  return (
    <div className="grid grid-cols-4 gap-2 items-center py-2.5 border-b">
      <span className="text-sm font-medium text-center">{set.set_number}</span>
      <span className="text-sm text-muted-foreground text-center">–</span>
      <input
        type="number"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={handleBlur}
        placeholder="–"
        className="bg-muted rounded px-2 py-1 text-sm outline-none w-full text-center"
      />
      <input
        type="number"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={handleBlur}
        className="bg-muted rounded px-2 py-1 text-sm outline-none w-full text-center"
      />
    </div>
  )
}

interface Props {
  programId: string
  dayId: string
  exerciseId: string
  exerciseName: string
  onBack: () => void
}

export default function ExerciseDetail({ programId, dayId, exerciseId, exerciseName, onBack }: Props) {
  const [sets, setSets] = useState<ProgramExerciseSet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getExerciseDetail(programId, dayId, exerciseId)
      .then((ex) => setSets(ex.sets))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [programId, dayId, exerciseId])

  async function handleAddSet() {
    const last = sets[sets.length - 1]
    try {
      const newSet = await addSet(programId, dayId, exerciseId, {
        reps: last?.reps ?? 10,
        weight_kg: last?.weight_kg ?? undefined,
      })
      setSets((prev) => [...prev, newSet])
    } catch (err) {
      console.error("Failed to add set:", err)
    }
  }

  async function handleUpdate(setId: string, reps: number, weight_kg: number | null) {
    try {
      const updated = await updateSet(programId, dayId, exerciseId, setId, { reps, weight_kg })
      setSets((prev) => prev.map((s) => (s.id === setId ? updated : s)))
    } catch (err) {
      console.error("Failed to update set:", err)
    }
  }

  return (
    <div>
      <div className="p-4 border-b flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-lg">←</button>
        <h2 className="font-bold text-lg">{exerciseName}</h2>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm p-4">Laster...</p>
      ) : (
        <div className="px-4 pt-3">
          <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground font-medium pb-2 border-b uppercase tracking-wide">
            <span className="text-center">Set</span>
            <span className="text-center">Forrige</span>
            <span className="text-center">Kg</span>
            <span className="text-center">Reps</span>
          </div>

          {sets.map((s) => (
            <SetRow
              key={s.id}
              set={s}
              onUpdate={(reps, weight_kg) => handleUpdate(s.id, reps, weight_kg)}
            />
          ))}

          {sets.length === 0 && (
            <p className="text-muted-foreground text-sm py-4 text-center">Ingen sett ennå.</p>
          )}

          <button
            onClick={handleAddSet}
            className="mt-4 w-full py-2.5 text-sm text-muted-foreground border border-dashed rounded-lg hover:bg-accent transition-colors"
          >
            + Legg til sett
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Rewrite ProgramDetail.tsx**

Key changes: add `selectedExercise` state, update exercise card to show `setSummary()`, render `ExerciseDetail` when selected.

```tsx
"use client"

import { useEffect, useState } from "react"
import { getProgram, type Program, type ProgramDay, type ProgramExerciseSet } from "@/lib/api"
import ExerciseLibrary from "./ExerciseLibrary"
import ExerciseDetail from "./ExerciseDetail"

const MUSCLE_COLORS: Record<string, string> = {
  quads: "#1e3a5f",
  glutes: "#1e3a5f",
  hamstrings: "#1e3a5f",
  chest: "#3a1e1e",
  triceps: "#3a1e1e",
  upper_chest: "#3a1e1e",
  lats: "#1e3a2a",
  rhomboids: "#1e3a2a",
  back: "#1e3a2a",
  traps: "#1e3a2a",
  front_deltoid: "#3a2a1e",
  rear_deltoid: "#3a2a1e",
  rotator_cuff: "#3a2a1e",
  biceps: "#2a1e3a",
  lower_back: "#1e2a3a",
}

function muscleColor(groups: string[]): string {
  for (const g of groups) {
    if (MUSCLE_COLORS[g]) return MUSCLE_COLORS[g]
  }
  return "#1a1a2e"
}

function setSummary(sets: ProgramExerciseSet[]): string {
  if (sets.length === 0) return "Ingen sett"
  const allSameReps   = sets.every((s) => s.reps === sets[0].reps)
  const allSameWeight = sets.every((s) => s.weight_kg === sets[0].weight_kg)
  if (allSameReps && allSameWeight) {
    const w = sets[0].weight_kg != null ? ` · ${sets[0].weight_kg} kg` : ""
    return `${sets.length} sett · ${sets[0].reps} reps${w}`
  }
  return `${sets.length} sett`
}

interface Props {
  programId: string
  onBack: () => void
}

export default function ProgramDetail({ programId, onBack }: Props) {
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(0)
  const [libraryDayId, setLibraryDayId] = useState<string | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<{
    id: string; dayId: string; name: string
  } | null>(null)

  useEffect(() => {
    getProgram(programId)
      .then(setProgram)
      .catch((err) => console.error("Failed to fetch program:", err))
      .finally(() => setLoading(false))
  }, [programId])

  useEffect(() => {
    setActiveDay(0)
  }, [programId])

  if (loading) return <p className="text-muted-foreground text-sm p-4">Laster program...</p>
  if (!program) return <p className="text-muted-foreground text-sm p-4">Program ikke funnet.</p>

  const days = program.days ?? []
  const day: ProgramDay | undefined = days[activeDay]

  if (selectedExercise) {
    return (
      <ExerciseDetail
        programId={programId}
        dayId={selectedExercise.dayId}
        exerciseId={selectedExercise.id}
        exerciseName={selectedExercise.name}
        onBack={() => setSelectedExercise(null)}
      />
    )
  }

  if (libraryDayId) {
    return (
      <ExerciseLibrary
        programId={programId}
        dayId={libraryDayId}
        onClose={() => setLibraryDayId(null)}
        onAdd={() => {
          setLibraryDayId(null)
          getProgram(programId).then(setProgram).catch(console.error)
        }}
      />
    )
  }

  return (
    <div>
      <div className="p-4 border-b flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-lg">←</button>
        <h2 className="font-bold text-lg">{program.name}</h2>
        {program.is_active && (
          <span className="text-xs text-green-500 font-medium ml-auto">Aktiv</span>
        )}
      </div>

      <div className="flex gap-2 p-4 overflow-x-auto">
        {days.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setActiveDay(i)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              i === activeDay
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            Dag {d.day_number}: {d.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 px-4">
        {day?.exercises.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setSelectedExercise({ id: ex.id, dayId: day.id, name: ex.name })}
            className="bg-card border rounded-lg p-3 flex gap-3 items-center text-left w-full hover:bg-accent transition-colors"
          >
            <div
              className="w-8 h-8 rounded-md flex-shrink-0"
              style={{ backgroundColor: muscleColor(ex.muscle_groups) }}
            />
            <div>
              <p className="font-medium text-sm">{ex.name}</p>
              <p className="text-xs text-muted-foreground">{setSummary(ex.sets)}</p>
            </div>
          </button>
        ))}

        {day && (
          <button
            onClick={() => setLibraryDayId(day.id)}
            className="mt-2 border border-dashed rounded-lg p-3 text-sm text-muted-foreground hover:bg-accent transition-colors text-center"
          >
            + Legg til øvelse
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/program/ExerciseDetail.tsx web/src/components/program/ProgramDetail.tsx
git commit -m "feat: add ExerciseDetail set management view, update ProgramDetail"
```
