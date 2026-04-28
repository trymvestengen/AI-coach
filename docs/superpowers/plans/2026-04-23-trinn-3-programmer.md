# Trinn 3: Programmer + Øvelsesbibliotek — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Legge til Program-fane og øvelsesbibliotek — tre nye DB-tabeller, én ny Claude-tool (`create_program`), tre nye API-endepunkter, og tre nye React-komponenter.

**Architecture:** Normalisert Postgres-schema (`programs` → `program_days` → `program_exercises`). Backend i FastAPI med psycopg3. Frontend i Next.js 15 App Router med `"use client"`-komponenter etter samme mønster som WorkoutLog.

**Tech Stack:** Python 3.12, FastAPI, psycopg3, pytest-asyncio, Next.js 15, TypeScript, Tailwind CSS

---

## File Structure

**Create:**
- `api/db/migrations/002_programs.sql` — SQL for tre nye tabeller
- `api/app/routers/programs.py` — GET /api/programs, GET /api/programs/{id}, GET /api/exercises
- `api/tests/test_create_program_tool.py` — tester for create_program handler
- `api/tests/test_programs_router.py` — tester for de tre nye endepunktene
- `web/src/components/program/ProgramList.tsx` — programliste-komponent
- `web/src/components/program/ProgramDetail.tsx` — detaljvisning med dag-tabs
- `web/src/components/program/ExerciseLibrary.tsx` — øvelsesbibliotek-modal

**Modify:**
- `api/app/tools/handlers.py` — erstatt stub `create_program` med async DB-versjon, oppdater `handle_tool`
- `api/app/tools/definitions.py` — erstatt gammel `create_program`-definisjon med ny schema
- `api/app/main.py` — inkluder programs router
- `web/src/lib/api.ts` — legg til Program/ProgramDay/ProgramExercise/Exercise typer + tre nye fetch-funksjoner
- `web/src/app/(tabs)/program/page.tsx` — erstatt placeholder med `<ProgramList />`

---

## Task 1: DB Migration

**Files:**
- Create: `api/db/migrations/002_programs.sql`

- [ ] **Step 1: Skriv SQL-migrasjonsfilen**

```sql
-- api/db/migrations/002_programs.sql
CREATE TABLE IF NOT EXISTS programs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id),
    name       TEXT NOT NULL,
    is_active  BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS program_days (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    name       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS program_exercises (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_day_id UUID NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
    exercise_id    TEXT NOT NULL REFERENCES exercises(id),
    sets           INTEGER NOT NULL,
    reps           INTEGER NOT NULL,
    weight_kg      NUMERIC(6, 2),
    order_index    INTEGER NOT NULL DEFAULT 0
);
```

- [ ] **Step 2: Kjør migrasjon i Supabase**

Lim inn hele innholdet av `api/db/migrations/002_programs.sql` i Supabase SQL Editor og kjør. Forventet output: "Success. No rows returned."

- [ ] **Step 3: Commit**

```bash
git add api/db/migrations/002_programs.sql
git commit -m "feat: add programs/program_days/program_exercises migration"
```

---

## Task 2: create_program Tool (DB-backed)

**Files:**
- Modify: `api/app/tools/handlers.py`
- Modify: `api/app/tools/definitions.py`
- Create: `api/tests/test_create_program_tool.py`

- [ ] **Step 1: Skriv failing tester**

Opprett `api/tests/test_create_program_tool.py`:

```python
import pytest
from unittest.mock import AsyncMock, patch

from app.tools.handlers import create_program, handle_tool


@pytest.mark.asyncio
async def test_create_program_returns_program_id(mock_conn, make_mock_get_conn):
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        result = await create_program(
            name="3-day strength",
            days=[
                {"name": "Legs", "exercises": [{"exercise_id": "squat", "sets": 4, "reps": 5}]},
            ],
        )
    assert "program_id" in result
    assert result["name"] == "3-day strength"
    assert result["days_count"] == 1


@pytest.mark.asyncio
async def test_create_program_calls_commit(mock_conn, make_mock_get_conn):
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        await create_program(
            name="Test",
            days=[{"name": "Day 1", "exercises": []}],
        )
    mock_conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_handle_tool_create_program_is_awaitable(mock_conn, make_mock_get_conn):
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        result = await handle_tool(
            "create_program",
            {
                "name": "My program",
                "days": [{"name": "Push", "exercises": [{"exercise_id": "bench-press", "sets": 3, "reps": 8}]}],
            },
        )
    assert "program_id" in result
```

