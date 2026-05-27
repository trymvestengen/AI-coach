# Coach Memory-arkitektur Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the two-tier memory architecture (Profile + Coach memory) so the AI coach can build, store, and retrieve rich knowledge about each user over time.

**Architecture:** Add DB tables for user profile facts (Lag 1) and coach memory (Lag 2). Extend coach tool-use interface with read tools (profile, history, observations, progression) and write tools (observations, set logging with notes). Add a base-context builder that injects core user data into every coach request. Add batch jobs for workout and session summaries.

**Tech Stack:** PostgreSQL (Supabase), psycopg, pytest+pytest-asyncio, FastAPI, Anthropic SDK.

**Spec:** [docs/superpowers/specs/2026-05-27-memory-architecture-design.md](../specs/2026-05-27-memory-architecture-design.md)

---

## File Structure

**Created:**
- `api/db/migrations/007_memory_architecture.sql` — all new tables + ALTER TABLE
- `api/app/services/memory.py` — base-context builder + session management helpers
- `api/app/services/summaries.py` — batch summary generators
- `api/app/tools/memory_handlers.py` — handlers for new memory tools
- `api/tests/test_memory_handlers.py` — tests for new tool handlers
- `api/tests/test_memory_service.py` — tests for memory.py
- `api/tests/test_summaries.py` — tests for summary generators

**Modified:**
- `api/app/tools/handlers.py` — extend `log_workout` to accept coach_note per set + coach_summary; route new tool names to `memory_handlers.py`
- `api/app/tools/definitions.py` — add tool definitions for the new memory tools
- `api/app/services/coach.py` — call `build_base_context()` and inject into system prompt
- `api/app/routers/workouts.py` — trigger workout summary generation when `completed_at` is set
- `api/db/seed.py` — extend if necessary to seed user_injuries/preferences/equipment/constraints for the test user

---

## Phase A — Database migration

### Task 1: Create migration `007_memory_architecture.sql`

**Files:**
- Create: `api/db/migrations/007_memory_architecture.sql`

- [ ] **Step 1: Create the migration file with all schema changes**

Create `api/db/migrations/007_memory_architecture.sql` with this exact content:

```sql
-- api/db/migrations/007_memory_architecture.sql
-- Lag 1 (Profile) + Lag 2 (Coach memory) per docs/superpowers/specs/2026-05-27-memory-architecture-design.md

-- ============================================================
-- LAG 1: Profile (user-curated)
-- ============================================================

CREATE TABLE user_injuries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body_part    TEXT NOT NULL,
  description  TEXT,
  severity     TEXT,
  started_at   DATE,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_injuries_active ON user_injuries(user_id, is_active);

CREATE TABLE user_preferences (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category     TEXT NOT NULL,
  preference   TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);

CREATE TABLE user_equipment (
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  equipment    TEXT NOT NULL,
  PRIMARY KEY (user_id, equipment)
);

CREATE TABLE user_constraints (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  description  TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_constraints_user ON user_constraints(user_id);

-- ============================================================
-- LAG 2: Coach memory (AI-curated)
-- ============================================================

-- Add coach notes to existing tables (backwards-compatible — both nullable)
ALTER TABLE workout_sets ADD COLUMN coach_note TEXT;
ALTER TABLE workouts ADD COLUMN coach_summary TEXT;

-- Coach session = logical group of messages
CREATE TABLE coach_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at         TIMESTAMPTZ,
  summary          TEXT,
  workout_id       UUID REFERENCES workouts(id)
);

CREATE INDEX idx_coach_sessions_user_activity ON coach_sessions(user_id, last_activity_at DESC);

-- Chat messages
CREATE TABLE coach_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES coach_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool_use', 'tool_result')),
  content     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coach_messages_session ON coach_messages(session_id, created_at);

-- Coach observations
CREATE TABLE coach_observations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category           TEXT NOT NULL CHECK (category IN (
    'pattern', 'injury_hint', 'preference_hint', 'energy_level',
    'form_issue', 'milestone', 'other'
  )),
  observation        TEXT NOT NULL,
  confidence         TEXT CHECK (confidence IN ('low', 'medium', 'high')),
  source_session_id  UUID REFERENCES coach_sessions(id) ON DELETE SET NULL,
  source_workout_id  UUID REFERENCES workouts(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_confirmed_at  TIMESTAMPTZ,
  is_promoted        BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_coach_observations_user_category ON coach_observations(user_id, category, created_at DESC);
CREATE INDEX idx_coach_observations_workout ON coach_observations(user_id, source_workout_id);
```

- [ ] **Step 2: Apply migration to local Supabase**

Choose one of these paths based on how migrations are applied locally:

```bash
# Option A: psql directly against DATABASE_URL
psql "$DATABASE_URL" -f api/db/migrations/007_memory_architecture.sql

# Option B: Supabase CLI (if installed)
supabase migration up

# Option C: Read api/db/seed.py to see how earlier migrations were applied;
# follow the same pattern.
```

Expected: no errors, all tables created.

- [ ] **Step 3: Verify schema with introspection**

```bash
psql "$DATABASE_URL" -c "\d user_injuries"
psql "$DATABASE_URL" -c "\d coach_observations"
psql "$DATABASE_URL" -c "\d workout_sets"  # should show coach_note column
psql "$DATABASE_URL" -c "\d workouts"      # should show coach_summary column
```

Expected: all columns present.

- [ ] **Step 4: Verify the existing test suite still passes**

```bash
cd api && .venv/bin/pytest
```

Expected: 75/75 pass (foundation work baseline). The migration adds columns/tables but does not remove or rename anything, so existing tests must still pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/db/migrations/007_memory_architecture.sql
git commit -m "feat(db): add memory architecture tables (lag 1 profile + lag 2 coach memory)"
```

---

## Phase B — Profile read API and tool

The coach needs to read Lag 1 (Profile) every request. Build this first because base-context depends on it.

### Task 2: Implement and test `get_user_profile` tool handler

**Files:**
- Create: `api/app/tools/memory_handlers.py`
- Create: `api/tests/test_memory_handlers.py`
- Modify: `api/app/tools/handlers.py` (route to new handler)

- [ ] **Step 1: Write the failing test**

Create `api/tests/test_memory_handlers.py`:

```python
import pytest
from unittest.mock import AsyncMock


@pytest.mark.asyncio
async def test_get_user_profile_returns_all_layers(monkeypatch, mock_conn, make_mock_get_conn):
    """get_user_profile returns user row + active injuries + preferences + equipment + constraints."""

    user_row = ("user-id-1", "trym@example.com", "Trym", "no", "friend", "Bygge muskler")
    injury_rows = [("inj-1", "venstre kne", "vondt ved dyp knebøy", "moderat", "2019-03-01")]
    preference_rows = [("pref-1", "exercise", "liker ikke beinpress")]
    equipment_rows = [("barbell",), ("dumbbells_20kg",)]
    constraint_rows = [("con-1", "schedule", "kun tirs/tors/lør")]

    cur = AsyncMock()
    cur.fetchone = AsyncMock(side_effect=[user_row])
    cur.fetchall = AsyncMock(side_effect=[injury_rows, preference_rows, equipment_rows, constraint_rows])
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.tools.memory_handlers.get_conn", make_mock_get_conn(mock_conn))

    from app.tools.memory_handlers import get_user_profile
    result = await get_user_profile("user-id-1")

    assert result["name"] == "Trym"
    assert result["persona_mode"] == "friend"
    assert result["goals"] == "Bygge muskler"
    assert len(result["injuries"]) == 1
    assert result["injuries"][0]["body_part"] == "venstre kne"
    assert len(result["preferences"]) == 1
    assert result["equipment"] == ["barbell", "dumbbells_20kg"]
    assert len(result["constraints"]) == 1
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd api && .venv/bin/pytest tests/test_memory_handlers.py::test_get_user_profile_returns_all_layers -v
```

Expected: ImportError or "module not found" — `memory_handlers.py` doesn't exist.

- [ ] **Step 3: Implement `memory_handlers.py` with `get_user_profile`**

Create `api/app/tools/memory_handlers.py`:

```python
from app.db import get_conn


