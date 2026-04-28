# Trinn 4: Legg til øvelse i program — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gjøre det mulig å legge til øvelser i et program fra øvelsesbiblioteket med inline sett/reps/vekt-felter.

**Architecture:** Nytt POST-endepunkt i programs.py. `addExerciseToDay` i api.ts. ExerciseLibrary får inline-expand UX. ProgramDetail refresher etter tillegg.

**Tech Stack:** Python 3.12, FastAPI, psycopg3, pytest-asyncio, Next.js 15, TypeScript, Tailwind CSS

---

## File Structure

**Create:**
- `api/tests/test_add_exercise_router.py` — 3 tester for nytt endepunkt

**Modify:**
- `api/app/routers/programs.py` — legg til POST-endepunkt + Pydantic body-modell
- `web/src/lib/api.ts` — legg til `addExerciseToDay`-funksjon
- `web/src/components/program/ExerciseLibrary.tsx` — inline-expand UX + kall API
- `web/src/components/program/ProgramDetail.tsx` — send `onAdd`-callback til ExerciseLibrary

---

## Task 1: POST /api/programs/{program_id}/days/{day_id}/exercises

**Files:**
- Modify: `api/app/routers/programs.py`
- Create: `api/tests/test_add_exercise_router.py`

- [ ] **Step 1: Skriv failing tester**

Opprett `api/tests/test_add_exercise_router.py`:

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
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000010")

    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=(prog_id,))

    cur_day = AsyncMock()
    cur_day.fetchone = AsyncMock(return_value=(day_id,))

    cur_order = AsyncMock()
    cur_order.fetchone = AsyncMock(return_value=(2,))

    cur_ex = AsyncMock()
    cur_ex.fetchone = AsyncMock(return_value=("Squat", ["quads", "glutes"]))

    cur_insert = AsyncMock()

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_day, cur_order, cur_ex, cur_insert])
    conn.commit = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/programs/{prog_id}/days/{day_id}/exercises",
                json={"exercise_id": "squat", "sets": 3, "reps": 10, "weight_kg": 80.0},
            )

    assert response.status_code == 200
    data = response.json()
    assert data["exercise_id"] == "squat"
    assert data["sets"] == 3
    assert data["reps"] == 10
    assert data["order_index"] == 2


@pytest.mark.asyncio
async def test_add_exercise_to_day_returns_404_for_invalid_day(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000002")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000099")

    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=(prog_id,))

    cur_day = AsyncMock()
    cur_day.fetchone = AsyncMock(return_value=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_day])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/programs/{prog_id}/days/{day_id}/exercises",
                json={"exercise_id": "squat", "sets": 3, "reps": 10},
            )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_add_first_exercise_to_empty_day_gets_order_index_zero(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000002")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000010")

    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=(prog_id,))

    cur_day = AsyncMock()
    cur_day.fetchone = AsyncMock(return_value=(day_id,))

    cur_order = AsyncMock()
    cur_order.fetchone = AsyncMock(return_value=(0,))

    cur_ex = AsyncMock()
    cur_ex.fetchone = AsyncMock(return_value=("Squat", ["quads", "glutes"]))

    cur_insert = AsyncMock()

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_day, cur_order, cur_ex, cur_insert])
    conn.commit = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/programs/{prog_id}/days/{day_id}/exercises",
                json={"exercise_id": "squat", "sets": 3, "reps": 10},
            )

    assert response.status_code == 200
    assert response.json()["order_index"] == 0
```

- [ ] **Step 2: Kjør tester for å verifisere at de feiler**

```bash
cd api && python -m pytest tests/test_add_exercise_router.py -v
```

Forventet: FAIL — 405 Method Not Allowed (endepunktet finnes ikke ennå)

- [ ] **Step 3: Legg til Pydantic body-modell og endepunkt i programs.py**

Øverst i `api/app/routers/programs.py`, legg til `BaseModel`-import etter eksisterende imports:

```python
from pydantic import BaseModel
```

Legg til body-modellen rett etter importene (før `router = APIRouter()`):

```python
class AddExerciseBody(BaseModel):
    exercise_id: str
    sets: int
    reps: int
    weight_kg: float | None = None
```

Legg til dette endepunktet på slutten av `api/app/routers/programs.py`:

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
            row = await cur.fetchone()
            order_index = row[0]

            cur = await conn.execute(
                "SELECT name, muscle_groups FROM exercises WHERE id = %s",
                (body.exercise_id,),
            )
            ex = await cur.fetchone()
            if ex is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            new_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO program_exercises "
                "(id, program_day_id, exercise_id, sets, reps, weight_kg, order_index) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (new_id, day_id, body.exercise_id, body.sets, body.reps, body.weight_kg, order_index),
            )
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[add_exercise_to_day] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {
        "id": new_id,
        "exercise_id": body.exercise_id,
        "name": ex[0],
        "sets": body.sets,
        "reps": body.reps,
        "weight_kg": body.weight_kg,
        "muscle_groups": ex[1],
        "order_index": order_index,
    }
```

- [ ] **Step 4: Kjør tester**