- [ ] **Step 2: Kjør tester for å verifisere at de feiler**

```bash
cd api && python -m pytest tests/test_create_program_tool.py -v
```

Forventet: FAIL — `create_program() got unexpected keyword argument 'name'`

- [ ] **Step 3: Erstatt stub create_program i handlers.py**

I `api/app/tools/handlers.py`, finn den gamle synkrone `create_program`-funksjonen (linje ~43-51) og erstatt den med:

```python
async def create_program(name: str, days: list) -> dict:
    program_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "UPDATE programs SET is_active = false WHERE user_id = %s",
                (TEST_USER_ID,),
            )
            await conn.execute(
                "INSERT INTO programs (id, user_id, name, is_active) VALUES (%s, %s, %s, true)",
                (program_id, TEST_USER_ID, name),
            )
            for i, day in enumerate(days, start=1):
                day_id = str(uuid.uuid4())
                await conn.execute(
                    "INSERT INTO program_days (id, program_id, day_number, name) VALUES (%s, %s, %s, %s)",
                    (day_id, program_id, i, day["name"]),
                )
                for j, ex in enumerate(day.get("exercises", [])):
                    await conn.execute(
                        "INSERT INTO program_exercises "
                        "(program_day_id, exercise_id, sets, reps, weight_kg, order_index) "
                        "VALUES (%s, %s, %s, %s, %s, %s)",
                        (day_id, ex["exercise_id"], ex["sets"], ex["reps"], ex.get("weight_kg"), j),
                    )
            await conn.commit()
    except Exception as e:
        return {"error": f"Failed to create program: {e}"}
    return {"program_id": program_id, "name": name, "days_count": len(days)}
```

- [ ] **Step 4: Oppdater handle_tool-dispatchen**

I `handle_tool`-funksjonen, finn linjen `if name == "create_program":` og endre til:

```python
    if name == "create_program":
        return await create_program(**inputs)
```

- [ ] **Step 5: Erstatt tool-definisjonen i definitions.py**

I `api/app/tools/definitions.py`, finn hele `create_program`-blokken (dict med `"name": "create_program"`) og erstatt den med:

```python
    {
        "name": "create_program",
        "description": "Create and save a structured training program to the database. Call this when the user asks for a training plan. The new program becomes their active program.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Name of the program, e.g. '3-dagers styrkeprogram'",
                },
                "days": {
                    "type": "array",
                    "description": "List of training days",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "Day name, e.g. 'Ben', 'Overkropp', 'Helkropp'",
                            },
                            "exercises": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "exercise_id": {
                                            "type": "string",
                                            "description": "Exercise ID from the exercise library, e.g. 'squat', 'bench-press'",
                                        },
                                        "sets": {"type": "integer"},
                                        "reps": {"type": "integer"},
                                        "weight_kg": {
                                            "type": "number",
                                            "description": "Starting weight in kg (optional)",
                                        },
                                    },
                                    "required": ["exercise_id", "sets", "reps"],
                                },
                            },
                        },
                        "required": ["name", "exercises"],
                    },
                },
            },
            "required": ["name", "days"],
        },
    },
```

- [ ] **Step 6: Kjør alle tester**

```bash
cd api && python -m pytest tests/test_create_program_tool.py -v
```

Forventet: 3 tests PASS

- [ ] **Step 7: Kjør eksisterende testsuite for å sjekke ingen regresjoner**

```bash
cd api && python -m pytest -v
```

Forventet: Alle 22 eksisterende tester PASS + 3 nye = 25 total

- [ ] **Step 8: Commit**

```bash
git add api/app/tools/handlers.py api/app/tools/definitions.py api/tests/test_create_program_tool.py
git commit -m "feat: implement create_program tool with DB persistence"
```

---

## Task 3: Programs Router

**Files:**
- Create: `api/app/routers/programs.py`
- Modify: `api/app/main.py`
- Create: `api/tests/test_programs_router.py`