async def get_user_profile(user_id: str) -> dict:
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT id, email, name, locale, persona_mode, goals FROM users WHERE id = %s",
            (user_id,),
        )
        row = await cur.fetchone()
        if row is None:
            return {"error": f"User {user_id} not found"}

        cur = await conn.execute(
            "SELECT id, body_part, description, severity, started_at "
            "FROM user_injuries WHERE user_id = %s AND is_active = true",
            (user_id,),
        )
        injury_rows = await cur.fetchall()

        cur = await conn.execute(
            "SELECT id, category, preference FROM user_preferences WHERE user_id = %s",
            (user_id,),
        )
        preference_rows = await cur.fetchall()

        cur = await conn.execute(
            "SELECT equipment FROM user_equipment WHERE user_id = %s",
            (user_id,),
        )
        equipment_rows = await cur.fetchall()

        cur = await conn.execute(
            "SELECT id, type, description FROM user_constraints WHERE user_id = %s",
            (user_id,),
        )
        constraint_rows = await cur.fetchall()

    return {
        "id": row[0],
        "email": row[1],
        "name": row[2],
        "locale": row[3],
        "persona_mode": row[4],
        "goals": row[5],
        "injuries": [
            {"id": r[0], "body_part": r[1], "description": r[2], "severity": r[3], "started_at": str(r[4]) if r[4] else None}
            for r in injury_rows
        ],
        "preferences": [
            {"id": r[0], "category": r[1], "preference": r[2]}
            for r in preference_rows
        ],
        "equipment": [r[0] for r in equipment_rows],
        "constraints": [
            {"id": r[0], "type": r[1], "description": r[2]}
            for r in constraint_rows
        ],
    }
```

- [ ] **Step 4: Run test to verify pass**

```bash
cd api && .venv/bin/pytest tests/test_memory_handlers.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/tools/memory_handlers.py api/tests/test_memory_handlers.py
git commit -m "feat(api): add get_user_profile tool handler"
```

---

### Task 3: Add `get_user_profile` to TOOL_DEFINITIONS and route it

**Files:**
- Modify: `api/app/tools/definitions.py`
- Modify: `api/app/tools/handlers.py`

- [ ] **Step 1: Add tool definition**

In `api/app/tools/definitions.py`, append to the `TOOL_DEFINITIONS` list:

```python
    {
        "name": "get_user_profile",
        "description": "Get the user's full profile: name, locale, persona mode, goals, active injuries, preferences, available equipment, and constraints. Call this when you need user-stated facts (e.g. before designing a program or addressing pain).",
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
```

- [ ] **Step 2: Route the tool in handlers.py**

In `api/app/tools/handlers.py`, find the `handle_tool` function. Add an import at the top:

```python
from app.tools import memory_handlers
```

Inside `handle_tool`, add a branch:

```python
    if name == "get_user_profile":
        return await memory_handlers.get_user_profile(TEST_USER_ID)
```

(For now, hardcode `TEST_USER_ID` — wiring the real authenticated user into tools is a separate concern handled in routers, not here.)

- [ ] **Step 3: Write integration test**

Add to `api/tests/test_memory_handlers.py`:

```python
@pytest.mark.asyncio
async def test_handle_tool_routes_get_user_profile(monkeypatch):
    from app.tools import handlers

    called = {}

    async def fake_get_user_profile(user_id):
        called["user_id"] = user_id
        return {"name": "Test"}

    monkeypatch.setattr("app.tools.memory_handlers.get_user_profile", fake_get_user_profile)
    result = await handlers.handle_tool("get_user_profile", {})
    assert result == {"name": "Test"}
    assert "user_id" in called
```

- [ ] **Step 4: Run tests**

```bash
cd api && .venv/bin/pytest tests/test_memory_handlers.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/app/tools/definitions.py api/app/tools/handlers.py api/tests/test_memory_handlers.py
git commit -m "feat(api): wire get_user_profile into coach tool interface"
```

---

## Phase C — Read tools for coach memory

### Task 4: Implement and test `get_workout_history`

**Files:**
- Modify: `api/app/tools/memory_handlers.py`
- Modify: `api/tests/test_memory_handlers.py`

- [ ] **Step 1: Write the failing test**

Append to `api/tests/test_memory_handlers.py`:

```python
@pytest.mark.asyncio
async def test_get_workout_history_returns_recent_workouts(monkeypatch, mock_conn, make_mock_get_conn):
    workout_rows = [
        ("w1", "2026-05-26 10:00", "2026-05-26 11:00", "RPE 7", "Good session, squat strong"),
        ("w2", "2026-05-24 10:00", "2026-05-24 11:00", None, "Tired, dropped last set"),
    ]
    set_rows_w1 = [
        ("squat", 1, 5, 80.0, 7, "5/5 strong, felt easy"),
        ("squat", 2, 5, 82.5, 8, "5/5 last rep grindy"),
    ]
    set_rows_w2 = [
        ("squat", 1, 5, 80.0, 8, "felt heavy, low energy"),
    ]

    cur = AsyncMock()
    cur.fetchall = AsyncMock(side_effect=[workout_rows, set_rows_w1, set_rows_w2])
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.tools.memory_handlers.get_conn", make_mock_get_conn(mock_conn))

    from app.tools.memory_handlers import get_workout_history
    result = await get_workout_history("user-1", exercise_id="squat", limit=5)

    assert len(result) == 2
    assert result[0]["coach_summary"] == "Good session, squat strong"
    assert result[0]["sets"][0]["coach_note"] == "5/5 strong, felt easy"
    assert result[0]["sets"][1]["weight_kg"] == 82.5
    assert result[1]["sets"][0]["coach_note"] == "felt heavy, low energy"
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd api && .venv/bin/pytest tests/test_memory_handlers.py::test_get_workout_history_returns_recent_workouts -v
```

Expected: FAIL (function not defined).

- [ ] **Step 3: Implement `get_workout_history`**

Append to `api/app/tools/memory_handlers.py`:

```python
async def get_workout_history(user_id: str, exercise_id: str | None = None, limit: int = 10) -> list[dict]:
    async with get_conn() as conn:
        if exercise_id:
            cur = await conn.execute(
                "SELECT DISTINCT w.id, w.started_at, w.completed_at, w.notes, w.coach_summary "
                "FROM workouts w JOIN workout_sets ws ON ws.workout_id = w.id "
                "WHERE w.user_id = %s AND ws.exercise_id = %s "
                "ORDER BY w.started_at DESC LIMIT %s",
                (user_id, exercise_id, limit),
            )
        else:
            cur = await conn.execute(
                "SELECT id, started_at, completed_at, notes, coach_summary "
                "FROM workouts WHERE user_id = %s "
                "ORDER BY started_at DESC LIMIT %s",
                (user_id, limit),
            )
        workout_rows = await cur.fetchall()

        workouts = []
        for w in workout_rows:
            cur = await conn.execute(
                "SELECT exercise_id, set_number, reps, weight_kg, rpe, coach_note "
                "FROM workout_sets WHERE workout_id = %s ORDER BY exercise_id, set_number",
                (w[0],),
            )
            set_rows = await cur.fetchall()
            workouts.append({
                "id": w[0],
                "started_at": str(w[1]) if w[1] else None,
                "completed_at": str(w[2]) if w[2] else None,
                "notes": w[3],
                "coach_summary": w[4],
                "sets": [
                    {
                        "exercise_id": s[0],
                        "set_number": s[1],
                        "reps": s[2],
                        "weight_kg": float(s[3]) if s[3] is not None else None,
                        "rpe": s[4],
                        "coach_note": s[5],
                    }
                    for s in set_rows
                ],
            })

    return workouts
```

- [ ] **Step 4: Add tool definition**

In `api/app/tools/definitions.py`, append:

```python
    {
        "name": "get_workout_history",
        "description": "Return the user's recent workouts including all sets and any coach notes/summaries. Optionally filter by exercise_id to see history for a specific lift.",
        "input_schema": {
            "type": "object",
            "properties": {
                "exercise_id": {
                    "type": "string",
                    "description": "Optional. Filter to workouts containing this exercise.",
                },
                "limit": {
                    "type": "integer",
                    "description": "Max number of workouts to return (default 10).",
                },
            },
        },
    },
```

- [ ] **Step 5: Route in handlers.py**

In `api/app/tools/handlers.py` `handle_tool`:

```python
    if name == "get_workout_history":
        return await memory_handlers.get_workout_history(
            TEST_USER_ID,
            exercise_id=inputs.get("exercise_id"),
            limit=inputs.get("limit", 10),
        )
```

- [ ] **Step 6: Run tests**

```bash
cd api && .venv/bin/pytest tests/test_memory_handlers.py -v
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add api/app/tools/memory_handlers.py api/app/tools/definitions.py api/app/tools/handlers.py api/tests/test_memory_handlers.py
git commit -m "feat(api): add get_workout_history tool with coach_note support"
```

---

### Task 5: Implement and test `get_progression`

**Files:**
- Modify: `api/app/tools/memory_handlers.py`
- Modify: `api/app/tools/definitions.py`
- Modify: `api/app/tools/handlers.py`
- Modify: `api/tests/test_memory_handlers.py`

- [ ] **Step 1: Write the failing test**

Append to `api/tests/test_memory_handlers.py`:

```python
@pytest.mark.asyncio
async def test_get_progression_returns_weekly_aggregates(monkeypatch, mock_conn, make_mock_get_conn):
    # Mock returns rows of (week_start, max_weight, total_volume, avg_rpe, set_count)
    rows = [
        ("2026-05-25", 85.0, 1700.0, 7.5, 10),
        ("2026-05-18", 82.5, 1650.0, 7.0, 10),
        ("2026-05-11", 80.0, 1600.0, 7.0, 10),
    ]
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=rows)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.tools.memory_handlers.get_conn", make_mock_get_conn(mock_conn))

    from app.tools.memory_handlers import get_progression
    result = await get_progression("user-1", "squat", weeks=12)

    assert len(result) == 3
    assert result[0]["max_weight_kg"] == 85.0
    assert result[0]["total_volume_kg"] == 1700.0
    assert result[0]["avg_rpe"] == 7.5
    assert result[0]["set_count"] == 10
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd api && .venv/bin/pytest tests/test_memory_handlers.py::test_get_progression_returns_weekly_aggregates -v
```

Expected: FAIL.

- [ ] **Step 3: Implement `get_progression`**

Append to `memory_handlers.py`:

```python
async def get_progression(user_id: str, exercise_id: str, weeks: int = 12) -> list[dict]:
    sql = """
        SELECT
          date_trunc('week', w.started_at)::date AS week_start,
          MAX(ws.weight_kg)                       AS max_weight,
          SUM(ws.weight_kg * ws.reps)             AS total_volume,
          AVG(ws.rpe)::numeric(4,2)               AS avg_rpe,
          COUNT(*)                                 AS set_count
        FROM workout_sets ws
        JOIN workouts w ON w.id = ws.workout_id
        WHERE w.user_id = %s
          AND ws.exercise_id = %s
          AND w.started_at >= now() - (%s || ' weeks')::interval
        GROUP BY week_start
        ORDER BY week_start DESC
    """
    async with get_conn() as conn:
        cur = await conn.execute(sql, (user_id, exercise_id, weeks))
        rows = await cur.fetchall()

    return [
        {
            "week_start": str(r[0]),
            "max_weight_kg": float(r[1]) if r[1] is not None else None,
            "total_volume_kg": float(r[2]) if r[2] is not None else 0.0,
            "avg_rpe": float(r[3]) if r[3] is not None else None,
            "set_count": r[4],
        }
        for r in rows
    ]