```bash
cd api && python -m pytest tests/test_add_exercise_router.py -v
```

Forventet: 3 tests PASS

- [ ] **Step 5: Kjør full testsuite**

```bash
cd api && python -m pytest -v
```

Forventet: Alle 34 tester PASS (31 eksisterende + 3 nye)

- [ ] **Step 6: Commit**

```bash
git add api/app/routers/programs.py api/tests/test_add_exercise_router.py
git commit -m "feat: add POST /api/programs/{id}/days/{day_id}/exercises endpoint"
```

---

## Task 2: Frontend — addExerciseToDay + ExerciseLibrary + ProgramDetail

**Files:**
- Modify: `web/src/lib/api.ts`
- Modify: `web/src/components/program/ExerciseLibrary.tsx`
- Modify: `web/src/components/program/ProgramDetail.tsx`

- [ ] **Step 1: Legg til addExerciseToDay i api.ts**

Legg til på slutten av `web/src/lib/api.ts`:

```ts
export async function addExerciseToDay(
  programId: string,
  dayId: string,
  body: { exercise_id: string; sets: number; reps: number; weight_kg?: number }
): Promise<ProgramExercise> {
  const url = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/programs/${programId}/days/${dayId}/exercises`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramExercise>
}
```

- [ ] **Step 2: Erstatt hele ExerciseLibrary.tsx**

Erstatt hele innholdet i `web/src/components/program/ExerciseLibrary.tsx`:

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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ sets: "3", reps: "10", weight_kg: "" })
  const [submitting, setSubmitting] = useState(false)

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

  async function handleAdd(exercise: Exercise) {
    setSubmitting(true)
    try {
      await addExerciseToDay(programId, dayId, {
        exercise_id: exercise.id,
        sets: parseInt(form.sets) || 3,
        reps: parseInt(form.reps) || 10,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined,
      })
      onAdd()
    } catch (err) {
      console.error("Failed to add exercise:", err)
    } finally {
      setSubmitting(false)
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
            <div key={ex.id} className="bg-card border rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{ex.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {ex.muscle_groups.join(", ")} · {ex.difficulty}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setExpandedId(expandedId === ex.id ? null : ex.id)
                    setForm({ sets: "3", reps: "10", weight_kg: "" })
                  }}
                  className="text-primary font-bold text-lg px-2"
                >
                  {expandedId === ex.id ? "−" : "+"}
                </button>
              </div>

              {expandedId === ex.id && (
                <div className="mt-3 pt-3 border-t flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Sett</label>
                      <input
                        type="number"
                        value={form.sets}
                        onChange={(e) => setForm((f) => ({ ...f, sets: e.target.value }))}
                        className="w-full bg-muted rounded px-2 py-1 text-sm outline-none mt-0.5"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Reps</label>
                      <input
                        type="number"
                        value={form.reps}
                        onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))}
                        className="w-full bg-muted rounded px-2 py-1 text-sm outline-none mt-0.5"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Vekt (kg)</label>
                      <input
                        type="number"
                        value={form.weight_kg}
                        onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
                        placeholder="–"
                        className="w-full bg-muted rounded px-2 py-1 text-sm outline-none mt-0.5"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleAdd(ex)}
                      disabled={submitting}
                      className="flex-1 bg-primary text-primary-foreground rounded py-1.5 text-sm font-medium disabled:opacity-50"
                    >
                      {submitting ? "Legger til..." : "Legg til"}
                    </button>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="text-sm text-muted-foreground px-2"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              )}
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

- [ ] **Step 3: Oppdater ExerciseLibrary-kallet i ProgramDetail.tsx**

I `web/src/components/program/ProgramDetail.tsx`, finn:

```tsx
      <ExerciseLibrary
        programId={programId}
        dayId={libraryDayId}
        onClose={() => setLibraryDayId(null)}
      />
```

Erstatt med:

```tsx
      <ExerciseLibrary
        programId={programId}
        dayId={libraryDayId}
        onClose={() => setLibraryDayId(null)}
        onAdd={() => {
          setLibraryDayId(null)
          getProgram(programId).then(setProgram).catch(console.error)
        }}
      />
```

- [ ] **Step 4: Verifiser TypeScript**

```bash
cd web && npx tsc --noEmit
```

Forventet: No errors

- [ ] **Step 5: Manuell smoke-test**

1. Sørg for at backend kjører: `cd api && uvicorn app.main:app --reload`
2. Sørg for at frontend kjører: `cd web && npm run dev`
3. Åpne http://localhost:3000 → Program-fanen → trykk på "3-dagers styrkeprogram"
4. Gå til "Dag 1: Ben" → trykk "+ Legg til øvelse"
5. Finn en øvelse (f.eks. "Dip") → trykk "+"
6. Fyll inn 3 sett, 10 reps, vekt valgfritt
7. Trykk "Legg til"
8. Dagen skal nå vise den nye øvelsen

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/api.ts web/src/components/program/ExerciseLibrary.tsx web/src/components/program/ProgramDetail.tsx
git commit -m "feat: wire up add-exercise flow in ExerciseLibrary and ProgramDetail"
```