- [ ] **Step 1: Skriv failing tester**

Opprett `api/tests/test_programs_router.py`:

```python
import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_get_programs_returns_empty_list(mock_conn, make_mock_get_conn):
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[])
    mock_conn.execute = AsyncMock(return_value=mock_cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/programs")

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_programs_returns_program_list(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000002")
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[(prog_id, "3-day strength", True, 3)])
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=mock_cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/programs")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "3-day strength"
    assert data[0]["is_active"] is True
    assert data[0]["days_count"] == 3


@pytest.mark.asyncio
async def test_get_program_detail_returns_days(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000002")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000010")

    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=(prog_id, "3-day strength", True))

    cur_days = AsyncMock()
    cur_days.fetchall = AsyncMock(return_value=[
        (
            day_id, 1, "Legs",
            [{"id": "cc", "exercise_id": "squat", "name": "Squat",
              "sets": 4, "reps": 5, "weight_kg": 80.0, "muscle_groups": ["quads"]}],
        )
    ])

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_days])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(f"/api/programs/{prog_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "3-day strength"
    assert len(data["days"]) == 1
    assert data["days"][0]["name"] == "Legs"
    assert data["days"][0]["exercises"][0]["exercise_id"] == "squat"


@pytest.mark.asyncio
async def test_get_exercises_returns_list(make_mock_get_conn):
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[
        ("squat", "Squat", ["quads", "glutes", "hamstrings"], ["barbell", "rack"], "intermediate")
    ])
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=mock_cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/exercises")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == "squat"
    assert data[0]["muscle_groups"] == ["quads", "glutes", "hamstrings"]
```

- [ ] **Step 2: Kjør tester for å verifisere at de feiler**

```bash
cd api && python -m pytest tests/test_programs_router.py -v
```

Forventet: FAIL — 404 Not Found (router ikke registrert ennå)

- [ ] **Step 3: Opprett programs router**

Opprett `api/app/routers/programs.py`:

```python
from fastapi import APIRouter, HTTPException
from app.db import get_conn
from app.constants import TEST_USER_ID

router = APIRouter()


@router.get("/programs")
async def get_programs() -> list:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT p.id, p.name, p.is_active,
                       COUNT(pd.id)::int AS days_count
                FROM programs p
                LEFT JOIN program_days pd ON pd.program_id = p.id
                WHERE p.user_id = %s
                GROUP BY p.id, p.name, p.is_active, p.created_at
                ORDER BY p.is_active DESC, p.created_at DESC
                """,
                (TEST_USER_ID,),
            )
            rows = await cur.fetchall()
    except Exception:
        return []
    return [
        {"id": str(r[0]), "name": r[1], "is_active": r[2], "days_count": r[3]}
        for r in rows
    ]


@router.get("/programs/{program_id}")
async def get_program(program_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id, name, is_active FROM programs WHERE id = %s AND user_id = %s",
                (program_id, TEST_USER_ID),
            )
            prog = await cur.fetchone()
            if prog is None:
                raise HTTPException(status_code=404, detail="Program not found")

            cur = await conn.execute(
                """
                SELECT pd.id, pd.day_number, pd.name,
                       json_agg(
                           json_build_object(
                               'id', pe.id::text,
                               'exercise_id', pe.exercise_id,
                               'name', e.name,
                               'sets', pe.sets,
                               'reps', pe.reps,
                               'weight_kg', pe.weight_kg::float,
                               'muscle_groups', e.muscle_groups
                           ) ORDER BY pe.order_index
                       ) AS exercises
                FROM program_days pd
                JOIN program_exercises pe ON pe.program_day_id = pd.id
                JOIN exercises e ON e.id = pe.exercise_id
                WHERE pd.program_id = %s
                GROUP BY pd.id, pd.day_number, pd.name
                ORDER BY pd.day_number
                """,
                (program_id,),
            )
            day_rows = await cur.fetchall()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "id": str(prog[0]),
        "name": prog[1],
        "is_active": prog[2],
        "days": [
            {
                "id": str(r[0]),
                "day_number": r[1],
                "name": r[2],
                "exercises": r[3] or [],
            }
            for r in day_rows
        ],
    }


@router.get("/exercises")
async def get_exercises(muscle_group: str | None = None) -> list:
    try:
        async with get_conn() as conn:
            if muscle_group:
                cur = await conn.execute(
                    "SELECT id, name, muscle_groups, equipment, difficulty "
                    "FROM exercises WHERE %s = ANY(muscle_groups) ORDER BY name",
                    (muscle_group,),
                )
            else:
                cur = await conn.execute(
                    "SELECT id, name, muscle_groups, equipment, difficulty FROM exercises ORDER BY name"
                )
            rows = await cur.fetchall()
    except Exception:
        return []
    return [
        {"id": r[0], "name": r[1], "muscle_groups": r[2], "equipment": r[3], "difficulty": r[4]}
        for r in rows
    ]
```