```

- [ ] **Step 4: Add tool definition**

In `definitions.py`:

```python
    {
        "name": "get_progression",
        "description": "Return weekly aggregates (max weight, total volume, avg RPE, set count) for a specific exercise over the last N weeks. Use this when the user asks about progress on a lift.",
        "input_schema": {
            "type": "object",
            "properties": {
                "exercise_id": {"type": "string", "description": "Exercise ID, e.g. 'squat', 'bench-press'"},
                "weeks": {"type": "integer", "description": "Lookback window in weeks (default 12)."},
            },
            "required": ["exercise_id"],
        },
    },
```

- [ ] **Step 5: Route in handlers.py**

```python
    if name == "get_progression":
        return await memory_handlers.get_progression(
            TEST_USER_ID,
            exercise_id=inputs["exercise_id"],
            weeks=inputs.get("weeks", 12),
        )
```

- [ ] **Step 6: Run tests**

```bash
cd api && .venv/bin/pytest tests/test_memory_handlers.py -v
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add api/app/tools/memory_handlers.py api/app/tools/definitions.py api/app/tools/handlers.py api/tests/test_memory_handlers.py
git commit -m "feat(api): add get_progression tool for weekly aggregates"
```

---

### Task 6: Implement and test `search_observations` and `get_recent_sessions`

**Files:**
- Modify: `api/app/tools/memory_handlers.py`
- Modify: `api/app/tools/definitions.py`
- Modify: `api/app/tools/handlers.py`
- Modify: `api/tests/test_memory_handlers.py`

- [ ] **Step 1: Write failing tests**

Append to `api/tests/test_memory_handlers.py`:

```python
@pytest.mark.asyncio
async def test_search_observations_filters_by_category_and_window(monkeypatch, mock_conn, make_mock_get_conn):
    rows = [
        ("obs-1", "pattern", "Trains better in mornings", "high", "2026-05-25"),
        ("obs-2", "pattern", "Drops last set when tired", "medium", "2026-05-20"),
    ]
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=rows)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.tools.memory_handlers.get_conn", make_mock_get_conn(mock_conn))

    from app.tools.memory_handlers import search_observations
    result = await search_observations("user-1", category="pattern", days=90, limit=20)
    assert len(result) == 2
    assert result[0]["observation"] == "Trains better in mornings"
    assert result[0]["confidence"] == "high"


@pytest.mark.asyncio
async def test_get_recent_sessions_returns_summaries(monkeypatch, mock_conn, make_mock_get_conn):
    rows = [
        ("s-1", "2026-05-26 10:00", "Talked about deadlift form", "w-1"),
        ("s-2", "2026-05-24 10:00", "Planned next week, lower volume", None),
    ]
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=rows)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.tools.memory_handlers.get_conn", make_mock_get_conn(mock_conn))

    from app.tools.memory_handlers import get_recent_sessions
    result = await get_recent_sessions("user-1", days=30, limit=10)
    assert len(result) == 2
    assert result[0]["summary"] == "Talked about deadlift form"
    assert result[0]["workout_id"] == "w-1"
    assert result[1]["workout_id"] is None
```

- [ ] **Step 2: Run tests to verify failure**

```bash
cd api && .venv/bin/pytest tests/test_memory_handlers.py -v
```

Expected: FAIL on both new tests.

- [ ] **Step 3: Implement both functions**

Append to `memory_handlers.py`:

```python
async def search_observations(
    user_id: str,
    category: str | None = None,
    days: int = 90,
    limit: int = 20,
) -> list[dict]:
    sql = (
        "SELECT id, category, observation, confidence, created_at "
        "FROM coach_observations "
        "WHERE user_id = %s "
        "  AND created_at >= now() - (%s || ' days')::interval"
    )
    params: list = [user_id, days]
    if category:
        sql += " AND category = %s"
        params.append(category)
    sql += " ORDER BY created_at DESC LIMIT %s"
    params.append(limit)

    async with get_conn() as conn:
        cur = await conn.execute(sql, tuple(params))
        rows = await cur.fetchall()

    return [
        {
            "id": r[0],
            "category": r[1],
            "observation": r[2],
            "confidence": r[3],
            "created_at": str(r[4]) if r[4] else None,
        }
        for r in rows
    ]


