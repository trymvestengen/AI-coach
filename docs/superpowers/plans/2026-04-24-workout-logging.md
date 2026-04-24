# Workout Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all mock data in ProgramScreen and WorkoutLog with real API data, add inline set logging with a configurable rest timer, and wire the missing backend endpoints.

**Architecture:** The FastAPI backend (Python, psycopg3, PostgreSQL) already has the right schema. We add four missing endpoints, export the 855 wger exercises to a JSON sidecar so Python can seed them into the DB, then wire the Next.js frontend screens to call real APIs. Inline set logging lives entirely in React state and fires API calls on each checkmark.

**Tech Stack:** FastAPI, psycopg3, PostgreSQL, Next.js 15 App Router, React state, localStorage for rest timer preference.

---

## File map

**New files:**
- `scripts/export-exercises-json.ts` — exports EXERCISES array from exercises.ts to `api/db/exercises_wger.json`
- `api/db/seed_wger.py` — upserts 855 wger exercises into the DB `exercises` table
- `api/tests/test_workout_logging_router.py` — tests for the three new workout endpoints
- `api/tests/test_active_program_router.py` — tests for GET /api/programs/active
- `web/src/components/program/RestTimer.tsx` — bottom sheet countdown timer

**Modified files:**
- `api/app/routers/programs.py` — add `GET /api/programs/active`
- `api/app/routers/workouts.py` — add `POST /api/workouts`, `POST /api/workouts/{id}/sets`, `PATCH /api/workouts/{id}/complete`; also add `started_at` to `GET /api/workouts` response
- `web/src/lib/api.ts` — add `getActiveProgram`, `startWorkout`, `logSet`, `completeWorkout`
- `web/src/components/program/ProgramScreen.tsx` — replace mock data with API, add inline logging
- `web/src/components/log/WorkoutLog.tsx` — replace MOCK_WORKOUTS with `getWorkouts()` API call

---

## Task 1: Export wger exercises to JSON

**Files:**
- Create: `scripts/export-exercises-json.ts`
- Creates: `api/db/exercises_wger.json`

- [ ] **Step 1: Write the export script**

```typescript
#!/usr/bin/env npx tsx
import { writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { EXERCISES } from "../web/src/lib/exercises.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

const out = EXERCISES.map(e => ({
  id: e.id,
  name: e.name,
  muscle_groups: [e.primary, ...e.secondary],
  equipment: [e.equipment],
  difficulty: "intermediate",
  instructions: e.description || null,
}))

const outPath = join(__dirname, "../api/db/exercises_wger.json")
writeFileSync(outPath, JSON.stringify(out, null, 2), "utf-8")
console.log(`Written ${out.length} exercises to ${outPath}`)
```

- [ ] **Step 2: Run the script**

```bash
npx tsx scripts/export-exercises-json.ts
```

Expected: `Written 855 exercises to .../api/db/exercises_wger.json`

- [ ] **Step 3: Verify the JSON**

```bash
python3 -c "import json; d=json.load(open('api/db/exercises_wger.json')); print(len(d), 'exercises'); print(d[0])"
```

Expected: `855 exercises` followed by a dict with keys `id, name, muscle_groups, equipment, difficulty, instructions`.

- [ ] **Step 4: Commit**

```bash
git add scripts/export-exercises-json.ts api/db/exercises_wger.json
git commit -m "chore: export wger exercises to JSON sidecar for DB seeding"
```

---

## Task 2: Seed wger exercises into the database

**Files:**
- Create: `api/db/seed_wger.py`

Context: `api/db/seed.py` shows the pattern — use psycopg (sync), load from JSON, `ON CONFLICT (id) DO UPDATE`.

- [ ] **Step 1: Write seed_wger.py**

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

EXERCISES_PATH = Path(__file__).parent / "exercises_wger.json"


async def seed() -> None:
    conn_str = os.environ["DATABASE_URL"]
    with open(EXERCISES_PATH) as f:
        exercises = json.load(f)

    async with await psycopg.AsyncConnection.connect(conn_str) as conn:
        for ex in exercises:
            await conn.execute(
                """
                INSERT INTO exercises (id, name, muscle_groups, equipment, difficulty, instructions)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    name         = EXCLUDED.name,
                    muscle_groups = EXCLUDED.muscle_groups,
                    equipment    = EXCLUDED.equipment,
                    instructions = EXCLUDED.instructions
                """,
                (
                    ex["id"],
                    ex["name"],
                    ex["muscle_groups"],
                    ex["equipment"],
                    ex["difficulty"],
                    ex.get("instructions"),
                ),
            )
        await conn.commit()
        print(f"Seeded {len(exercises)} exercises from wger data")


if __name__ == "__main__":
    asyncio.run(seed())
```

- [ ] **Step 2: Run the seed (requires the database to be running)**

```bash
cd api && python db/seed_wger.py
```

Expected: `Seeded 855 exercises from wger data`

- [ ] **Step 3: Commit**

```bash
git add api/db/seed_wger.py
git commit -m "feat: seed wger exercises into DB"
```

---

## Task 3: Backend — GET /api/programs/active

**Files:**
- Modify: `api/app/routers/programs.py` (after `get_program` function, currently line 42)
- Create: `api/tests/test_active_program_router.py`

The new endpoint reuses the same two-query pattern as `get_program` but filters by `is_active = true` instead of `id`.

- [ ] **Step 1: Write the failing test**

```python
# api/tests/test_active_program_router.py
import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")

PROG_ID = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000002")
DAY_ID  = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000010")