- [ ] **Step 4: Registrer router i main.py**

I `api/app/main.py`, legg til etter `from app.routers import workouts`:

```python
from app.routers import programs
```

Og etter `app.include_router(workouts.router, prefix="/api")`:

```python
app.include_router(programs.router, prefix="/api")
```

- [ ] **Step 5: Kjør tester**

```bash
cd api && python -m pytest tests/test_programs_router.py -v
```

Forventet: 4 tests PASS

- [ ] **Step 6: Kjør full testsuite**

```bash
cd api && python -m pytest -v
```

Forventet: Alle 28 tester PASS (25 fra Task 2 + 3... wait: 22 existing + 3 task2 + 4 task3 = 29)

- [ ] **Step 7: Commit**

```bash
git add api/app/routers/programs.py api/app/main.py api/tests/test_programs_router.py
git commit -m "feat: add GET /api/programs, /api/programs/{id}, /api/exercises endpoints"
```

---

## Task 4: Seed Program

**Files:**
- Create: `api/db/seed_programs.sql`

- [ ] **Step 1: Skriv seed SQL-fil**

Opprett `api/db/seed_programs.sql` med følgende innhold:

```sql
-- Seed: 3-dagers styrkeprogram for test user
INSERT INTO programs (id, user_id, name, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '3-dagers styrkeprogram',
    true
)
ON CONFLICT (id) DO NOTHING;

-- Day 1: Ben
INSERT INTO program_days (id, program_id, day_number, name)
VALUES ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 1, 'Ben')
ON CONFLICT (id) DO NOTHING;

INSERT INTO program_exercises (program_day_id, exercise_id, sets, reps, weight_kg, order_index) VALUES
('00000000-0000-0000-0000-000000000010', 'squat',             4, 5,  80, 0),
('00000000-0000-0000-0000-000000000010', 'leg-press',         3, 10, 100, 1),
('00000000-0000-0000-0000-000000000010', 'lunge',             3, 12, 20, 2),
('00000000-0000-0000-0000-000000000010', 'romanian-deadlift', 3, 10, 60, 3)
ON CONFLICT DO NOTHING;

-- Day 2: Overkropp
INSERT INTO program_days (id, program_id, day_number, name)
VALUES ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002', 2, 'Overkropp')
ON CONFLICT (id) DO NOTHING;

INSERT INTO program_exercises (program_day_id, exercise_id, sets, reps, weight_kg, order_index) VALUES
('00000000-0000-0000-0000-000000000011', 'bench-press',     4, 5,  70, 0),
('00000000-0000-0000-0000-000000000011', 'overhead-press',  3, 8,  50, 1),
('00000000-0000-0000-0000-000000000011', 'dumbbell-row',    3, 10, 30, 2),
('00000000-0000-0000-0000-000000000011', 'bicep-curl',      3, 12, 15, 3),
('00000000-0000-0000-0000-000000000011', 'tricep-pushdown', 3, 12, 20, 4)
ON CONFLICT DO NOTHING;

-- Day 3: Helkropp
INSERT INTO program_days (id, program_id, day_number, name)
VALUES ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002', 3, 'Helkropp')
ON CONFLICT (id) DO NOTHING;

INSERT INTO program_exercises (program_day_id, exercise_id, sets, reps, weight_kg, order_index) VALUES
('00000000-0000-0000-0000-000000000012', 'deadlift',     4, 5,  100, 0),
('00000000-0000-0000-0000-000000000012', 'pull-up',      3, 8,  null, 1),
('00000000-0000-0000-0000-000000000012', 'lat-pulldown', 3, 10, 60,  2),
('00000000-0000-0000-0000-000000000012', 'face-pull',    3, 15, 20,  3),
('00000000-0000-0000-0000-000000000012', 'dip',          3, 10, null, 4)
ON CONFLICT DO NOTHING;
```