async def get_recent_sessions(user_id: str, days: int = 30, limit: int = 10) -> list[dict]:
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT id, last_activity_at, summary, workout_id "
            "FROM coach_sessions "
            "WHERE user_id = %s "
            "  AND last_activity_at >= now() - (%s || ' days')::interval "
            "  AND summary IS NOT NULL "
            "ORDER BY last_activity_at DESC LIMIT %s",
            (user_id, days, limit),
        )
        rows = await cur.fetchall()

    return [
        {
            "id": r[0],
            "last_activity_at": str(r[1]) if r[1] else None,
            "summary": r[2],
            "workout_id": r[3],
        }
        for r in rows
    ]
```

- [ ] **Step 4: Add tool definitions**

In `definitions.py`:

```python
    {
        "name": "search_observations",
        "description": "Search coach observations about the user. Filter by category (pattern, injury_hint, preference_hint, energy_level, form_issue, milestone, other) and time window. Use this to recall things you noticed before.",
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {"type": "string", "description": "Optional category filter."},
                "days": {"type": "integer", "description": "Lookback window in days (default 90)."},
                "limit": {"type": "integer", "description": "Max results (default 20)."},
            },
        },
    },
    {
        "name": "get_recent_sessions",
        "description": "Return summaries of recent coach conversation sessions with the user. Use to recall what was discussed in past conversations.",
        "input_schema": {
            "type": "object",
            "properties": {
                "days": {"type": "integer", "description": "Lookback window in days (default 30)."},
                "limit": {"type": "integer", "description": "Max results (default 10)."},
            },
        },
    },
```

- [ ] **Step 5: Route in handlers.py**

```python
    if name == "search_observations":
        return await memory_handlers.search_observations(
            TEST_USER_ID,
            category=inputs.get("category"),
            days=inputs.get("days", 90),
            limit=inputs.get("limit", 20),
        )
    if name == "get_recent_sessions":
        return await memory_handlers.get_recent_sessions(
            TEST_USER_ID,
            days=inputs.get("days", 30),
            limit=inputs.get("limit", 10),
        )
```

- [ ] **Step 6: Run tests**

```bash
cd api && .venv/bin/pytest tests/test_memory_handlers.py -v
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add api/app/tools/memory_handlers.py api/app/tools/definitions.py api/app/tools/handlers.py api/tests/test_memory_handlers.py
git commit -m "feat(api): add search_observations and get_recent_sessions tools"
```

---

## Phase D — Write tools for coach memory

### Task 7: Implement and test `write_observation`

**Files:**
- Modify: `api/app/tools/memory_handlers.py`
- Modify: `api/app/tools/definitions.py`
- Modify: `api/app/tools/handlers.py`
- Modify: `api/tests/test_memory_handlers.py`

- [ ] **Step 1: Write failing test**

Append to `api/tests/test_memory_handlers.py`:

```python
@pytest.mark.asyncio
async def test_write_observation_inserts_row(monkeypatch, mock_conn, make_mock_get_conn):
    captured = {}

    async def fake_execute(sql, params):
        captured["sql"] = sql
        captured["params"] = params
        cur = AsyncMock()
        cur.fetchone = AsyncMock(return_value=("new-obs-id",))
        return cur

    mock_conn.execute = fake_execute
    monkeypatch.setattr("app.tools.memory_handlers.get_conn", make_mock_get_conn(mock_conn))

    from app.tools.memory_handlers import write_observation
    result = await write_observation(
        "user-1",
        category="pattern",
        observation="User trains better in mornings",
        confidence="high",
        related_workout_id=None,
    )

    assert result["id"] == "new-obs-id"
    assert "INSERT INTO coach_observations" in captured["sql"]
    assert "user-1" in captured["params"]
    assert "pattern" in captured["params"]


@pytest.mark.asyncio
async def test_write_observation_rejects_invalid_category(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.tools.memory_handlers.get_conn", make_mock_get_conn(mock_conn))
    from app.tools.memory_handlers import write_observation
    result = await write_observation(
        "user-1",
        category="invalid_category",
        observation="x",
    )
    assert "error" in result
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd api && .venv/bin/pytest tests/test_memory_handlers.py -v
```

Expected: FAIL.

- [ ] **Step 3: Implement `write_observation`**

Append to `memory_handlers.py`:

```python
VALID_OBSERVATION_CATEGORIES = {
    "pattern", "injury_hint", "preference_hint",
    "energy_level", "form_issue", "milestone", "other",
}
VALID_CONFIDENCE = {"low", "medium", "high"}


async def write_observation(
    user_id: str,
    category: str,
    observation: str,
    confidence: str = "medium",
    related_workout_id: str | None = None,
    related_session_id: str | None = None,
) -> dict:
    if category not in VALID_OBSERVATION_CATEGORIES:
        return {"error": f"Invalid category '{category}'. Allowed: {sorted(VALID_OBSERVATION_CATEGORIES)}"}
    if confidence not in VALID_CONFIDENCE:
        return {"error": f"Invalid confidence '{confidence}'. Allowed: low, medium, high"}

    async with get_conn() as conn:
        cur = await conn.execute(
            "INSERT INTO coach_observations "
            "(user_id, category, observation, confidence, source_workout_id, source_session_id, last_confirmed_at) "
            "VALUES (%s, %s, %s, %s, %s, %s, now()) RETURNING id",
            (user_id, category, observation, confidence, related_workout_id, related_session_id),
        )
        row = await cur.fetchone()
        await conn.commit()

    return {"id": row[0], "status": "written"}
```

- [ ] **Step 4: Add tool definition**

In `definitions.py`:

```python
    {
        "name": "write_observation",
        "description": "Record an observation about the user. Use this when you notice a pattern, possible injury, preference, energy trend, form issue, or milestone worth remembering. Will be available in future conversations via search_observations.",
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "enum": ["pattern", "injury_hint", "preference_hint", "energy_level", "form_issue", "milestone", "other"],
                    "description": "Type of observation.",
                },
                "observation": {
                    "type": "string",
                    "description": "Free-text observation. Keep it short and specific.",
                },
                "confidence": {
                    "type": "string",
                    "enum": ["low", "medium", "high"],
                    "description": "How confident are you in this observation? (default medium)",
                },
                "related_workout_id": {
                    "type": "string",
                    "description": "Optional. The workout this observation arose from.",
                },
            },
            "required": ["category", "observation"],
        },
    },
```

- [ ] **Step 5: Route in handlers.py**

```python
    if name == "write_observation":
        return await memory_handlers.write_observation(
            TEST_USER_ID,
            category=inputs["category"],
            observation=inputs["observation"],
            confidence=inputs.get("confidence", "medium"),
            related_workout_id=inputs.get("related_workout_id"),
        )
```

- [ ] **Step 6: Run tests**

```bash
cd api && .venv/bin/pytest tests/test_memory_handlers.py -v
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add api/app/tools/memory_handlers.py api/app/tools/definitions.py api/app/tools/handlers.py api/tests/test_memory_handlers.py
git commit -m "feat(api): add write_observation tool"
```

---

### Task 8: Implement and test `log_set_with_note`

**Files:**
- Modify: `api/app/tools/memory_handlers.py`
- Modify: `api/app/tools/definitions.py`
- Modify: `api/app/tools/handlers.py`
- Modify: `api/tests/test_memory_handlers.py`

- [ ] **Step 1: Write failing test**

Append to `api/tests/test_memory_handlers.py`:

```python
@pytest.mark.asyncio
async def test_log_set_with_note_inserts_row(monkeypatch, mock_conn, make_mock_get_conn):
    captured = {}

    async def fake_execute(sql, params):
        captured["sql"] = sql
        captured["params"] = params
        cur = AsyncMock()
        cur.fetchone = AsyncMock(return_value=("new-set-id",))
        return cur

    mock_conn.execute = fake_execute
    monkeypatch.setattr("app.tools.memory_handlers.get_conn", make_mock_get_conn(mock_conn))

    from app.tools.memory_handlers import log_set_with_note
    result = await log_set_with_note(
        workout_id="w-1",
        exercise_id="squat",
        set_number=3,
        reps=5,
        weight_kg=82.5,
        rpe=7,
        coach_note="5/5 strong, suggested 85 next",
    )

    assert result["id"] == "new-set-id"
    assert "INSERT INTO workout_sets" in captured["sql"]
    assert "5/5 strong, suggested 85 next" in captured["params"]
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd api && .venv/bin/pytest tests/test_memory_handlers.py -v
```

Expected: FAIL.

- [ ] **Step 3: Implement `log_set_with_note`**

Append to `memory_handlers.py`:

```python
async def log_set_with_note(
    workout_id: str,
    exercise_id: str,
    set_number: int,
    reps: int | None,
    weight_kg: float | None,
    rpe: int | None = None,
    coach_note: str | None = None,
) -> dict:
    async with get_conn() as conn:
        cur = await conn.execute(
            "INSERT INTO workout_sets "
            "(workout_id, exercise_id, set_number, reps, weight_kg, rpe, coach_note) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (workout_id, exercise_id, set_number, reps, weight_kg, rpe, coach_note),
        )
        row = await cur.fetchone()
        await conn.commit()

    return {"id": row[0], "status": "logged"}
