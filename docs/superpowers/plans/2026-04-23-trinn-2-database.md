# Trinn 2: Database + Treningslogg Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Postgres persistence via Supabase so the coach remembers workout history across sessions, and display logged workouts in the frontend.

**Architecture:** psycopg3 async connection pool in `api/app/db.py`. Three new async Claude tools (log_workout, get_user_history, suggest_progression) talk to the DB. A new GET /api/workouts endpoint feeds the WorkoutLog frontend component. Hardcoded test user UUID until auth (Trinn 7).

**Tech Stack:** psycopg[binary] 3.x, psycopg-pool 3.x, pytest-asyncio, Next.js 15, Tailwind 4, shadcn/ui

---

## File Map

**Create:**
- `api/app/db.py` — async connection pool, `get_conn()` context manager
- `api/db/migrations/001_initial.sql` — creates users, exercises, workouts, workout_sets tables
- `api/db/__init__.py` — empty, makes db a package
- `api/db/seed.py` — inserts 15 exercises + test user; run once after migration
- `api/app/routers/workouts.py` — GET /api/workouts endpoint
- `api/tests/test_workout_tools.py` — tests for 3 new async tools
- `api/tests/test_workouts_router.py` — tests for GET /api/workouts
- `web/src/components/workout/WorkoutLog.tsx` — workout history component

**Modify:**
- `api/requirements.txt` — add psycopg[binary], psycopg-pool
- `api/app/tools/handlers.py` — add 3 async tools, make handle_tool async
- `api/app/tools/definitions.py` — add 3 new tool definitions
- `api/app/services/coach.py` — await handle_tool
- `api/app/main.py` — include workouts router
- `web/src/lib/api.ts` — add Workout type + getWorkouts()
- `web/src/app/(tabs)/log/page.tsx` — replace placeholder with WorkoutLog

---

## Task 1: Install psycopg3 and create async connection pool

**Files:**
- Modify: `api/requirements.txt`
- Create: `api/app/db.py`

- [ ] **Step 1: Add psycopg dependencies to requirements.txt**

Open `api/requirements.txt` and add the two new lines so the file looks like:

```
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
anthropic>=0.40.0
python-dotenv>=1.0.0
httpx>=0.27.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
psycopg[binary]>=3.1.0
psycopg-pool>=3.1.0
```

- [ ] **Step 2: Install new dependencies**

```bash
cd api && source .venv/bin/activate && pip install "psycopg[binary]>=3.1.0" "psycopg-pool>=3.1.0"
```

Expected: both packages install without error. Note: `psycopg` is the psycopg3 package — import name is `psycopg`, not `psycopg3`.

- [ ] **Step 3: Create api/app/db.py**

```python
import os
from contextlib import asynccontextmanager
from psycopg_pool import AsyncConnectionPool

_pool: AsyncConnectionPool | None = None


async def _get_pool() -> AsyncConnectionPool:
    global _pool
    if _pool is None:
        _pool = AsyncConnectionPool(os.environ["DATABASE_URL"], open=False)
        await _pool.open()
    return _pool


@asynccontextmanager
async def get_conn():
    pool = await _get_pool()
    async with pool.connection() as conn:
        yield conn
```

- [ ] **Step 4: Verify import works**

```bash
cd api && source .venv/bin/activate && python -c "from app.db import get_conn; print('ok')"
```

Expected: `ok` printed with no errors.

- [ ] **Step 5: Commit**

```bash
cd api && git add requirements.txt app/db.py && git commit -m "feat: add psycopg3 async connection pool"
```

---

## Task 2: SQL migration

**Files:**
- Create: `api/db/__init__.py`
- Create: `api/db/migrations/001_initial.sql`

This migration runs **manually** in the Supabase SQL Editor — it is not automated.

- [ ] **Step 1: Create db package**

Create `api/db/__init__.py` as an empty file.

Create directory `api/db/migrations/`.

- [ ] **Step 2: Write the migration SQL**

Create `api/db/migrations/001_initial.sql`:

```sql
-- Users
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT UNIQUE NOT NULL,
    name        TEXT,
    locale      TEXT NOT NULL DEFAULT 'no',
    persona_mode TEXT NOT NULL DEFAULT 'friend',
    goals       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercises (seeded from exercises.json)
CREATE TABLE IF NOT EXISTS exercises (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    muscle_groups TEXT[] NOT NULL,
    equipment     TEXT[] NOT NULL,
    difficulty    TEXT NOT NULL,
    instructions  TEXT,
    source        TEXT
);

-- Workout sessions
CREATE TABLE IF NOT EXISTS workouts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id),
    started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    notes        TEXT,
    rpe          INTEGER CHECK (rpe BETWEEN 1 AND 10)
);

-- Individual sets within a workout
CREATE TABLE IF NOT EXISTS workout_sets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id  UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL REFERENCES exercises(id),
    set_number  INTEGER NOT NULL,
    reps        INTEGER,
    weight_kg   NUMERIC(6, 2),
    rpe         INTEGER CHECK (rpe BETWEEN 1 AND 10)
);
```

- [ ] **Step 3: Run migration in Supabase**

Go to your Supabase project → SQL Editor → paste the entire contents of `001_initial.sql` → Run.

Expected: All 4 tables created successfully (green checkmark in Supabase). You can verify by going to Table Editor and seeing users, exercises, workouts, workout_sets.

- [ ] **Step 4: Commit**

```bash
cd api && git add db/ && git commit -m "feat: add initial SQL migration for workout tables"
```

---

## Task 3: Seed script

**Files:**
- Create: `api/db/seed.py`

- [ ] **Step 1: Write the seed script**

Create `api/db/seed.py`:

```python
import asyncio
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

import psycopg

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
EXERCISES_PATH = Path(__file__).parent.parent / "app" / "data" / "exercises.json"


async def seed() -> None:
    conn_str = os.environ["DATABASE_URL"]
    async with await psycopg.AsyncConnection.connect(conn_str) as conn:
        await conn.execute(
            """
            INSERT INTO users (id, email, name)
            VALUES (%s, %s, %s)
            ON CONFLICT DO NOTHING
            """,
            (TEST_USER_ID, "test@aicoach.no", "Test User"),
        )

        with open(EXERCISES_PATH) as f:
            exercises = json.load(f)

        for ex in exercises:
            await conn.execute(
                """
                INSERT INTO exercises (id, name, muscle_groups, equipment, difficulty, instructions)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
                """,
                (
                    ex["id"],
                    ex["name"],
                    ex["muscle_groups"],
                    ex.get("equipment", []),
                    ex["difficulty"],
                    ex.get("instructions"),
                ),
            )

        await conn.commit()
        print(f"Seeded {len(exercises)} exercises and test user {TEST_USER_ID}")


if __name__ == "__main__":
    asyncio.run(seed())
```

- [ ] **Step 2: Run the seed script**

```bash
cd api && source .venv/bin/activate && python db/seed.py
```

Expected output:
```
Seeded 15 exercises and test user 00000000-0000-0000-0000-000000000001
```

Verify in Supabase Table Editor → exercises table shows 15 rows, users table shows 1 row.

- [ ] **Step 3: Commit**

```bash
cd api && git add db/seed.py && git commit -m "feat: add seed script for exercises and test user"
```

---

## Task 4: Async workout tools in handlers.py

**Files:**
- Modify: `api/app/tools/handlers.py`
- Create: `api/tests/test_workout_tools.py`

The new tools need to be async (they `await` DB calls). `handle_tool` must also become async. The existing sync tools (get_exercise_info, search_exercises, create_program) stay sync — handle_tool just calls them without await.

- [ ] **Step 1: Write failing tests**

Create `api/tests/test_workout_tools.py`:

```python
import pytest
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone


def make_mock_get_conn(conn):
    @asynccontextmanager
    async def _get_conn():
        yield conn
    return _get_conn


@pytest.fixture
def mock_conn():
    conn = AsyncMock()
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[])
    conn.execute = AsyncMock(return_value=cur)
    conn.commit = AsyncMock()
    return conn


@pytest.mark.asyncio
async def test_log_workout_returns_workout_id(mock_conn):
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.tools.handlers import log_workout
        result = await log_workout(
            exercises=[{"exercise_id": "squat", "sets": [{"reps": 5, "weight_kg": 80}]}]
        )
    assert "workout_id" in result
    assert result["message"] == "Workout logged successfully"


@pytest.mark.asyncio
async def test_log_workout_calls_commit(mock_conn):
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.tools.handlers import log_workout
        await log_workout(exercises=[{"exercise_id": "bench-press", "sets": [{"reps": 8, "weight_kg": 60}]}])
    mock_conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_get_user_history_returns_list(mock_conn):
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[])
    mock_conn.execute = AsyncMock(return_value=mock_cur)
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.tools.handlers import get_user_history
        result = await get_user_history()
    assert isinstance(result, list)


@pytest.mark.asyncio
async def test_suggest_progression_no_history(mock_conn):
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[])
    mock_conn.execute = AsyncMock(return_value=mock_cur)
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.tools.handlers import suggest_progression
        result = await suggest_progression("squat")
    assert result["suggested_weight_kg"] is None
    assert "No history" in result["suggestion"]


@pytest.mark.asyncio
async def test_suggest_progression_low_rpe_adds_2_5kg(mock_conn):
    dt = datetime(2026, 4, 23, tzinfo=timezone.utc)
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[(dt, 80.0, 6), (dt, 80.0, 7)])
    mock_conn.execute = AsyncMock(return_value=mock_cur)
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.tools.handlers import suggest_progression
        result = await suggest_progression("squat")
    assert result["suggested_weight_kg"] == 82.5


@pytest.mark.asyncio
async def test_suggest_progression_high_rpe_keeps_weight(mock_conn):
    dt = datetime(2026, 4, 23, tzinfo=timezone.utc)
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[(dt, 80.0, 8), (dt, 80.0, 9)])
    mock_conn.execute = AsyncMock(return_value=mock_cur)
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.tools.handlers import suggest_progression
        result = await suggest_progression("squat")
    assert result["suggested_weight_kg"] == 80.0


@pytest.mark.asyncio
async def test_handle_tool_log_workout_is_awaitable(mock_conn):
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.tools.handlers import handle_tool
        result = await handle_tool(
            "log_workout",
            {"exercises": [{"exercise_id": "squat", "sets": [{"reps": 5, "weight_kg": 80}]}]},
        )
    assert "workout_id" in result
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd api && source .venv/bin/activate && python -m pytest tests/test_workout_tools.py -v 2>&1 | head -30
```

Expected: ImportError or AttributeError — the new functions don't exist yet.

- [ ] **Step 3: Implement the 3 new tools in handlers.py**

Replace the entire `api/app/tools/handlers.py` with:

```python
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.db import get_conn

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"

_exercises: list[dict] | None = None


def _load_exercises() -> list[dict]:
    global _exercises
    if _exercises is None:
        data_path = Path(__file__).parent.parent / "data" / "exercises.json"
        with open(data_path) as f:
            _exercises = json.load(f)
    return _exercises


def get_exercise_info(exercise_id: str) -> dict:
    for ex in _load_exercises():
        if ex["id"] == exercise_id:
            return ex
    return {"error": f"Exercise '{exercise_id}' not found"}


def search_exercises(
    muscle_group: str | None = None,
    equipment: str | None = None,
    difficulty: str | None = None,
) -> list[dict]:
    results = _load_exercises()
    if muscle_group:
        results = [e for e in results if any(muscle_group.lower() in mg.lower() for mg in e["muscle_groups"])]
    if equipment:
        results = [e for e in results if any(equipment.lower() in eq.lower() for eq in e["equipment"])]
    if difficulty:
        results = [e for e in results if e["difficulty"] == difficulty]
    return [{"id": e["id"], "name": e["name"], "muscle_groups": e["muscle_groups"], "difficulty": e["difficulty"]} for e in results]


def create_program(goal: str, days_per_week: int, equipment: str, experience_level: str) -> dict:
    return {
        "name": f"{days_per_week}-day {goal} program",
        "goal": goal,
        "days_per_week": days_per_week,
        "equipment": equipment,
        "experience_level": experience_level,
        "note": "Program structure created. Describing exercises for each day now.",
    }


async def log_workout(
    exercises: list,
    notes: str | None = None,
    rpe: int | None = None,
) -> dict:
    workout_id = str(uuid.uuid4())
    async with get_conn() as conn:
        await conn.execute(
            "INSERT INTO workouts (id, user_id, completed_at, notes, rpe) VALUES (%s, %s, %s, %s, %s)",
            (workout_id, TEST_USER_ID, datetime.now(timezone.utc), notes, rpe),
        )
        for exercise in exercises:
            for i, s in enumerate(exercise["sets"], start=1):
                await conn.execute(
                    "INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg, rpe) "
                    "VALUES (%s, %s, %s, %s, %s, %s)",
                    (workout_id, exercise["exercise_id"], i, s["reps"], s.get("weight_kg"), s.get("rpe")),
                )
        await conn.commit()
    return {"workout_id": workout_id, "message": "Workout logged successfully"}


async def get_user_history(limit: int = 5) -> list:
    async with get_conn() as conn:
        cur = await conn.execute(
            """
            SELECT w.id, w.completed_at, w.notes, w.rpe,
                   json_agg(
                       json_build_object(
                           'exercise_id', ws.exercise_id,
                           'set_number', ws.set_number,
                           'reps', ws.reps,
                           'weight_kg', ws.weight_kg::float,
                           'rpe', ws.rpe
                       ) ORDER BY ws.exercise_id, ws.set_number
                   ) AS sets
            FROM workouts w
            JOIN workout_sets ws ON ws.workout_id = w.id
            WHERE w.user_id = %s AND w.completed_at IS NOT NULL
            GROUP BY w.id, w.completed_at, w.notes, w.rpe
            ORDER BY w.completed_at DESC
            LIMIT %s
            """,
            (TEST_USER_ID, limit),
        )
        rows = await cur.fetchall()
    return [
        {
            "workout_id": str(r[0]),
            "date": r[1].isoformat() if r[1] else None,
            "notes": r[2],
            "rpe": r[3],
            "sets": r[4] or [],
        }
        for r in rows
    ]


async def suggest_progression(exercise_id: str) -> dict:
    async with get_conn() as conn:
        cur = await conn.execute(
            """
            SELECT w.completed_at, ws.weight_kg, ws.rpe
            FROM workout_sets ws
            JOIN workouts w ON w.id = ws.workout_id
            WHERE ws.exercise_id = %s AND w.user_id = %s AND w.completed_at IS NOT NULL
            ORDER BY w.completed_at DESC
            LIMIT 10
            """,
            (exercise_id, TEST_USER_ID),
        )
        rows = await cur.fetchall()

    if not rows:
        return {
            "exercise_id": exercise_id,
            "suggestion": "No history found. Start with a comfortable weight for 10 reps.",
            "suggested_weight_kg": None,
        }

    last_date = rows[0][0]
    last_rows = [r for r in rows if r[0] == last_date]
    weight = max((r[1] for r in last_rows if r[1] is not None), default=None)
    rpe_vals = [r[2] for r in last_rows if r[2] is not None]
    avg_rpe = sum(rpe_vals) / len(rpe_vals) if rpe_vals else None

    if weight is None:
        return {
            "exercise_id": exercise_id,
            "suggestion": "No weight logged yet. Log a session first.",
            "suggested_weight_kg": None,
        }

    weight = float(weight)

    if avg_rpe is None or avg_rpe >= 10:
        return {
            "exercise_id": exercise_id,
            "suggestion": f"Last session: {weight}kg. Keep the same weight.",
            "suggested_weight_kg": weight,
        }
    elif avg_rpe <= 7:
        new_weight = weight + 2.5
        return {
            "exercise_id": exercise_id,
            "suggestion": f"Last: {weight}kg at RPE {avg_rpe:.0f}. Try {new_weight}kg today!",
            "suggested_weight_kg": new_weight,
        }
    else:
        return {
            "exercise_id": exercise_id,
            "suggestion": f"Last: {weight}kg at RPE {avg_rpe:.0f}. Keep same weight.",
            "suggested_weight_kg": weight,
        }


async def handle_tool(name: str, inputs: dict) -> dict | list:
    if name == "get_exercise_info":
        return get_exercise_info(**inputs)
    if name == "search_exercises":
        return search_exercises(**inputs)
    if name == "create_program":
        return create_program(**inputs)
    if name == "log_workout":
        return await log_workout(**inputs)
    if name == "get_user_history":
        return await get_user_history(**inputs)
    if name == "suggest_progression":
        return await suggest_progression(**inputs)
    return {"error": f"Unknown tool: {name}"}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd api && source .venv/bin/activate && python -m pytest tests/test_workout_tools.py -v
```