- [ ] **Step 2: Kjør seed i Supabase**

Lim inn hele innholdet av `api/db/seed_programs.sql` i Supabase SQL Editor og kjør. Forventet: "Success. No rows returned."

- [ ] **Step 3: Verifiser seed**

Kjør i Supabase SQL Editor:
```sql
SELECT p.name, COUNT(pd.id) as days FROM programs p JOIN program_days pd ON pd.program_id = p.id GROUP BY p.name;
```
Forventet: `3-dagers styrkeprogram | 3`

- [ ] **Step 4: Commit**

```bash
git add api/db/seed_programs.sql
git commit -m "feat: add seed SQL for 3-day strength program"
```

---

## Task 5: Frontend Types + API Functions

**Files:**
- Modify: `web/src/lib/api.ts`

- [ ] **Step 1: Legg til typer og funksjoner i api.ts**

Legg til følgende på slutten av `web/src/lib/api.ts` (etter den eksisterende `getWorkouts`-funksjonen):

```ts
export type ProgramExercise = {
  id: string
  exercise_id: string
  name: string
  sets: number
  reps: number
  weight_kg: number | null
  muscle_groups: string[]
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

export async function getPrograms(): Promise<Program[]> {
  const url = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/programs`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Program[]>
}

export async function getProgram(id: string): Promise<Program> {
  const url = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/programs/${id}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Program>
}