```

- [ ] **Step 4: Add tool definition**

In `definitions.py`:

```python
    {
        "name": "log_set_with_note",
        "description": "Log a single set during an active workout, including an optional coach note about quality, feel, or form. Use this when the user describes a set verbally and you log it for them.",
        "input_schema": {
            "type": "object",
            "properties": {
                "workout_id": {"type": "string", "description": "The active workout's id."},
                "exercise_id": {"type": "string", "description": "Exercise id, e.g. 'squat'."},
                "set_number": {"type": "integer", "description": "Set number within the exercise (1-based)."},
                "reps": {"type": "integer", "description": "Reps completed (nullable)."},
                "weight_kg": {"type": "number", "description": "Weight used in kg (nullable for bodyweight)."},
                "rpe": {"type": "integer", "description": "RPE 1-10 (optional)."},
                "coach_note": {"type": "string", "description": "Short note: quality, feel, form observation."},
            },
            "required": ["workout_id", "exercise_id", "set_number"],
        },
    },
```

- [ ] **Step 5: Route in handlers.py**

```python
    if name == "log_set_with_note":
        return await memory_handlers.log_set_with_note(
            workout_id=inputs["workout_id"],
            exercise_id=inputs["exercise_id"],
            set_number=inputs["set_number"],
            reps=inputs.get("reps"),
            weight_kg=inputs.get("weight_kg"),
            rpe=inputs.get("rpe"),
            coach_note=inputs.get("coach_note"),
        )
```

- [ ] **Step 6: Run tests**

```bash
cd api && .venv/bin/pytest tests/test_memory_handlers.py -v
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add api/app/tools/memory_handlers.py api/app/tools/definitions.py api/app/tools/handlers.py api/tests/test_memory_handlers.py
git commit -m "feat(api): add log_set_with_note tool"
```

---

### Task 9: Extend existing `log_workout` to accept coach_summary and per-set coach_note

**Files:**
- Modify: `api/app/tools/handlers.py` (the existing `log_workout` function around line 74)
- Modify: `api/app/tools/definitions.py` (existing log_workout tool definition)
- Modify: `api/tests/test_workout_tools.py`

- [ ] **Step 1: Read the existing log_workout implementation**

```bash
cd api && grep -n "async def log_workout" app/tools/handlers.py
sed -n '74,100p' app/tools/handlers.py
```

Verify the current signature is `async def log_workout(exercises, notes, rpe)`. Add coach_summary parameter and per-set coach_note support in step 3.

- [ ] **Step 2: Write a failing test**

Append to `api/tests/test_workout_tools.py`:

```python
@pytest.mark.asyncio
async def test_log_workout_persists_coach_summary_and_set_notes(monkeypatch, mock_conn, make_mock_get_conn):
    insert_calls = []

    async def fake_execute(sql, params=None):
        insert_calls.append((sql, params))
        cur = AsyncMock()
        cur.fetchone = AsyncMock(return_value=None)
        return cur

    mock_conn.execute = fake_execute
    monkeypatch.setattr("app.tools.handlers.get_conn", make_mock_get_conn(mock_conn))

    from app.tools.handlers import log_workout
    result = await log_workout(
        exercises=[
            {
                "exercise_id": "squat",
                "sets": [
                    {"reps": 5, "weight_kg": 80, "rpe": 7, "coach_note": "felt easy"},
                    {"reps": 5, "weight_kg": 82.5, "rpe": 8, "coach_note": "grindy last rep"},
                ],
            },
        ],
        notes="Good day",
        rpe=7,
        coach_summary="Squat looked strong, RPE controlled.",
    )

    workout_inserts = [c for c in insert_calls if "INSERT INTO workouts" in c[0]]
    set_inserts = [c for c in insert_calls if "INSERT INTO workout_sets" in c[0]]
    assert any("coach_summary" in c[0] for c in workout_inserts)
    assert any("coach_note" in c[0] for c in set_inserts)
    assert "felt easy" in set_inserts[0][1]
    assert "Squat looked strong, RPE controlled." in workout_inserts[0][1]
    assert result["status"] != "error"
```

- [ ] **Step 3: Modify `log_workout` to add `coach_summary` and per-set `coach_note`**

In `api/app/tools/handlers.py`, replace the `log_workout` function body. The new function:

```python
async def log_workout(
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
                (workout_id, TEST_USER_ID, datetime.now(timezone.utc), datetime.now(timezone.utc), notes, rpe, coach_summary),
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
    except Exception as e:
        return {"error": f"Failed to log workout: {e}", "status": "error"}
    return {"workout_id": workout_id, "status": "logged"}
```

- [ ] **Step 4: Update tool definition for log_workout**

In `definitions.py`, find the existing `log_workout` definition and extend the schema:
- Add `coach_summary` property at the top level.
- Add `coach_note` property to the set object inside `exercises[].sets`.

```python
# inside the existing log_workout entry, properties section:
                "coach_summary": {
                    "type": "string",
                    "description": "Overall coach summary of the workout (optional).",
                },
# and inside the set item schema, properties section:
                                        "coach_note": {
                                            "type": "string",
                                            "description": "Short note about this set (quality, feel).",
                                        },
```

- [ ] **Step 5: Update handler routing if needed**

In `handle_tool`, the existing log_workout call signature must pass through `coach_summary`. Verify it does — if it currently passes `**inputs` or expands explicitly, ensure the new field is forwarded.

If the current routing looks like:
```python
if name == "log_workout":
    return await log_workout(**inputs)
```
then it already forwards everything. If it does explicit args, add `coach_summary=inputs.get("coach_summary")`.

- [ ] **Step 6: Run tests**

```bash
cd api && .venv/bin/pytest tests/test_workout_tools.py -v
```

Expected: all pass (including new test).

- [ ] **Step 7: Commit**

```bash
git add api/app/tools/handlers.py api/app/tools/definitions.py api/tests/test_workout_tools.py
git commit -m "feat(api): extend log_workout with coach_summary and per-set coach_note"
```

---

## Phase E — Base context builder

### Task 10: Implement and test `build_base_context`

**Files:**
- Create: `api/app/services/memory.py`
- Create: `api/tests/test_memory_service.py`

- [ ] **Step 1: Write failing test**

Create `api/tests/test_memory_service.py`:

```python
import pytest
from unittest.mock import AsyncMock


@pytest.mark.asyncio
async def test_build_base_context_includes_profile_and_recent_workouts(monkeypatch):
    async def fake_profile(user_id):
        return {
            "id": user_id,
            "name": "Trym",
            "locale": "no",
            "persona_mode": "friend",
            "goals": "Bygge muskler",
            "injuries": [{"body_part": "venstre kne", "description": "vondt ved dyp knebøy"}],
            "preferences": [{"category": "exercise", "preference": "liker ikke beinpress"}],
            "equipment": ["barbell", "dumbbells_20kg"],
            "constraints": [{"type": "schedule", "description": "kun tirs/tors/lør"}],
        }

    async def fake_history(user_id, exercise_id=None, limit=3):
        return [
            {"id": "w1", "started_at": "2026-05-26", "coach_summary": "Good day"},
        ]

    async def fake_active_program(user_id):
        return {"name": "3-day split", "days_count": 3}

    monkeypatch.setattr("app.services.memory.get_user_profile", fake_profile)
    monkeypatch.setattr("app.services.memory.get_workout_history", fake_history)
    monkeypatch.setattr("app.services.memory.get_active_program_summary", fake_active_program)

    from app.services.memory import build_base_context
    ctx = await build_base_context("user-1")

    assert "Trym" in ctx
    assert "Bygge muskler" in ctx
    assert "venstre kne" in ctx
    assert "liker ikke beinpress" in ctx
    assert "barbell" in ctx
    assert "kun tirs/tors/lør" in ctx
    assert "Good day" in ctx
    assert "3-day split" in ctx


@pytest.mark.asyncio
async def test_build_base_context_stays_under_2000_tokens(monkeypatch):
    """Sanity check: even with rich data, base context must fit in budget."""
    async def fake_profile(user_id):
        return {
            "id": user_id,
            "name": "Trym",
            "locale": "no",
            "persona_mode": "friend",
            "goals": "x" * 200,
            "injuries": [{"body_part": "x" * 50, "description": "x" * 200}] * 5,
            "preferences": [{"category": "exercise", "preference": "x" * 100}] * 10,
            "equipment": ["x" * 30] * 10,
            "constraints": [{"type": "x", "description": "x" * 100}] * 5,
        }
    async def fake_history(user_id, exercise_id=None, limit=3):
        return [{"id": f"w{i}", "started_at": "2026-05-26", "coach_summary": "x" * 300} for i in range(3)]
    async def fake_active_program(user_id):
        return {"name": "x" * 50, "days_count": 3}

    monkeypatch.setattr("app.services.memory.get_user_profile", fake_profile)
    monkeypatch.setattr("app.services.memory.get_workout_history", fake_history)
    monkeypatch.setattr("app.services.memory.get_active_program_summary", fake_active_program)

    from app.services.memory import build_base_context
    ctx = await build_base_context("user-1")

    # Rough proxy: 4 chars ≈ 1 token. Budget is 2000 tokens ≈ 8000 chars.
    assert len(ctx) < 8000, f"Base context too large: {len(ctx)} chars"
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd api && .venv/bin/pytest tests/test_memory_service.py -v
```

Expected: ImportError (module doesn't exist).

- [ ] **Step 3: Implement `memory.py`**

Create `api/app/services/memory.py`:

```python
from app.tools.memory_handlers import get_user_profile, get_workout_history
from app.db import get_conn


async def get_active_program_summary(user_id: str) -> dict | None:
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT p.name, COUNT(pd.id) AS day_count "
            "FROM programs p LEFT JOIN program_days pd ON pd.program_id = p.id "
            "WHERE p.user_id = %s AND p.is_active = true "
            "GROUP BY p.id, p.name LIMIT 1",
            (user_id,),
        )
        row = await cur.fetchone()
    if row is None:
        return None
    return {"name": row[0], "days_count": row[1]}