Expected: All 8 tests PASS.

- [ ] **Step 5: Verify existing tests still pass**

```bash
cd api && source .venv/bin/activate && python -m pytest tests/test_tools.py -v
```

Expected: All 9 existing tests PASS. (The sync functions were not changed.)

- [ ] **Step 6: Commit**

```bash
cd api && git add app/tools/handlers.py tests/test_workout_tools.py && git commit -m "feat: add async workout tools (log_workout, get_user_history, suggest_progression)"
```

---

## Task 5: Make coach.py await handle_tool + add tool definitions

**Files:**
- Modify: `api/app/services/coach.py`
- Modify: `api/app/tools/definitions.py`

`handle_tool` is now async. The one call site in `coach.py` needs `await`.

- [ ] **Step 1: Update coach.py to await handle_tool**

In `api/app/services/coach.py`, find line 67:

```python
                    result = handle_tool(block.name, block.input)
```

Change it to:

```python
                    result = await handle_tool(block.name, block.input)
```

That is the only change in coach.py.

- [ ] **Step 2: Add 3 new tool definitions to definitions.py**

In `api/app/tools/definitions.py`, append to the `TOOL_DEFINITIONS` list (before the closing `]`):

```python
    {
        "name": "log_workout",
        "description": "Log a completed workout session with exercises, sets, reps, and weight. Call this when the user has finished training or wants to record what they did.",
        "input_schema": {
            "type": "object",
            "properties": {
                "exercises": {
                    "type": "array",
                    "description": "List of exercises done in this session",
                    "items": {
                        "type": "object",
                        "properties": {
                            "exercise_id": {"type": "string", "description": "Exercise ID, e.g. 'squat', 'bench-press'"},
                            "sets": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "reps": {"type": "integer"},
                                        "weight_kg": {"type": "number"},
                                        "rpe": {"type": "integer", "minimum": 1, "maximum": 10},
                                    },
                                    "required": ["reps"],
                                },
                            },
                        },
                        "required": ["exercise_id", "sets"],
                    },
                },
                "notes": {"type": "string", "description": "Optional notes about the session"},
                "rpe": {"type": "integer", "minimum": 1, "maximum": 10, "description": "Overall session RPE (1-10)"},
            },
            "required": ["exercises"],
        },
    },
    {
        "name": "get_user_history",
        "description": "Get the user's recent workout history. Use this to see what they've done before giving advice or checking progress.",
        "input_schema": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "description": "Number of recent workouts to fetch (default 5)", "default": 5},
            },
        },
    },
    {
        "name": "suggest_progression",
        "description": "Suggest the weight to use for a specific exercise based on the user's recent RPE. Returns a concrete recommendation.",
        "input_schema": {
            "type": "object",
            "properties": {
                "exercise_id": {"type": "string", "description": "Exercise ID, e.g. 'squat', 'bench-press'"},
            },
            "required": ["exercise_id"],
        },
    },
```

- [ ] **Step 3: Verify the API starts without errors**

```bash
cd api && source .venv/bin/activate && uvicorn app.main:app --port 8000 &
sleep 2
curl -s http://localhost:8000/ | python -m json.tool
kill %1
```

Expected: `{"status": "ok"}` printed, no import errors.

- [ ] **Step 4: Commit**

```bash
cd api && git add app/services/coach.py app/tools/definitions.py && git commit -m "feat: await handle_tool in coach, add 3 new tool definitions"
```

---

## Task 6: GET /api/workouts endpoint

**Files:**
- Create: `api/app/routers/workouts.py`
- Modify: `api/app/main.py`
- Create: `api/tests/test_workouts_router.py`

- [ ] **Step 1: Write failing tests**

Create `api/tests/test_workouts_router.py`:

```python
import pytest
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport


def make_mock_get_conn(conn):
    @asynccontextmanager
    async def _get_conn():
        yield conn
    return _get_conn


@pytest.fixture
def empty_conn():
    conn = AsyncMock()
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[])
    conn.execute = AsyncMock(return_value=cur)
    return conn


@pytest.fixture
def conn_with_workout():
    conn = AsyncMock()
    cur = AsyncMock()
    dt = datetime(2026, 4, 23, 10, 0, 0, tzinfo=timezone.utc)
    cur.fetchall = AsyncMock(return_value=[
        (
            "aaaaaaaa-0000-0000-0000-000000000001",
            dt,
            None,
            7,
            [{"exercise_id": "squat", "set_number": 1, "reps": 5, "weight_kg": 80.0, "rpe": 7}],
        )
    ])
    conn.execute = AsyncMock(return_value=cur)
    return conn


@pytest.mark.asyncio
async def test_get_workouts_returns_empty_list(empty_conn):
    from dotenv import load_dotenv
    load_dotenv()
    import os
    os.environ.setdefault("DATABASE_URL", "postgresql://fake")

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(empty_conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/workouts")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_workouts_returns_workout_list(conn_with_workout):
    import os
    os.environ.setdefault("DATABASE_URL", "postgresql://fake")

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn_with_workout)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/workouts")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["workout_id"] == "aaaaaaaa-0000-0000-0000-000000000001"
    assert data[0]["rpe"] == 7
    assert len(data[0]["sets"]) == 1
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd api && source .venv/bin/activate && python -m pytest tests/test_workouts_router.py -v 2>&1 | head -20
```

Expected: ImportError — `app.routers.workouts` doesn't exist yet.

- [ ] **Step 3: Create api/app/routers/workouts.py**

```python
from fastapi import APIRouter
from app.db import get_conn

router = APIRouter()

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


@router.get("/workouts")
async def get_workouts() -> list:
    async with get_conn() as conn:
        cur = await conn.execute(
            """
            SELECT w.id, w.completed_at, w.notes, w.rpe,
                   json_agg(
                       json_build_object(
                           'exercise_id', ws.exercise_id,
                           'set_number', ws.set_number,
                           'reps', ws.reps,
                           'weight_kg', ws.weight_kg::float,
                           'rpe', ws.rpe
                       ) ORDER BY ws.exercise_id, ws.set_number
                   ) AS sets
            FROM workouts w
            JOIN workout_sets ws ON ws.workout_id = w.id
            WHERE w.user_id = %s AND w.completed_at IS NOT NULL
            GROUP BY w.id, w.completed_at, w.notes, w.rpe
            ORDER BY w.completed_at DESC
            LIMIT 5
            """,
            (TEST_USER_ID,),
        )
        rows = await cur.fetchall()
    return [
        {
            "workout_id": str(r[0]),
            "date": r[1].isoformat() if r[1] else None,
            "notes": r[2],
            "rpe": r[3],
            "sets": r[4] or [],
        }
        for r in rows
    ]
```

- [ ] **Step 4: Register the router in main.py**

In `api/app/main.py`, add the import and router after the existing chat router:

```python
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat
from app.routers import workouts

app = FastAPI(title="AI Coach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(workouts.router, prefix="/api")

@app.get("/")
def health():
    return {"status": "ok"}
```

- [ ] **Step 5: Run new tests to verify they pass**

```bash
cd api && source .venv/bin/activate && python -m pytest tests/test_workouts_router.py -v
```

Expected: Both tests PASS.

- [ ] **Step 6: Run all tests**

```bash
cd api && source .venv/bin/activate && python -m pytest -v
```

Expected: All tests pass (test_tools.py + test_workout_tools.py + test_workouts_router.py).

- [ ] **Step 7: Commit**

```bash
cd api && git add app/routers/workouts.py app/main.py tests/test_workouts_router.py && git commit -m "feat: add GET /api/workouts endpoint"
```

---

## Task 7: Frontend WorkoutLog component and Logg page

**Files:**
- Modify: `web/src/lib/api.ts`
- Create: `web/src/components/workout/WorkoutLog.tsx`
- Modify: `web/src/app/(tabs)/log/page.tsx`

- [ ] **Step 1: Add Workout type and getWorkouts() to api.ts**

Replace the entire contents of `web/src/lib/api.ts` with:

```typescript
export type Message = {
  role: "user" | "assistant"
  content: string
}

export type Persona = "friend" | "sergeant" | "analyst"

export type WorkoutSet = {
  exercise_id: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  rpe: number | null
}

export type Workout = {
  workout_id: string
  date: string
  notes: string | null
  rpe: number | null
  sets: WorkoutSet[]
}

export async function sendMessage(messages: Message[], persona: Persona = "friend"): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/chat`

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, persona }),
  })

  if (!res.ok) {
    throw new Error(`API ${res.status}`)
  }

  const data = await res.json()
  return data.message as string
}

export async function getWorkouts(): Promise<Workout[]> {
  const url = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/workouts`

  const res = await fetch(url, { method: "GET" })

  if (!res.ok) {
    throw new Error(`API ${res.status}`)
  }

  return res.json() as Promise<Workout[]>
}
```

- [ ] **Step 2: Create the WorkoutLog component**

Create directory `web/src/components/workout/` and create `web/src/components/workout/WorkoutLog.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { getWorkouts, type Workout } from "@/lib/api"

function totalVolume(sets: Workout["sets"]): number {
  return sets.reduce((acc, s) => acc + (s.reps ?? 0) * (s.weight_kg ?? 0), 0)
}

function uniqueExerciseCount(sets: Workout["sets"]): number {
  return new Set(sets.map((s) => s.exercise_id)).size
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("no-NO", {
    weekday: "long",
    day: "numeric",
    month: "short",
  })
}

export default function WorkoutLog() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWorkouts()
      .then(setWorkouts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-muted-foreground text-sm p-4">Laster treningslogg...</p>
  }

  if (workouts.length === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground text-sm">
          Ingen treningsøkter logget enda. Si &quot;logg økten min&quot; til treneren etter trening!
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {workouts.map((w) => {
        const exCount = uniqueExerciseCount(w.sets)
        const vol = totalVolume(w.sets)
        return (
          <div key={w.workout_id} className="bg-card border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm capitalize">{formatDate(w.date)}</p>
                <p className="text-xs text-muted-foreground">
                  {exCount} øvelse{exCount !== 1 ? "r" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{vol.toFixed(0)} kg</p>
                <p className="text-xs text-muted-foreground">totalvolum</p>
              </div>
            </div>
            {w.rpe !== null && (
              <p className="text-xs text-muted-foreground mt-1">RPE {w.rpe}/10</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Update the Logg page to render WorkoutLog**

Replace the entire contents of `web/src/app/(tabs)/log/page.tsx` with:

```tsx
import WorkoutLog from "@/components/workout/WorkoutLog"

export default function LogPage() {
  return (
    <div>
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Logg</h1>
        <p className="text-muted-foreground text-sm mt-1">Dine siste treningsøkter</p>
      </div>
      <WorkoutLog />
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit 2>&1
```

Expected: No errors printed.

- [ ] **Step 5: Start both servers and verify UI**

Terminal 1 (backend):
```bash
cd api && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000
```

Terminal 2 (frontend):
```bash
cd web && npm run dev
```

Open http://localhost:3000 in browser. Navigate to the Logg tab (third icon in bottom nav).

Expected states to verify:
1. **Empty state** (no workouts logged yet): See "Ingen treningsøkter logget enda" message — not a blank screen or spinner stuck forever.
2. **After logging a workout via chat**: Navigate to the Hjem tab, send "Logg knebøy 80 kg x 5 sett, RPE 7". Return to Logg tab (reload page). Should see a card with the workout date, "1 øvelse", "400 kg totalvolum", "RPE 7/10".

- [ ] **Step 6: Commit**

```bash
cd web && git add src/lib/api.ts src/components/workout/WorkoutLog.tsx src/app/\(tabs\)/log/page.tsx && git commit -m "feat: add WorkoutLog component and Logg tab"
```

---

## Verification Checklist

Trinn 2 is complete when all of the following are true:

- [ ] `python -m pytest` in `api/` passes all tests
- [ ] `npx tsc --noEmit` in `web/` exits with no errors
- [ ] Empty Logg tab shows the empty-state message (not a crash or spinner)
- [ ] Chatting "logg knebøy 80 kg x 5 sett, RPE 7" causes Claude to call `log_workout` and confirm it was saved
- [ ] Reloading the Logg tab after logging shows a workout card with correct date, volume, and RPE
- [ ] `suggest_progression` returns "Try 82.5kg today!" after a RPE ≤ 7 session at 80kg