@pytest.mark.asyncio
async def test_get_active_program_returns_404_when_none(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/programs/active")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_active_program_returns_program_with_days(make_mock_get_conn):
    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=(PROG_ID, "Hypertrophy 4x", True))

    cur_days = AsyncMock()
    cur_days.fetchall = AsyncMock(return_value=[
        (
            DAY_ID, 1, "Upper A",
            [{"id": "cc", "exercise_id": "bench-press", "name": "Bench Press",
              "muscle_groups": ["Chest"], "order_index": 0,
              "sets": [{"id": "ss", "set_number": 1, "reps": 8, "weight_kg": 80.0}]}],
        )
    ])

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_days])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/programs/active")

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Hypertrophy 4x"
    assert data["is_active"] is True
    assert len(data["days"]) == 1
    assert data["days"][0]["name"] == "Upper A"
    assert len(data["days"][0]["exercises"]) == 1
    assert data["days"][0]["exercises"][0]["exercise_id"] == "bench-press"
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd api && python -m pytest tests/test_active_program_router.py -v
```

Expected: FAIL — `404 Not Found` because the route doesn't exist yet.

- [ ] **Step 3: Add the endpoint to programs.py**

Add this after the existing `get_program` function (around line 100 in `api/app/routers/programs.py`):

```python
@router.get("/programs/active")
async def get_active_program() -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id, name, is_active FROM programs WHERE user_id = %s AND is_active = true LIMIT 1",
                (TEST_USER_ID,),
            )
            prog = await cur.fetchone()
            if prog is None:
                raise HTTPException(status_code=404, detail="No active program")

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
                (prog[0],),
            )
            day_rows = await cur.fetchall()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[get_active_program] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {
        "id": str(prog[0]),
        "name": prog[1],
        "is_active": prog[2],
        "days": [
            {"id": str(r[0]), "day_number": r[1], "name": r[2], "exercises": r[3] or []}
            for r in day_rows
        ],
    }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd api && python -m pytest tests/test_active_program_router.py -v
```

Expected: PASS — both tests green.

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
cd api && python -m pytest -v
```

Expected: All existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add api/app/routers/programs.py api/tests/test_active_program_router.py
git commit -m "feat: add GET /api/programs/active endpoint"
```

---

## Task 4: Backend — POST /api/workouts, POST sets, PATCH complete

**Files:**
- Modify: `api/app/routers/workouts.py`
- Create: `api/tests/test_workout_logging_router.py`

Also update the existing `GET /api/workouts` query to include `w.started_at` so the frontend can compute duration.

- [ ] **Step 1: Write the failing tests**

```python
# api/tests/test_workout_logging_router.py
import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")

WORKOUT_ID = uuid.UUID("cccccccc-0000-0000-0000-000000000001")
DT = datetime(2026, 4, 24, 10, 0, 0, tzinfo=timezone.utc)


@pytest.mark.asyncio
async def test_start_workout_returns_workout_id(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(WORKOUT_ID, DT))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)
    conn.commit = AsyncMock()

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/workouts", json={})

    assert response.status_code == 201
    data = response.json()
    assert "workout_id" in data
    assert "started_at" in data


@pytest.mark.asyncio
async def test_log_set_returns_201(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(WORKOUT_ID,))
    cur_insert = AsyncMock()

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_insert])
    conn.commit = AsyncMock()

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/workouts/{WORKOUT_ID}/sets",
                json={"exercise_id": "bench-press", "set_number": 1, "reps": 8, "weight_kg": 80.0},
            )

    assert response.status_code == 201
    data = response.json()
    assert data["exercise_id"] == "bench-press"
    assert data["reps"] == 8
    assert data["weight_kg"] == 80.0


@pytest.mark.asyncio
async def test_log_set_returns_404_for_unknown_workout(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/workouts/{WORKOUT_ID}/sets",
                json={"exercise_id": "bench-press", "set_number": 1, "reps": 8},
            )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_complete_workout_returns_completed_at(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(WORKOUT_ID, DT))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)
    conn.commit = AsyncMock()

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.patch(
                f"/api/workouts/{WORKOUT_ID}/complete",
                json={"rpe": 8},
            )

    assert response.status_code == 200
    data = response.json()
    assert "workout_id" in data
    assert "completed_at" in data


@pytest.mark.asyncio
async def test_complete_workout_returns_404_when_not_found(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)
    conn.commit = AsyncMock()

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.patch(
                f"/api/workouts/{WORKOUT_ID}/complete",
                json={},
            )

    assert response.status_code == 404
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd api && python -m pytest tests/test_workout_logging_router.py -v
```

Expected: FAIL — routes don't exist yet.

- [ ] **Step 3: Add the three new endpoints and update GET /workouts in workouts.py**

Replace the entire content of `api/app/routers/workouts.py` with:

```python
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.db import get_conn
from app.constants import TEST_USER_ID

router = APIRouter()