async def build_base_context(user_id: str) -> str:
    profile = await get_user_profile(user_id)
    recent_workouts = await get_workout_history(user_id, limit=3)
    program = await get_active_program_summary(user_id)

    lines: list[str] = []
    lines.append("USER CONTEXT")
    lines.append(f"Name: {profile.get('name') or 'Unknown'}")
    lines.append(f"Locale: {profile.get('locale')}")
    lines.append(f"Persona: {profile.get('persona_mode')}")
    if profile.get("goals"):
        lines.append(f"Goals: {profile['goals']}")

    if profile.get("injuries"):
        lines.append("Active injuries:")
        for inj in profile["injuries"]:
            desc = inj.get("description") or ""
            lines.append(f"  - {inj['body_part']}: {desc}".rstrip(": "))

    if profile.get("preferences"):
        lines.append("Preferences:")
        for p in profile["preferences"]:
            lines.append(f"  - {p['preference']}")

    if profile.get("equipment"):
        lines.append(f"Available equipment: {', '.join(profile['equipment'])}")

    if profile.get("constraints"):
        lines.append("Constraints:")
        for c in profile["constraints"]:
            lines.append(f"  - {c['description']}")

    if program:
        lines.append(f"Active program: {program['name']} ({program['days_count']} days/week)")

    if recent_workouts:
        lines.append("Recent workouts:")
        for w in recent_workouts:
            summary = w.get("coach_summary") or "(no summary)"
            lines.append(f"  - {w['started_at']}: {summary}")

    return "\n".join(lines)
```

- [ ] **Step 4: Run tests**

```bash
cd api && .venv/bin/pytest tests/test_memory_service.py -v
```

Expected: both tests pass.

- [ ] **Step 5: Commit**

```bash
git add api/app/services/memory.py api/tests/test_memory_service.py
git commit -m "feat(api): add build_base_context service for coach injection"
```

---

### Task 11: Inject `build_base_context` into coach system prompt

**Files:**
- Modify: `api/app/services/coach.py`
- Modify: `api/tests/test_chat.py`

- [ ] **Step 1: Write failing test**

Open `api/tests/test_chat.py`. Add a test that verifies the system prompt includes the base context:

```python
@pytest.mark.asyncio
async def test_chat_includes_base_context_in_system_prompt(monkeypatch):
    from app.services import coach as coach_module

    captured = {}

    class FakeMessages:
        async def create(self, **kwargs):
            captured["system"] = kwargs["system"]
            class R:
                stop_reason = "end_turn"
                content = [type("B", (), {"text": "ok"})()]
            return R()

    fake_client = type("C", (), {"messages": FakeMessages()})()
    monkeypatch.setattr(coach_module, "client", fake_client)

    async def fake_base(user_id):
        return "USER CONTEXT\nName: Trym\nGoals: Bygge muskler"
    monkeypatch.setattr(coach_module, "build_base_context", fake_base)

    out = await coach_module.chat([{"role": "user", "content": "hei"}], persona="friend")
    assert out == "ok"

    system_text = " ".join(s["text"] for s in captured["system"])
    assert "USER CONTEXT" in system_text
    assert "Trym" in system_text
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd api && .venv/bin/pytest tests/test_chat.py::test_chat_includes_base_context_in_system_prompt -v
```

Expected: FAIL — current chat() doesn't call build_base_context.

- [ ] **Step 3: Modify coach.py to inject base context**

In `api/app/services/coach.py`:

Add to imports:
```python
from app.services.memory import build_base_context
from app.constants import TEST_USER_ID
```

Modify the `chat` function to add a base-context block to the system list before invoking the model:

```python
async def chat(messages: list[dict], persona: str = "friend") -> str:
    base_ctx = await build_base_context(TEST_USER_ID)

    system = [
        {
            "type": "text",
            "text": f"{BASE_PROMPT}\n\n{PERSONA_BLOCKS[persona]}",
            "cache_control": {"type": "ephemeral"},
        },
        {
            "type": "text",
            "text": base_ctx,
        },
    ]
    # ... rest of function unchanged
```

- [ ] **Step 4: Run test to verify pass**

```bash
cd api && .venv/bin/pytest tests/test_chat.py -v
```

Expected: PASS.

- [ ] **Step 5: Verify the full suite still passes**

```bash
cd api && .venv/bin/pytest
```

Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add api/app/services/coach.py api/tests/test_chat.py
git commit -m "feat(api): inject user base context into coach system prompt"
```

---

## Phase F — Batch summary generators

### Task 12: Implement and test `generate_workout_summary`

**Files:**
- Create: `api/app/services/summaries.py`
- Create: `api/tests/test_summaries.py`

- [ ] **Step 1: Write failing test**

Create `api/tests/test_summaries.py`:

```python
import pytest
from unittest.mock import AsyncMock


@pytest.mark.asyncio
async def test_generate_workout_summary_calls_llm_and_updates_workout(monkeypatch, mock_conn, make_mock_get_conn):
    """The summary generator queries the workout + sets, asks the LLM for a summary, writes it back."""

    workout_row = ("w-1", "user-1", "2026-05-26 10:00", "2026-05-26 11:00", "Felt good", 7)
    set_rows = [
        ("squat", 1, 5, 80.0, 7, "5/5 strong"),
        ("squat", 2, 5, 82.5, 8, "grindy"),
    ]
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=workout_row)
    cur.fetchall = AsyncMock(return_value=set_rows)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.services.summaries.get_conn", make_mock_get_conn(mock_conn))

    captured = {}

    class FakeMessages:
        async def create(self, **kwargs):
            captured["model"] = kwargs["model"]
            captured["messages"] = kwargs["messages"]
            class R:
                stop_reason = "end_turn"
                content = [type("B", (), {"text": "Solid session. Squat moved well from 80 to 82.5."})()]
            return R()

    monkeypatch.setattr("app.services.summaries.client", type("C", (), {"messages": FakeMessages()})())

    from app.services.summaries import generate_workout_summary
    summary = await generate_workout_summary("w-1")

    assert "Solid session" in summary
    assert mock_conn.commit.await_count >= 1
```

- [ ] **Step 2: Run to verify failure**

```bash
cd api && .venv/bin/pytest tests/test_summaries.py -v
```

Expected: FAIL.

- [ ] **Step 3: Implement `summaries.py`**

Create `api/app/services/summaries.py`:

```python
import os
import anthropic
from app.db import get_conn

client = anthropic.AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))


async def generate_workout_summary(workout_id: str) -> str:
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT id, user_id, started_at, completed_at, notes, rpe "
            "FROM workouts WHERE id = %s",
            (workout_id,),
        )
        workout = await cur.fetchone()
        if workout is None:
            return ""

        cur = await conn.execute(
            "SELECT exercise_id, set_number, reps, weight_kg, rpe, coach_note "
            "FROM workout_sets WHERE workout_id = %s ORDER BY exercise_id, set_number",
            (workout_id,),
        )
        sets = await cur.fetchall()

        lines = [f"Workout {workout[0]} on {workout[2]}"]
        if workout[4]:
            lines.append(f"User notes: {workout[4]}")
        if workout[5]:
            lines.append(f"Overall RPE: {workout[5]}")
        lines.append("Sets:")
        for s in sets:
            ex, sn, reps, w, rpe, note = s
            line = f"  {ex} set {sn}: {reps}x{w}kg" + (f" RPE{rpe}" if rpe else "")
            if note:
                line += f" — {note}"
            lines.append(line)

        prompt = (
            "Summarize this workout in 2-3 sentences for the user's training history. "
            "Focus on: what went well, anything notable about effort or form, and any pattern worth remembering. "
            "Do NOT include set-by-set detail. Write in the user's locale (Norwegian if data looks Norwegian, else English).\n\n"
            + "\n".join(lines)
        )

        resp = await client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        summary_text = ""
        for block in resp.content:
            if hasattr(block, "text"):
                summary_text = block.text
                break

        await conn.execute(
            "UPDATE workouts SET coach_summary = %s WHERE id = %s",
            (summary_text, workout_id),
        )
        await conn.commit()

    return summary_text
```

- [ ] **Step 4: Run test to verify pass**

```bash
cd api && .venv/bin/pytest tests/test_summaries.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/app/services/summaries.py api/tests/test_summaries.py
git commit -m "feat(api): add generate_workout_summary batch service"
```

---

### Task 13: Trigger workout summary on workout completion

**Files:**
- Modify: `api/app/routers/workouts.py`
- Modify: `api/tests/test_workouts_router.py`

- [ ] **Step 1: Inspect the existing complete-workout endpoint**

```bash
cd api && grep -n "completed_at\|complete" app/routers/workouts.py
```

Identify the function or endpoint that sets `workouts.completed_at`. The trigger goes there.

- [ ] **Step 2: Write failing test**

Append to `api/tests/test_workouts_router.py`:

```python
@pytest.mark.asyncio
async def test_completing_workout_triggers_summary_generation(monkeypatch, mock_conn, make_mock_get_conn):
    """When a workout's completed_at is set via the router, the summary generator should be scheduled."""

    monkeypatch.setattr("app.routers.workouts.get_conn", make_mock_get_conn(mock_conn))

    called = {}

    async def fake_generate(workout_id):
        called["workout_id"] = workout_id
        return "summary"

    monkeypatch.setattr("app.routers.workouts.generate_workout_summary", fake_generate)

    # Use the existing TestClient pattern in the file to call the complete endpoint
    # (adapt the path to whatever already exists, e.g. POST /api/workouts/{id}/complete)
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    resp = client.post("/api/workouts/00000000-0000-0000-0000-000000000abc/complete")
    assert resp.status_code in (200, 204)
    assert called.get("workout_id") == "00000000-0000-0000-0000-000000000abc"
```

If the complete endpoint path is different, adapt the URL.

- [ ] **Step 3: Run test to verify failure**

```bash
cd api && .venv/bin/pytest tests/test_workouts_router.py -v
```

Expected: FAIL (no trigger wired).

- [ ] **Step 4: Wire the trigger**

In `api/app/routers/workouts.py`, add imports:

```python
from fastapi import BackgroundTasks
from app.services.summaries import generate_workout_summary
```

Modify the complete-workout endpoint to accept BackgroundTasks and schedule the summary generation:

```python
@router.post("/workouts/{workout_id}/complete", status_code=200)
async def complete_workout(workout_id: str, background_tasks: BackgroundTasks, request: Request):
    # ... existing code that updates completed_at ...
    background_tasks.add_task(generate_workout_summary, workout_id)
    return {"status": "ok"}
```

If the existing endpoint already updates completed_at via a different shape, adapt accordingly — the key change is adding `background_tasks.add_task(generate_workout_summary, workout_id)` after the update commits.

- [ ] **Step 5: Run tests**

```bash
cd api && .venv/bin/pytest tests/test_workouts_router.py -v
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add api/app/routers/workouts.py api/tests/test_workouts_router.py
git commit -m "feat(api): trigger workout summary generation on completion"
```

---

### Task 14: Implement `summarize_session` and an idle-session helper

**Files:**
- Modify: `api/app/services/summaries.py`
- Modify: `api/tests/test_summaries.py`

- [ ] **Step 1: Write failing test**

Append to `api/tests/test_summaries.py`:

```python
@pytest.mark.asyncio
async def test_summarize_session_writes_summary_and_marks_ended(monkeypatch, mock_conn, make_mock_get_conn):
    message_rows = [
        ("user",      {"text": "hei, hva skal vi gjøre i dag?"}),
        ("assistant", {"text": "Vi tar overkropp. Klar?"}),
        ("user",      {"text": "ja, kjør på"}),
    ]
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=message_rows)
    cur.fetchone = AsyncMock(return_value=("session-1", "user-1"))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.services.summaries.get_conn", make_mock_get_conn(mock_conn))

    class FakeMessages:
        async def create(self, **kwargs):
            class R:
                stop_reason = "end_turn"
                content = [type("B", (), {"text": "Planlagt overkroppsøkt."})()]
            return R()
    monkeypatch.setattr("app.services.summaries.client", type("C", (), {"messages": FakeMessages()})())

    from app.services.summaries import summarize_session
    summary = await summarize_session("session-1")

    assert "Planlagt overkroppsøkt." in summary
    assert mock_conn.commit.await_count >= 1
```

- [ ] **Step 2: Run to verify failure**

```bash
cd api && .venv/bin/pytest tests/test_summaries.py -v
```

Expected: FAIL.

- [ ] **Step 3: Implement `summarize_session`**

Append to `api/app/services/summaries.py`:

```python
import json


async def summarize_session(session_id: str) -> str:
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT id, user_id FROM coach_sessions WHERE id = %s",
            (session_id,),
        )
        session = await cur.fetchone()
        if session is None:
            return ""

        cur = await conn.execute(
            "SELECT role, content FROM coach_messages WHERE session_id = %s ORDER BY created_at",
            (session_id,),
        )
        messages = await cur.fetchall()

        transcript_lines = []
        for role, content in messages:
            if role in ("user", "assistant"):
                text = content.get("text") if isinstance(content, dict) else str(content)
                if text:
                    transcript_lines.append(f"{role}: {text}")

        if not transcript_lines:
            return ""

        prompt = (
            "Summarize this coach-user conversation in 2-3 sentences for future reference. "
            "Focus on: what was decided, key things the user said about themselves, and any next steps. "
            "Match the user's language.\n\n" + "\n".join(transcript_lines)
        )

        resp = await client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        summary_text = ""
        for block in resp.content:
            if hasattr(block, "text"):
                summary_text = block.text
                break

        await conn.execute(
            "UPDATE coach_sessions SET summary = %s, ended_at = now() WHERE id = %s",
            (summary_text, session_id),
        )
        await conn.commit()

    return summary_text
```