export async function getExercises(muscleGroup?: string): Promise<Exercise[]> {
  const base = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/exercises`
  const url = muscleGroup ? `${base}?muscle_group=${encodeURIComponent(muscleGroup)}` : base
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Exercise[]>
}
```

- [ ] **Step 2: Verifiser TypeScript**

```bash
cd web && npx tsc --noEmit
```

Forventet: No errors

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/api.ts
git commit -m "feat: add Program/Exercise types and API functions"
```

---

## Task 6: ProgramList Component + Program Page

**Files:**
- Create: `web/src/components/program/ProgramList.tsx`
- Modify: `web/src/app/(tabs)/program/page.tsx`

- [ ] **Step 1: Opprett ProgramList.tsx**

Opprett `web/src/components/program/ProgramList.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { getPrograms, type Program } from "@/lib/api"
import ProgramDetail from "./ProgramDetail"

export default function ProgramList() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    getPrograms()
      .then(setPrograms)
      .catch((err) => console.error("Failed to fetch programs:", err))
      .finally(() => setLoading(false))
  }, [])

  if (selectedId) {
    return <ProgramDetail programId={selectedId} onBack={() => setSelectedId(null)} />
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm p-4">Laster programmer...</p>
  }

  if (programs.length === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground text-sm">
          Ingen programmer enda. Be coachen lage et program for deg!
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {programs.map((p) => (
        <button
          key={p.id}
          onClick={() => setSelectedId(p.id)}
          className="bg-card border rounded-lg p-3 text-left hover:bg-accent transition-colors"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-sm">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.days_count} dager</p>
            </div>
            {p.is_active && (
              <span className="text-xs text-green-500 font-medium">Aktiv</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
```

Merk: `ProgramDetail` importeres her men opprettes i Task 7 — TypeScript vil klage til da. Det er OK; vi fikser det i neste task.

- [ ] **Step 2: Oppdater program/page.tsx**

Erstatt hele innholdet i `web/src/app/(tabs)/program/page.tsx`:

```tsx
import ProgramList from "@/components/program/ProgramList"

export default function ProgramPage() {
  return (
    <div>
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Program</h1>
        <p className="text-muted-foreground text-sm mt-1">Dine treningsprogrammer</p>
      </div>
      <ProgramList />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/program/ProgramList.tsx web/src/app/(tabs)/program/page.tsx
git commit -m "feat: add ProgramList component and update program page"
```

---

## Task 7: ProgramDetail Component

**Files:**
- Create: `web/src/components/program/ProgramDetail.tsx`

- [ ] **Step 1: Opprett ProgramDetail.tsx**

Opprett `web/src/components/program/ProgramDetail.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { getProgram, type Program, type ProgramDay } from "@/lib/api"
import ExerciseLibrary from "./ExerciseLibrary"

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

interface Props {
  programId: string
  onBack: () => void
}

export default function ProgramDetail({ programId, onBack }: Props) {
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(0)
  const [libraryDayId, setLibraryDayId] = useState<string | null>(null)

  useEffect(() => {
    getProgram(programId)
      .then(setProgram)
      .catch((err) => console.error("Failed to fetch program:", err))
      .finally(() => setLoading(false))
  }, [programId])

  if (loading) return <p className="text-muted-foreground text-sm p-4">Laster program...</p>
  if (!program) return <p className="text-muted-foreground text-sm p-4">Program ikke funnet.</p>

  const days = program.days ?? []
  const day: ProgramDay | undefined = days[activeDay]

  if (libraryDayId) {
    return (
      <ExerciseLibrary
        programId={programId}
        dayId={libraryDayId}
        onClose={() => setLibraryDayId(null)}
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
          <div key={ex.id} className="bg-card border rounded-lg p-3 flex gap-3 items-center">
            <div
              className="w-8 h-8 rounded-md flex-shrink-0"
              style={{ backgroundColor: muscleColor(ex.muscle_groups) }}
            />
            <div>
              <p className="font-medium text-sm">{ex.name}</p>
              <p className="text-xs text-muted-foreground">
                {ex.sets} × {ex.reps} reps{ex.weight_kg ? ` · ${ex.weight_kg} kg` : ""}
              </p>
            </div>
          </div>
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

- [ ] **Step 2: Verifiser TypeScript (forventer feil)**

```bash
cd web && npx tsc --noEmit
```

Forventet: FAIL — `Cannot find module './ExerciseLibrary'`. Dette er forventet; ExerciseLibrary opprettes i Task 8.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/program/ProgramDetail.tsx
git commit -m "feat: add ProgramDetail component with day-tabs and exercise list"
```

---

## Task 8: ExerciseLibrary Component

**Files:**
- Create: `web/src/components/program/ExerciseLibrary.tsx`

- [ ] **Step 1: Opprett ExerciseLibrary.tsx**

Opprett `web/src/components/program/ExerciseLibrary.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { getExercises, type Exercise } from "@/lib/api"

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
}

export default function ExerciseLibrary({ onClose }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | undefined>()
  const [search, setSearch] = useState("")

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
            <div key={ex.id} className="bg-card border rounded-lg p-3">
              <p className="font-medium text-sm">{ex.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {ex.muscle_groups.join(", ")} · {ex.difficulty}
              </p>
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

- [ ] **Step 2: Verifiser TypeScript**

```bash
cd web && npx tsc --noEmit
```

Forventet: No errors

- [ ] **Step 3: Kjør full backend testsuite**

```bash
cd api && python -m pytest -v
```

Forventet: 29 tester PASS

- [ ] **Step 4: Manuell smoke-test**

1. Start backend: `cd api && uvicorn app.main:app --reload`
2. Start frontend: `cd web && npm run dev`
3. Åpne http://localhost:3000
4. Gå til Program-fanen — skal vise "3-dagers styrkeprogram" med grønn "Aktiv"-badge
5. Trykk på programmet — skal vise "Dag 1: Ben", "Dag 2: Overkropp", "Dag 3: Helkropp"-tabs
6. Trykk "Dag 1: Ben" — skal vise øvelser (Squat, Leg Press, Lunge, Romanian Deadlift)
7. Trykk "+ Legg til øvelse" — skal åpne øvelsesbiblioteket
8. Filtrer på "Bryst" — skal vise Bench Press, Dip, Incline Dumbbell Press
9. Søk på "squat" — skal vise Squat
10. Chat med coachen: "Lag et nytt 2-dagers program for meg med push/pull-dager" — coachen skal kalle `create_program`, og Program-fanen skal vise det nye programmet

- [ ] **Step 5: Commit**

```bash
git add web/src/components/program/ExerciseLibrary.tsx
git commit -m "feat: add ExerciseLibrary component with muscle group filter and search"
```