@router.get("/workouts")
async def get_workouts() -> list:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT w.id, w.completed_at, w.notes, w.rpe, w.started_at,
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
                GROUP BY w.id, w.completed_at, w.notes, w.rpe, w.started_at
                ORDER BY w.completed_at DESC
                LIMIT 20
                """,
                (TEST_USER_ID,),
            )
            rows = await cur.fetchall()
    except Exception:
        return []
    return [
        {
            "workout_id": str(r[0]),
            "date": r[1].isoformat() if r[1] else None,
            "notes": r[2],
            "rpe": r[3],
            "started_at": r[4].isoformat() if r[4] else None,
            "sets": r[5] or [],
        }
        for r in rows
    ]


class StartWorkoutBody(BaseModel):
    program_day_id: str | None = None


@router.post("/workouts", status_code=201)
async def start_workout(body: StartWorkoutBody) -> dict:
    try:
        async with get_conn() as conn:
            workout_id = str(uuid.uuid4())
            cur = await conn.execute(
                "INSERT INTO workouts (id, user_id) VALUES (%s, %s) RETURNING id, started_at",
                (workout_id, TEST_USER_ID),
            )
            row = await cur.fetchone()
            await conn.commit()
    except Exception as e:
        print(f"[start_workout] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"workout_id": str(row[0]), "started_at": row[1].isoformat()}


class LogSetBody(BaseModel):
    exercise_id: str = Field(min_length=1)
    set_number: int = Field(ge=1)
    reps: int = Field(ge=1)
    weight_kg: float | None = None
    rpe: int | None = Field(None, ge=1, le=10)


@router.post("/workouts/{workout_id}/sets", status_code=201)
async def log_set(workout_id: uuid.UUID, body: LogSetBody) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM workouts WHERE id = %s AND user_id = %s AND completed_at IS NULL",
                (workout_id, TEST_USER_ID),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Workout not found or already completed")
            set_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO workout_sets (id, workout_id, exercise_id, set_number, reps, weight_kg, rpe) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (set_id, workout_id, body.exercise_id, body.set_number, body.reps, body.weight_kg, body.rpe),
            )
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[log_set] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {
        "id": set_id,
        "exercise_id": body.exercise_id,
        "set_number": body.set_number,
        "reps": body.reps,
        "weight_kg": body.weight_kg,
        "rpe": body.rpe,
    }


class CompleteWorkoutBody(BaseModel):
    rpe: int | None = Field(None, ge=1, le=10)
    notes: str | None = None


@router.patch("/workouts/{workout_id}/complete")
async def complete_workout(workout_id: uuid.UUID, body: CompleteWorkoutBody) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "UPDATE workouts SET completed_at = NOW(), rpe = %s, notes = %s "
                "WHERE id = %s AND user_id = %s AND completed_at IS NULL "
                "RETURNING id, completed_at",
                (body.rpe, body.notes, workout_id, TEST_USER_ID),
            )
            row = await cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Workout not found or already completed")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[complete_workout] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"workout_id": str(row[0]), "completed_at": row[1].isoformat()}
```

- [ ] **Step 4: Run new tests**

```bash
cd api && python -m pytest tests/test_workout_logging_router.py -v
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Run full test suite**

```bash
cd api && python -m pytest -v
```

Expected: All tests pass. The existing `test_get_workouts_returns_workout_list` test may need updating because the SQL query now returns 5 columns instead of 4 — fix it by adding `started_at` to the mock `fetchall` return value:

In `api/tests/test_workouts_router.py`, update the mock row from:
```python
(
    "aaaaaaaa-0000-0000-0000-000000000001",
    dt,
    None,
    7,
    [{"exercise_id": "squat", ...}],
)
```
to:
```python
(
    "aaaaaaaa-0000-0000-0000-000000000001",
    dt,
    None,
    7,
    dt,   # started_at
    [{"exercise_id": "squat", ...}],
)
```

- [ ] **Step 6: Commit**

```bash
git add api/app/routers/workouts.py api/tests/test_workout_logging_router.py api/tests/test_workouts_router.py
git commit -m "feat: add workout logging endpoints (start, log set, complete)"
```

---

## Task 5: Frontend API client functions

**Files:**
- Modify: `web/src/lib/api.ts`

The `Program` and `ProgramDay` types are already defined in `api.ts`. The `ProgramExercise` type is also there. We only need to add four new async functions.

- [ ] **Step 1: Add the four functions at the end of api.ts**

```typescript
export async function getActiveProgram(): Promise<Program> {
  const res = await fetch(`${API_BASE}/api/programs/active`)
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Program>
}

export async function startWorkout(programDayId?: string): Promise<{ workout_id: string; started_at: string }> {
  const res = await fetch(`${API_BASE}/api/workouts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ program_day_id: programDayId ?? null }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export async function logSet(workoutId: string, body: {
  exercise_id: string
  set_number: number
  reps: number
  weight_kg?: number | null
  rpe?: number | null
}): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workouts/${workoutId}/sets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function completeWorkout(workoutId: string, body?: { rpe?: number; notes?: string }): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workouts/${workoutId}/complete`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/api.ts
git commit -m "feat: add workout logging API client functions"
```

---

## Task 6: RestTimer component

**Files:**
- Create: `web/src/components/program/RestTimer.tsx`

The timer is a fixed bottom sheet rendered above the BottomNav (zIndex 20). It counts down from a configurable duration, auto-calls `onDone()` at zero, and lets the user skip or edit the duration.

- [ ] **Step 1: Create RestTimer.tsx**

```tsx
"use client"

import { useState, useEffect, useRef } from "react"

interface RestTimerProps {
  seconds: number
  onDone: () => void
  onChangeDefault: (s: number) => void
}

export default function RestTimer({ seconds, onDone, onChangeDefault }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds)
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(String(seconds))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(intervalRef.current!)
          onDone()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [onDone])

  const pct = remaining / seconds
  const r = 28
  const circumference = 2 * Math.PI * r

  function handleEditDone() {
    const n = parseInt(editVal, 10)
    if (!isNaN(n) && n > 0) {
      onChangeDefault(n)
    }
    setEditing(false)
  }

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20,
      display: "flex", justifyContent: "center",
    }}>
      <div style={{
        width: "100%", maxWidth: 390,
        background: "var(--bg-1)",
        borderTop: "1px solid var(--border-1)",
        borderRadius: "20px 20px 0 0",
        padding: "20px 24px 48px",
        display: "flex", alignItems: "center", gap: 20,
      }}>
        {/* Ring */}
        <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
          <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
            <circle cx="36" cy="36" r={r} stroke="var(--bg-3)" strokeWidth="4" fill="none" />
            <circle cx="36" cy="36" r={r} stroke="var(--ai-accent)" strokeWidth="4" fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct)}
              strokeLinecap="round"
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700, color: "var(--fg-0)",
          }} className="tnum">
            {remaining}
          </div>
        </div>

        {/* Label + editable duration */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "var(--fg-2)", fontWeight: 500, marginBottom: 6 }}>
            Hvile
          </div>
          {editing ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                autoFocus
                type="number"
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={handleEditDone}
                onKeyDown={e => e.key === "Enter" && handleEditDone()}
                style={{
                  width: 60, background: "var(--bg-3)", border: "1px solid var(--border-1)",
                  borderRadius: 8, padding: "4px 8px", color: "var(--fg-0)",
                  fontSize: 14, fontWeight: 600,
                }}
              />
              <span style={{ fontSize: 13, color: "var(--fg-2)" }}>sek</span>
            </div>
          ) : (
            <button
              onClick={() => { setEditVal(String(seconds)); setEditing(true) }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 14, color: "var(--fg-1)", fontWeight: 600, padding: 0,
              }}
            >
              {seconds} sek standard ✎
            </button>
          )}
        </div>

        {/* Skip button */}
        <button
          onClick={onDone}
          style={{
            flexShrink: 0, height: 40, padding: "0 18px", borderRadius: 999,
            background: "var(--bg-3)", border: "1px solid var(--border-1)",
            color: "var(--fg-2)", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          Hopp over
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/program/RestTimer.tsx
git commit -m "feat: add RestTimer bottom sheet component"
```

---

## Task 7: ProgramScreen — load real program data (read-only)

**Files:**
- Modify: `web/src/components/program/ProgramScreen.tsx`

This task replaces all mock data with real API data and shows the program in read-only mode (no active logging yet). The swap functionality and ExerciseProgressRing stay intact.

The program's `day_number` maps 1=Monday … 7=Sunday. JavaScript's `Date.getDay()` returns 0=Sunday … 6=Saturday; we convert with `jsDay === 0 ? 7 : jsDay`.

- [ ] **Step 1: Rewrite ProgramScreen.tsx**

Replace the entire file with:

```tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getActiveProgram, type Program, type ProgramDay, type ProgramExercise } from "@/lib/api"
import { getExercise } from "@/lib/exercises"

/* ── Types ── */
interface WeekDay {
  d: string
  date: number
  exCount: number
  done: boolean
  today: boolean
  programDay: ProgramDay | null
}

const DAY_LABELS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"]

function buildWeekDays(program: Program): WeekDay[] {
  const now = new Date()
  const jsDay = now.getDay() // 0=Sun … 6=Sat
  const todayDayNumber = jsDay === 0 ? 7 : jsDay // 1=Mon … 7=Sun

  // Monday of this week
  const monday = new Date(now)
  monday.setDate(now.getDate() - (jsDay === 0 ? 6 : jsDay - 1))

  return DAY_LABELS.map((d, i) => {
    const dayNumber = i + 1 // 1=Mon … 7=Sun
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const programDay = program.days.find(pd => pd.day_number === dayNumber) ?? null
    return {
      d,
      date: date.getDate(),
      exCount: programDay?.exercises.length ?? 0,
      done: false,
      today: dayNumber === todayDayNumber,
      programDay,
    }
  })
}

/* ── ProgressBar (uses program week count placeholder) ── */
function ProgressBar() {
  const TOTAL_WEEKS = 12
  const DONE_WEEKS = 3
  const CURRENT_WEEK = 4
  return (
    <div style={{ padding: "0 20px 20px" }}>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: TOTAL_WEEKS }, (_, i) => {
          const done = i < DONE_WEEKS
          const current = i === DONE_WEEKS
          return (
            <div key={i} style={{
              flex: 1, height: 6, borderRadius: 2,
              background: done ? "var(--ai-accent)" : current ? "rgba(255,107,53,0.35)" : "var(--bg-3)",
              border: current ? "1px solid var(--ai-accent)" : "none",
              boxSizing: "border-box",
            }} />
          )
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--fg-2)", fontWeight: 500 }}>
        <span>{DONE_WEEKS} av {TOTAL_WEEKS} uker</span>
        <span>{TOTAL_WEEKS - CURRENT_WEEK + 1} uker igjen</span>
      </div>
    </div>
  )
}

/* ── WeekStrip ── */
function WeekStrip({ days, selectedIndex, onSelect }: {
  days: WeekDay[]
  selectedIndex: number
  onSelect: (i: number) => void
}) {
  return (
    <div style={{ padding: "0 20px 20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {days.map((d, i) => {
          const selected = i === selectedIndex
          return (
            <button key={d.d} onClick={() => onSelect(i)} style={{
              padding: "10px 0 12px", borderRadius: 14,
              background: selected ? "var(--ai-accent)" : d.done ? "var(--bg-3)" : "var(--bg-2)",
              border: `1px solid ${selected ? "var(--ai-accent)" : "var(--border-1)"}`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              opacity: d.exCount === 0 ? 0.5 : 1,
              cursor: d.exCount === 0 ? "default" : "pointer",
            }}>
              <div style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, color: selected ? "var(--primary-foreground)" : "var(--fg-3)" }}>
                {d.d}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: selected ? "var(--primary-foreground)" : "var(--fg-0)" }} className="tnum">
                {d.date}
              </div>
              <div style={{ width: 4, height: 4, borderRadius: 2, background: d.done ? (selected ? "var(--primary-foreground)" : "var(--ai-accent)") : "transparent" }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── ExerciseProgressRing ── */
function ExerciseProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : done / total
  const r = 9
  const circumference = 2 * Math.PI * r
  return (
    <div style={{ position: "relative", width: 26, height: 26, flexShrink: 0 }}>
      <svg width="26" height="26" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx="13" cy="13" r={r} stroke="var(--border-1)" strokeWidth="2" fill="none" />
        <circle cx="13" cy="13" r={r} stroke="var(--ai-accent)" strokeWidth="2" fill="none"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pct)} strokeLinecap="round"
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "var(--fg-2)", fontWeight: 600 }} className="tnum">
        {done}/{total}
      </div>
    </div>
  )
}

/* ── ExerciseRow (read-only) ── */
function ExerciseRow({ ex, isLast, onNavigate, onSwap, doneCount }: {
  ex: ProgramExercise
  isLast: boolean
  onNavigate: () => void
  onSwap: () => void
  doneCount: number
}) {
  const targetReps = ex.sets[0]?.reps ?? "–"
  const targetWeight = ex.sets[0]?.weight_kg != null ? `${ex.sets[0].weight_kg} kg` : "BW"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px 8px 16px", borderBottom: isLast ? "none" : "1px solid var(--border-1)" }}>
      <button onClick={onNavigate} style={{ flex: 1, minWidth: 0, padding: "6px 0", cursor: "pointer", background: "none", border: "none", color: "inherit", textAlign: "left" }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.008em", color: "var(--fg-0)" }}>{ex.name}</div>
        <div className="tnum" style={{ fontSize: 11, color: "var(--fg-2)", fontWeight: 500, marginTop: 2 }}>
          {ex.sets.length}×{targetReps} · {targetWeight}
        </div>
      </button>
      <button onClick={onSwap} aria-label="Swap øvelse" style={{
        flexShrink: 0, padding: "5px 10px", borderRadius: 999,
        fontSize: 11, color: "var(--fg-2)", fontWeight: 600,
        background: "var(--bg-3)", border: "1px solid var(--border-1)",
        display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
      }}>
        <svg width="11" height="11" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" aria-hidden="true">
          <path d="M1 4h8l-2-2M11 8H3l2 2" />
        </svg>
        Swap
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px 6px 4px", flexShrink: 0 }}>
        <ExerciseProgressRing done={doneCount} total={ex.sets.length} />
        <svg width="8" height="12" viewBox="0 0 8 12" stroke="var(--fg-3)" strokeWidth="1.5" fill="none" strokeLinecap="round" aria-hidden="true">
          <path d="M2 1l4 5-4 5" />
        </svg>
      </div>
    </div>
  )
}

/* ── ProgramScreen ── */
export default function ProgramScreen() {
  const router = useRouter()
  const [program, setProgram] = useState<Program | null>(null)
  const [error, setError] = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [weekDays, setWeekDays] = useState<WeekDay[]>([])

  useEffect(() => {
    getActiveProgram()
      .then(p => {
        const days = buildWeekDays(p)
        setProgram(p)
        setWeekDays(days)
        // default selected: today if it has exercises, else first day with exercises
        const todayIdx = days.findIndex(d => d.today && d.exCount > 0)
        const firstIdx = days.findIndex(d => d.exCount > 0)
        setSelectedDayIndex(todayIdx >= 0 ? todayIdx : firstIdx >= 0 ? firstIdx : 0)
      })
      .catch(() => setError(true))
  }, [])

  // Handle swap result from ExerciseLibrary
  useEffect(() => {
    const raw = sessionStorage.getItem("pendingSwap")
    if (!raw) return
    sessionStorage.removeItem("pendingSwap")
    // Swap is cosmetic-only in read-only mode; full swap persistence is out of scope here
  }, [])

  const selectedDay = weekDays[selectedDayIndex]?.programDay ?? null
  const exercises = selectedDay?.exercises ?? []
  const todayLabel = selectedDay
    ? `${DAY_LABELS[selectedDayIndex]} · ${selectedDay.name}`
    : weekDays[selectedDayIndex]?.today ? "Hviledag" : DAY_LABELS[selectedDayIndex]

  if (error) {
    return (
      <div className="screen">
        <div style={{ height: 54 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "0 32px" }}>
          <div style={{ fontSize: 32 }}>🏋️</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fg-0)", textAlign: "center" }}>Ingen aktiv plan</div>
          <div style={{ fontSize: 14, color: "var(--fg-2)", textAlign: "center" }}>Start backend-serveren og sørg for at det finnes et aktivt program.</div>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="screen">
        <div style={{ height: 54 }} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 14, color: "var(--fg-3)" }}>Laster program…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div style={{ height: 54 }} />
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>

        {/* Header */}
        <div style={{ padding: "14px 20px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div className="caption" style={{ marginBottom: 6 }}>Aktiv plan</div>
            <div className="display-l">{program.name}</div>
          </div>
          <div style={{
            fontSize: 11, color: "var(--ai-accent)", fontWeight: 700, letterSpacing: 0.5,
            padding: "6px 10px", borderRadius: 999, background: "var(--ai-accent-soft)",
            border: "1px solid rgba(255,107,53,0.3)", flexShrink: 0, marginTop: 4,
          }}>
            AKTIV
          </div>
        </div>

        <ProgressBar />

        <div style={{ padding: "0 20px 8px" }}>
          <div className="caption" style={{ marginBottom: 10 }}>Denne uken</div>
        </div>
        <WeekStrip days={weekDays} selectedIndex={selectedDayIndex} onSelect={setSelectedDayIndex} />

        <div style={{ padding: "0 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="caption">{todayLabel}</span>
          <span style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500 }}>{exercises.length} øvelser</span>
        </div>

        <div style={{ padding: "0 20px" }}>
          {exercises.length === 0 ? (
            <div className="card" style={{ padding: "32px 16px", textAlign: "center", color: "var(--fg-3)", fontSize: 14 }}>
              Hviledag 💤
            </div>
          ) : (
            <div className="card" style={{ overflow: "hidden" }}>
              {exercises.map((ex, i) => (
                <ExerciseRow
                  key={i}
                  ex={ex}
                  isLast={i === exercises.length - 1}
                  doneCount={0}
                  onNavigate={() => router.push(`/exercises/${ex.exercise_id}`)}
                  onSwap={() => router.push(`/exercises?swap=${i}`)}
                />
              ))}
              <button style={{
                width: "100%", boxSizing: "border-box", padding: "14px 16px",
                borderTop: "1px solid var(--border-1)",
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 13, color: "var(--ai-accent)", fontWeight: 600,
                background: "none", cursor: "pointer",
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M7 2v10M2 7h10" />
                </svg>
                Legg til øvelse
              </button>
            </div>
          )}

          <div style={{ padding: "12px 0 0" }}>
            <button
              onClick={() => router.push("/exercises")}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 16,
                background: "var(--bg-2)", border: "1px solid var(--border-1)",
                color: "var(--fg-2)", fontSize: 13, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Se øvelsebiblioteket →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/program/ProgramScreen.tsx
git commit -m "feat: ProgramScreen loads real program from API"
```

---

## Task 8: ProgramScreen — inline set logging + rest timer

**Files:**
- Modify: `web/src/components/program/ProgramScreen.tsx`
- Uses: `web/src/components/program/RestTimer.tsx` (Task 6)
- Uses: `web/src/lib/api.ts` functions `startWorkout`, `logSet`, `completeWorkout` (Task 5)

This task adds active workout logging to the ProgramScreen from Task 7. When no workout is active, exercises show in read-only mode with a "Start økt" button. When active, each exercise row expands to show editable set inputs.

- [ ] **Step 1: Add imports and logging state to ProgramScreen.tsx**

At the top of the file, update the import line from:
```tsx
import { getActiveProgram, type Program, type ProgramDay, type ProgramExercise } from "@/lib/api"
```
to:
```tsx
import { getActiveProgram, startWorkout, logSet, completeWorkout, type Program, type ProgramDay, type ProgramExercise } from "@/lib/api"
import RestTimer from "@/components/program/RestTimer"
```

Inside the `ProgramScreen` component, after the existing state declarations, add:

```tsx
const [workoutId, setWorkoutId] = useState<string | null>(null)
const [setLog, setSetLog] = useState<Record<string, { reps: number; weightKg: number | null; done: boolean }[]>>({})
const [restTimer, setRestTimer] = useState<boolean>(false)
const [restSeconds, setRestSeconds] = useState<number>(() => {
  if (typeof window === "undefined") return 90
  return parseInt(localStorage.getItem("restTimerSeconds") ?? "90", 10)
})
const [starting, setStarting] = useState(false)
```

- [ ] **Step 2: Add handleStartWorkout, handleCheckSet, handleCompleteWorkout to ProgramScreen**

Add these three functions inside `ProgramScreen`, after the state declarations:

```tsx
function handleStartWorkout() {
  if (!selectedDay || starting) return
  setStarting(true)
  startWorkout(selectedDay.id)
    .then(({ workout_id }) => {
      setWorkoutId(workout_id)
      const log: typeof setLog = {}
      for (const ex of exercises) {
        log[ex.id] = ex.sets.map(s => ({
          reps: s.reps,
          weightKg: s.weight_kg ?? null,
          done: false,
        }))
      }
      setSetLog(log)
    })
    .catch(() => {})
    .finally(() => setStarting(false))
}

function handleCheckSet(ex: ProgramExercise, setIndex: number) {
  if (!workoutId) return
  const entry = setLog[ex.id]?.[setIndex]
  if (!entry || entry.done) return
  logSet(workoutId, {
    exercise_id: ex.exercise_id,
    set_number: setIndex + 1,
    reps: entry.reps,
    weight_kg: entry.weightKg,
  }).catch(() => {})
  setSetLog(prev => {
    const copy = { ...prev }
    copy[ex.id] = copy[ex.id].map((s, i) => i === setIndex ? { ...s, done: true } : s)
    return copy
  })
  setRestTimer(true)
}

function handleCompleteWorkout() {
  if (!workoutId) return
  completeWorkout(workoutId).catch(() => {})
  setWorkoutId(null)
  setSetLog({})
}

function handleChangeRestDefault(s: number) {
  setRestSeconds(s)
  localStorage.setItem("restTimerSeconds", String(s))
}
```

- [ ] **Step 3: Add ActiveExerciseRow component (inside the file, before ProgramScreen)**

Add this new component before the `ProgramScreen` function:

```tsx
function ActiveExerciseRow({ ex, log, isLast, onCheck, onSwap }: {
  ex: ProgramExercise
  log: { reps: number; weightKg: number | null; done: boolean }[]
  isLast: boolean
  onCheck: (setIndex: number) => void
  onSwap: () => void
}) {
  const done = log.filter(s => s.done).length
  const [localLog, setLocalLog] = useState(log)

  useEffect(() => { setLocalLog(log) }, [log])

  function updateReps(i: number, val: string) {
    const n = parseInt(val, 10)
    if (isNaN(n)) return
    setLocalLog(prev => prev.map((s, idx) => idx === i ? { ...s, reps: n } : s))
    log[i].reps = n
  }

  function updateWeight(i: number, val: string) {
    const n = parseFloat(val)
    const kg = isNaN(n) ? null : n
    setLocalLog(prev => prev.map((s, idx) => idx === i ? { ...s, weightKg: kg } : s))
    log[i].weightKg = kg
  }

  return (
    <div style={{ borderBottom: isLast ? "none" : "1px solid var(--border-1)" }}>
      {/* Exercise header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 8px 6px 16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-0)" }}>{ex.name}</div>
        </div>
        <button onClick={onSwap} aria-label="Swap øvelse" style={{
          padding: "4px 10px", borderRadius: 999,
          fontSize: 11, color: "var(--fg-2)", fontWeight: 600,
          background: "var(--bg-3)", border: "1px solid var(--border-1)",
          display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
        }}>
          <svg width="11" height="11" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" aria-hidden="true">
            <path d="M1 4h8l-2-2M11 8H3l2 2" />
          </svg>
          Swap
        </button>
        <div style={{ padding: "0 8px" }}>
          <ExerciseProgressRing done={done} total={ex.sets.length} />
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr 40px", gap: 6, padding: "0 16px 4px" }}>
        {["#", "reps", "kg", ""].map((h, i) => (
          <div key={i} style={{ fontSize: 10, color: "var(--fg-3)", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>{h}</div>
        ))}
      </div>

      {/* Set rows */}
      {localLog.map((s, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "28px 1fr 1fr 40px",
          gap: 6, padding: "6px 16px",
          background: s.done ? "rgba(255,107,53,0.06)" : "transparent",
        }}>
          <div className="tnum" style={{ fontSize: 13, color: "var(--fg-3)", display: "flex", alignItems: "center" }}>{i + 1}</div>
          <input
            type="number"
            value={s.reps}
            disabled={s.done}
            onChange={e => updateReps(i, e.target.value)}
            style={{
              background: s.done ? "transparent" : "var(--bg-3)",
              border: s.done ? "none" : "1px solid var(--border-1)",
              borderRadius: 8, padding: "5px 8px",
              color: s.done ? "var(--fg-2)" : "var(--fg-0)",
              fontSize: 13, fontWeight: 600, width: "100%", boxSizing: "border-box",
            }}
          />
          <input
            type="number"
            value={s.weightKg ?? ""}
            disabled={s.done}
            placeholder="BW"
            onChange={e => updateWeight(i, e.target.value)}
            style={{
              background: s.done ? "transparent" : "var(--bg-3)",
              border: s.done ? "none" : "1px solid var(--border-1)",
              borderRadius: 8, padding: "5px 8px",
              color: s.done ? "var(--fg-2)" : "var(--fg-0)",
              fontSize: 13, fontWeight: 600, width: "100%", boxSizing: "border-box",
            }}
          />
          <button
            onClick={() => onCheck(i)}
            disabled={s.done}
            aria-label={`Fullfør sett ${i + 1}`}
            style={{
              width: 32, height: 32, borderRadius: 999,
              background: s.done ? "var(--ai-accent)" : "var(--bg-3)",
              border: s.done ? "none" : "1px solid var(--border-1)",
              color: s.done ? "var(--primary-foreground)" : "var(--fg-2)",
              display: "grid", placeItems: "center", cursor: s.done ? "default" : "pointer",
              fontSize: 14,
            }}
          >
            ✓
          </button>
        </div>
      ))}
      <div style={{ height: 8 }} />
    </div>
  )
}
```

- [ ] **Step 4: Update the exercise list in ProgramScreen's return JSX**

Find the exercise list section (the `div className="card"` that maps over exercises) and replace it with a conditional that uses `ActiveExerciseRow` when a workout is active, or `ExerciseRow` when not. Also add the "Start økt" / "Fullfør økt" buttons and the RestTimer overlay.

Replace the `<div className="card" style={{ overflow: "hidden" }}>` block and the "Se øvelsebiblioteket" button with:

```tsx
{exercises.length === 0 ? (
  <div className="card" style={{ padding: "32px 16px", textAlign: "center", color: "var(--fg-3)", fontSize: 14 }}>
    Hviledag 💤
  </div>
) : (
  <>
    <div className="card" style={{ overflow: "hidden" }}>
      {workoutId
        ? exercises.map((ex, i) => (
            <ActiveExerciseRow
              key={i}
              ex={ex}
              log={setLog[ex.id] ?? ex.sets.map(s => ({ reps: s.reps, weightKg: s.weight_kg ?? null, done: false }))}
              isLast={i === exercises.length - 1}
              onCheck={setIndex => handleCheckSet(ex, setIndex)}
              onSwap={() => router.push(`/exercises?swap=${i}`)}
            />
          ))
        : exercises.map((ex, i) => (
            <ExerciseRow
              key={i}
              ex={ex}
              isLast={i === exercises.length - 1}
              doneCount={0}
              onNavigate={() => router.push(`/exercises/${ex.exercise_id}`)}
              onSwap={() => router.push(`/exercises?swap=${i}`)}
            />
          ))
      }
      {!workoutId && (
        <button style={{
          width: "100%", boxSizing: "border-box", padding: "14px 16px",
          borderTop: "1px solid var(--border-1)",
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 13, color: "var(--ai-accent)", fontWeight: 600,
          background: "none", cursor: "pointer",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M7 2v10M2 7h10" />
          </svg>
          Legg til øvelse
        </button>
      )}
    </div>

    {/* Start / Complete workout */}
    {!workoutId ? (
      <button
        onClick={handleStartWorkout}
        disabled={starting}
        style={{
          width: "100%", marginTop: 12, padding: "16px 0", borderRadius: 16,
          background: "var(--ai-accent)", border: "none",
          color: "var(--primary-foreground)", fontSize: 15, fontWeight: 700,
          cursor: starting ? "default" : "pointer", opacity: starting ? 0.7 : 1,
        }}
      >
        {starting ? "Starter…" : "Start økt"}
      </button>
    ) : (() => {
      const allDone = exercises.every(ex =>
        (setLog[ex.id] ?? []).every(s => s.done)
      )
      return allDone ? (
        <button
          onClick={handleCompleteWorkout}
          style={{
            width: "100%", marginTop: 12, padding: "16px 0", borderRadius: 16,
            background: "var(--ai-accent)", border: "none",
            color: "var(--primary-foreground)", fontSize: 15, fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Fullfør økt ✓
        </button>
      ) : (
        <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 16, background: "var(--bg-2)", border: "1px solid var(--border-1)", textAlign: "center", fontSize: 13, color: "var(--fg-2)" }}>
          Økt pågår…
        </div>
      )
    })()}

    <div style={{ padding: "12px 0 0" }}>
      <button
        onClick={() => router.push("/exercises")}
        style={{
          width: "100%", padding: "14px 0", borderRadius: 16,
          background: "var(--bg-2)", border: "1px solid var(--border-1)",
          color: "var(--fg-2)", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}
      >
        Se øvelsebiblioteket →
      </button>
    </div>
  </>
)}

{/* Rest timer overlay */}
{restTimer && (
  <RestTimer
    seconds={restSeconds}
    onDone={() => setRestTimer(false)}
    onChangeDefault={handleChangeRestDefault}
  />
)}
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/program/ProgramScreen.tsx
git commit -m "feat: inline set logging with rest timer in ProgramScreen"
```

---

## Task 9: WorkoutLog — real data

**Files:**
- Modify: `web/src/components/log/WorkoutLog.tsx`

Replace `MOCK_WORKOUTS` with data from `getWorkouts()`. The existing UI types and components stay intact. We need a `mapWorkout` function that converts the API shape to the UI's `Workout` type. Exercise names are looked up using `getExercise(id)` from the local exercises library.

- [ ] **Step 1: Update WorkoutLog.tsx imports and add mapWorkout**

At the top of `web/src/components/log/WorkoutLog.tsx`, replace:
```tsx
import { useState } from "react"
```
with:
```tsx
import { useState, useEffect } from "react"
import { getWorkouts, type Workout as ApiWorkout } from "@/lib/api"
import { getExercise } from "@/lib/exercises"
```

Add the `mapWorkout` function just before `const SPARKLINE_POINTS`:

```tsx
function mapWorkout(raw: ApiWorkout & { started_at?: string | null }): Workout {
  // Group sets by exercise_id
  const byExercise: Record<string, typeof raw.sets> = {}
  for (const s of raw.sets) {
    if (!byExercise[s.exercise_id]) byExercise[s.exercise_id] = []
    byExercise[s.exercise_id].push(s)
  }

  const exercises: Exercise[] = Object.entries(byExercise).map(([exId, sets]) => ({
    name: getExercise(exId)?.name ?? exId,
    sets: sets.map(s => ({
      set: s.set_number,
      kg: s.weight_kg ?? 0,
      reps: s.reps ?? 0,
      rpe: s.rpe ?? 0,
    })),
  }))

  const firstName = exercises[0]?.name ?? "Treningsøkt"
  const label = firstName.slice(0, 2).toUpperCase()
  const hue = raw.workout_id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360

  const volume = raw.sets.reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0)
  const totalSets = raw.sets.length

  const dt = raw.date ? new Date(raw.date) : new Date()
  const day = dt.toLocaleDateString("no-NO", { weekday: "long" })
    .replace(/^\w/, c => c.toUpperCase())

  let duration = "–"
  if (raw.started_at && raw.date) {
    const mins = Math.round((new Date(raw.date).getTime() - new Date(raw.started_at).getTime()) / 60000)
    if (mins > 0) duration = `${mins} min`
  }

  return {
    id: raw.workout_id,
    label,
    hue,
    name: firstName,
    day,
    duration,
    volume,
    totalSets,
    rpe: raw.rpe ?? 0,
    prs: 0,
    exercises,
  }
}
```

- [ ] **Step 2: Replace MOCK_WORKOUTS usage in WorkoutLog component**

Find the `WorkoutLog` function and replace:
```tsx
export default function WorkoutLog() {
  const [activeFilter, setActiveFilter] = useState("Alle")

  const totalVolume = MOCK_WORKOUTS.reduce((sum, w) => sum + w.volume, 0)

  const filtered = activeFilter === "Alle"
    ? MOCK_WORKOUTS
    : MOCK_WORKOUTS.filter(w => w.name.toLowerCase().startsWith(activeFilter.toLowerCase()))
```

with:
```tsx
export default function WorkoutLog() {
  const [activeFilter, setActiveFilter] = useState("Alle")
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWorkouts()
      .then(raw => setWorkouts(raw.map(w => mapWorkout(w as any))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalVolume = workouts.reduce((sum, w) => sum + w.volume, 0)

  const filtered = activeFilter === "Alle"
    ? workouts
    : workouts.filter(w => w.name.toLowerCase().startsWith(activeFilter.toLowerCase()))
```

- [ ] **Step 3: Add loading and empty states**

Find the workout list section:
```tsx
{filtered.length === 0 ? (
  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--fg-3)", fontSize: 14 }}>
    Ingen økter for dette filteret
  </div>
) : (
  filtered.map(w => <WorkoutCard key={w.id} workout={w} />)
)}
```

Replace with:
```tsx
{loading ? (
  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--fg-3)", fontSize: 14 }}>
    Laster treningslogg…
  </div>
) : filtered.length === 0 ? (
  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--fg-3)", fontSize: 14 }}>
    {workouts.length === 0 ? "Ingen treninger ennå" : "Ingen økter for dette filteret"}
  </div>
) : (
  filtered.map(w => <WorkoutCard key={w.id} workout={w} />)
)}
```

- [ ] **Step 4: Remove the MOCK_WORKOUTS and SPARKLINE_POINTS constants**

Delete these lines from the top of the file (the mock data block):
```tsx
const MOCK_WORKOUTS: Workout[] = [ ... ]
const SPARKLINE_POINTS = [5100, 5600, 5420, 5840, 8210, 6120]
```

Replace `SPARKLINE_POINTS` reference in the JSX with a computed value from real data:
Find:
```tsx
<Sparkline points={SPARKLINE_POINTS} width={72} height={28} />
```
Replace with:
```tsx
<Sparkline points={workouts.map(w => w.volume).slice(0, 6).reverse()} width={72} height={28} />
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/log/WorkoutLog.tsx
git commit -m "feat: WorkoutLog reads real workout history from API"
```