- [ ] **Step 4: Run tests**

```bash
cd api && .venv/bin/pytest tests/test_summaries.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/app/services/summaries.py api/tests/test_summaries.py
git commit -m "feat(api): add summarize_session batch service"
```

---

## Phase G — System prompt updates

### Task 15: Update coach system prompt to instruct tool use

**Files:**
- Modify: `api/app/services/coach.py`
- Modify: `api/tests/test_chat.py`

- [ ] **Step 1: Modify the BASE_PROMPT**

In `api/app/services/coach.py`, replace `BASE_PROMPT` with:

```python
BASE_PROMPT = """You are an AI fitness coach for a mobile/web app.
The user chats with you in text (voice optional). Your replies should feel like a smart friend.

CORE PRINCIPLES
- Adapt to the user's level. Never assume they know jargon — define it the first time you use it.
- Safety first. If the user mentions pain (not soreness), dizziness, or injury, stop workout direction and ask one clarifying question.
- Ground yourself in data. Before giving advice about weight or reps, call the appropriate tool.
- Be concise. Keep sentences short. Avoid lists, markdown, or headers in most replies. Max 3 sentences per turn unless the user explicitly asks for detail.
- Match the user's language. If they speak Norwegian, reply in Norwegian. If English, English.

TOOLS
You have tools for:
- Reading: get_user_profile, get_workout_history, get_recent_sessions, search_observations, get_progression, get_exercise_info, search_exercises
- Writing: write_observation, log_set_with_note, log_workout (extended), create_program

WHEN TO USE WRITE TOOLS
- write_observation: when you notice something worth remembering for the future — a pattern, a hint about an injury or preference, an energy trend. Be specific and short.
- log_set_with_note: during an active workout when the user describes a set verbally.
- Never modify the user's profile directly. Use write_observation with category="injury_hint" or "preference_hint" and ASK the user before treating it as a profile fact.

WHEN TO USE READ TOOLS
- Call get_workout_history or get_progression BEFORE giving any advice about weight or reps.
- Call search_observations when the user asks about past patterns or themselves.
- Don't call tools unnecessarily — for casual chat or motivation, the base context is enough.

WHAT YOU DO NOT DO
- Do not prescribe medical treatment or diagnose conditions.
- Do not shame the user for missed workouts or eating habits.
- Do not make up exercises, numbers, or research claims.
"""
```

- [ ] **Step 2: Update test if needed**

Existing tests that check for specific phrases in the system prompt may fail. Run the suite and adjust any assertions about the BASE_PROMPT content if needed.

```bash
cd api && .venv/bin/pytest
```

Fix any assertion failures by updating the test expectations to match the new prompt content.

- [ ] **Step 3: Commit**

```bash
git add api/app/services/coach.py api/tests/test_chat.py
git commit -m "feat(api): update coach system prompt with new memory tool guidance"
```

---

## Phase H — Verification

### Task 16: End-to-end smoke test against real DB

**Files:** none (manual verification)

- [ ] **Step 1: Apply migration to local DB**

```bash
psql "$DATABASE_URL" -f api/db/migrations/007_memory_architecture.sql
```

- [ ] **Step 2: Seed a test user profile**

```bash
psql "$DATABASE_URL" <<'SQL'
-- Add an injury, preference, equipment, constraint for the test user
INSERT INTO user_injuries (user_id, body_part, description, severity, started_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'venstre kne', 'vondt ved dyp knebøy', 'moderat', '2019-03-01');

INSERT INTO user_preferences (user_id, category, preference)
VALUES ('00000000-0000-0000-0000-000000000001', 'exercise', 'liker ikke beinpress');

INSERT INTO user_equipment (user_id, equipment) VALUES
  ('00000000-0000-0000-0000-000000000001', 'barbell'),
  ('00000000-0000-0000-0000-000000000001', 'dumbbells_20kg');

INSERT INTO user_constraints (user_id, type, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'schedule', 'kun tirs/tors/lør');
SQL
```

- [ ] **Step 3: Run full backend test suite against the live DB**

```bash
cd api && .venv/bin/pytest -v
```

Expected: all pass (75 existing + new tests added by this plan, ~95+).

- [ ] **Step 4: Manual chat test**

Start the backend locally:

```bash
cd api && .venv/bin/uvicorn app.main:app --reload
```

In a separate terminal, send a chat request via curl that asks about the user's history:

```bash
curl -s -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"messages": [{"role": "user", "content": "Hva er svakeste øvelsen min?"}]}' | jq
```

Expected: coach response references real history (or absence of it). System prompt should contain user context.

- [ ] **Step 5: Verify base context size**

Add a one-off script `api/scripts/check_context_size.py`:

```python
import asyncio
from app.services.memory import build_base_context

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"

async def main():
    ctx = await build_base_context(TEST_USER_ID)
    print(f"Length: {len(ctx)} chars (~{len(ctx)//4} tokens)")
    print("---")
    print(ctx)

asyncio.run(main())
```

```bash
cd api && .venv/bin/python scripts/check_context_size.py
```

Expected: < 8000 chars (< 2000 tokens).

- [ ] **Step 6: Verify the cascade-delete works**

```bash
psql "$DATABASE_URL" <<'SQL'
-- Test cascade delete: create a temp user with memory, delete user, verify cascade
BEGIN;
INSERT INTO users (id, email) VALUES ('11111111-1111-1111-1111-111111111111', 'temp@test.com');
INSERT INTO user_injuries (user_id, body_part) VALUES ('11111111-1111-1111-1111-111111111111', 'test');
INSERT INTO coach_observations (user_id, category, observation) VALUES ('11111111-1111-1111-1111-111111111111', 'pattern', 'test');
DELETE FROM users WHERE id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*) FROM user_injuries WHERE user_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*) FROM coach_observations WHERE user_id = '11111111-1111-1111-1111-111111111111';
ROLLBACK;
SQL
```

Expected: both COUNT queries return 0 (cascade worked).

- [ ] **Step 7: Open PR and merge via the normal workflow**

Since branch protection is active, push all the commits from Phases A-G to a branch and open a PR:

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git checkout -b tv/memory-architecture
# all commits from this plan are now on this branch
git push -u origin tv/memory-architecture
gh pr create --title "feat(api): memory architecture (Lag 1 + Lag 2)" \
  --body "$(cat <<'EOF'
## Hva
Implementerer spec docs/superpowers/specs/2026-05-27-memory-architecture-design.md.

## Hvorfor
Foundational for AI coach. Coach kan nå huske og hente brukerdata over tid.

## Hvordan testet
- [x] Pytest: nye tester for hver tool + service
- [x] DB-migrasjon kjørt lokalt og verifisert med \d
- [x] Manuell curl-test mot lokal backend
- [x] Cascade-delete verifisert
- [x] Base context størrelse < 2000 tokens
EOF
)"
```

Wait for CI, then merge.

---

## Out of scope — explicit

Per spec, IKKE i denne planen:

1. pgvector / embeddings / semantic search
2. UI for å se/redigere coach memory (Profile-tab forblir Lag 1-only, og UI for det er sin egen spec)
3. Lifecycle management (compress_old_memory)
4. Profile-tab UI design
5. Coach-tab UI design
6. Voice integration
7. RLS-policyer for de nye tabellene — vurderes hvis Supabase RLS-strategi tilsier det, men ikke automatisk del av denne planen
8. Performance/scale-testing
9. Wiring i den ekte autentiserte bruker-IDen inn i tools — TEST_USER_ID brukes per dagens mønster
