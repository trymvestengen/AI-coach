# Trinn 6: Sletting — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Legg til slette-funksjonalitet for sett (swipe), øvelser og programmer (søppelkasse-ikon) uten bekreftelsesdialog.

**Architecture:** 2 nye backend DELETE-endepunkter (program, exercise). Frontend: swipe-interaksjon med touch-events på SetRow i ExerciseDetail, inline søppelkasse-knapper på øvelses- og programkort. State oppdateres lokalt etter vellykket API-kall.

**Tech Stack:** FastAPI, psycopg3, pytest-asyncio, Next.js 15, TypeScript, Tailwind CSS

---

## File Map

**Modified:**
- `api/app/routers/programs.py` — 2 nye DELETE-endepunkter
- `api/tests/test_delete_router.py` — ny testfil (4 tester)
- `web/src/lib/api.ts` — `deleteExercise`, `deleteProgram`
- `web/src/components/program/ExerciseDetail.tsx` — swipe-slett på SetRow
- `web/src/components/program/ProgramDetail.tsx` — søppelkasse på øvelseskort
- `web/src/components/program/ProgramList.tsx` — søppelkasse på programkort

---

### Task 1: Backend DELETE program + DELETE exercise + tester

**Files:**
- Modify: `api/app/routers/programs.py`
- Create: `api/tests/test_delete_router.py`

- [ ] **Step 1: Skriv failing tester**

Opprett `api/tests/test_delete_router.py`:

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


def _cur(fetchone=None):
    c = AsyncMock()
    c.fetchone = AsyncMock(return_value=fetchone)
    return c


@pytest.mark.asyncio
async def test_delete_program_returns_204(make_mock_get_conn):
    cur = _cur(fetchone=(PROG_ID,))

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)
    conn.commit  = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(f"/api/programs/{PROG_ID}")

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_program_returns_404_when_not_found(make_mock_get_conn):
    cur = _cur(fetchone=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(f"/api/programs/{PROG_ID}")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_exercise_returns_204(make_mock_get_conn):
    cur = _cur(fetchone=(EX_ID,))

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)
    conn.commit  = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}"
            )

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_exercise_returns_404_when_not_found(make_mock_get_conn):
    cur = _cur(fetchone=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}"
            )

    assert response.status_code == 404
```

- [ ] **Step 2: Kjør tester — bekreft at de feiler**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api
python -m pytest tests/test_delete_router.py -v
```

Forventet: 4 tester FAIL (404 — endepunktene finnes ikke ennå).

- [ ] **Step 3: Legg til endepunkter i programs.py**

Legg til disse to funksjonene etter `delete_set` (på slutten av filen):

```python
@router.delete("/programs/{program_id}", status_code=204)
async def delete_program(program_id: uuid.UUID) -> None:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM programs WHERE id = %s AND user_id = %s RETURNING id",
                (program_id, TEST_USER_ID),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Program not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[delete_program] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete(
    "/programs/{program_id}/days/{day_id}/exercises/{exercise_id}",
    status_code=204,
)
async def delete_exercise(
    program_id: uuid.UUID, day_id: uuid.UUID, exercise_id: uuid.UUID
) -> None:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                DELETE FROM program_exercises
                WHERE id = %s
                  AND program_day_id = %s
                  AND program_day_id IN (
                      SELECT id FROM program_days
                      WHERE program_id = %s
                  )
                  AND (
                      SELECT p.user_id FROM programs p
                      JOIN program_days pd ON pd.program_id = p.id
                      WHERE pd.id = %s
                      LIMIT 1
                  ) = %s
                RETURNING id
                """,
                (exercise_id, day_id, program_id, day_id, TEST_USER_ID),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Exercise not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[delete_exercise] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

**Merk:** `delete_exercise` bruker en subquery-basert DELETE. Alternativt — enklere — bruk samme JOIN-mønster som de andre endepunktene:

```python
@router.delete(
    "/programs/{program_id}/days/{day_id}/exercises/{exercise_id}",
    status_code=204,
)
async def delete_exercise(
    program_id: uuid.UUID, day_id: uuid.UUID, exercise_id: uuid.UUID
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

            await conn.execute(
                "DELETE FROM program_exercises WHERE id = %s",
                (exercise_id,),
            )
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[delete_exercise] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

Bruk den siste (SELECT + DELETE) — den er konsistent med mønsteret i resten av filen.

- [ ] **Step 4: Kjør alle tester**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api
python -m pytest tests/ -v
```

Forventet: alle tester grønn (51 totalt).

- [ ] **Step 5: Commit**

```bash
git add api/app/routers/programs.py api/tests/test_delete_router.py
git commit -m "feat: add DELETE program and DELETE exercise endpoints"
```

---

### Task 2: Frontend — api.ts

**Files:**
- Modify: `web/src/lib/api.ts`

- [ ] **Step 1: Legg til deleteExercise og deleteProgram**

Legg til etter `deleteSet` på slutten av filen:

```ts
export async function deleteExercise(
  programId: string,
  dayId: string,
  exerciseId: string
): Promise<void> {
  const url = `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}`
  const res = await fetch(url, { method: "DELETE" })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function deleteProgram(programId: string): Promise<void> {
  const url = `${API_BASE}/api/programs/${programId}`
  const res = await fetch(url, { method: "DELETE" })
  if (!res.ok) throw new Error(`API ${res.status}`)
}
```

- [ ] **Step 2: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npx tsc --noEmit
```

Forventet: ingen feil.

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/api.ts
git commit -m "feat: add deleteExercise and deleteProgram to api.ts"
```

---

### Task 3: ExerciseDetail — swipe-slett på SetRow

**Files:**
- Modify: `web/src/components/program/ExerciseDetail.tsx`

- [ ] **Step 1: Reskriv ExerciseDetail.tsx**

Full fil — erstatt hele innholdet:

```tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { getExerciseDetail, addSet, updateSet, deleteSet, type ProgramExerciseSet } from "@/lib/api"

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
)

interface SetRowProps {
  set: ProgramExerciseSet
  onUpdate: (reps: number, weight_kg: number | null) => void
  onDelete: (setId: string) => void
}

function SetRow({ set, onUpdate, onDelete }: SetRowProps) {
  const [reps, setReps] = useState(String(set.reps))
  const [weight, setWeight] = useState(set.weight_kg != null ? String(set.weight_kg) : "")
  const [offsetX, setOffsetX] = useState(0)
  const [animating, setAnimating] = useState(false)
  const startXRef = useRef(0)
  const touchingRef = useRef(false)

  useEffect(() => {
    setReps(String(set.reps))
    setWeight(set.weight_kg != null ? String(set.weight_kg) : "")
  }, [set.reps, set.weight_kg])

  function handleBlur(e: React.FocusEvent) {
    const row = e.currentTarget.closest("[data-row]")
    if (row?.contains(e.relatedTarget as Node)) return
    const parsed = parseInt(reps, 10)
    const r = Number.isNaN(parsed) || parsed < 1 ? set.reps : parsed
    const parsedW = parseFloat(weight)
    const w = weight !== "" && !Number.isNaN(parsedW) ? parsedW : null
    onUpdate(r, w)
  }

  function handleTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX
    touchingRef.current = true
    setAnimating(false)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!touchingRef.current) return
    const delta = Math.min(0, Math.max(-80, e.touches[0].clientX - startXRef.current))
    setOffsetX(delta)
  }

  function handleTouchEnd() {
    touchingRef.current = false
    setAnimating(true)
    if (offsetX < -60) {
      setOffsetX(-80)
    } else {
      setOffsetX(0)
    }
  }

  const revealed = offsetX <= -80

  return (
    <div className="relative overflow-hidden border-b">
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center">
        <button
          onClick={() => onDelete(set.id)}
          className="text-white flex items-center justify-center w-full h-full"
          aria-label="Slett sett"
        >
          <TrashIcon />
        </button>
      </div>

      <div
        data-row
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: animating ? "transform 0.2s ease" : "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="grid grid-cols-4 gap-2 items-center py-2.5 bg-background relative z-10"
      >
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
        weight_kg: last !== undefined ? last.weight_kg : undefined,
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

  async function handleDelete(setId: string) {
    try {
      await deleteSet(programId, dayId, exerciseId, setId)
      setSets((prev) => prev.filter((s) => s.id !== setId))
    } catch (err) {
      console.error("Failed to delete set:", err)
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
              onDelete={handleDelete}
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

- [ ] **Step 2: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npx tsc --noEmit
```

Forventet: ingen feil.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/program/ExerciseDetail.tsx
git commit -m "feat: swipe-to-delete on SetRow in ExerciseDetail"
```

---

### Task 4: ProgramDetail + ProgramList — søppelkasse-ikoner

**Files:**
- Modify: `web/src/components/program/ProgramDetail.tsx`
- Modify: `web/src/components/program/ProgramList.tsx`

- [ ] **Step 1: Oppdater ProgramDetail.tsx**

Legg til import av `deleteExercise` og `TrashIcon`. Full fil:

```tsx
"use client"

import { useEffect, useState } from "react"
import { getProgram, deleteExercise, type Program, type ProgramDay, type ProgramExerciseSet } from "@/lib/api"
import ExerciseLibrary from "./ExerciseLibrary"
import ExerciseDetail from "./ExerciseDetail"

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
)

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
  // null === null is true; float === works for typical weights (5, 10, 12.5, 82.5)
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

  async function handleDeleteExercise(exerciseId: string, dayId: string) {
    try {
      await deleteExercise(programId, dayId, exerciseId)
      setProgram((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          days: prev.days?.map((d) =>
            d.id === dayId
              ? { ...d, exercises: d.exercises.filter((e) => e.id !== exerciseId) }
              : d
          ),
        }
      })
    } catch (err) {
      console.error("Failed to delete exercise:", err)
    }
  }

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
          <div key={ex.id} className="bg-card border rounded-lg flex items-center overflow-hidden">
            <button
              onClick={() => setSelectedExercise({ id: ex.id, dayId: day.id, name: ex.name })}
              className="flex gap-3 items-center p-3 flex-1 text-left hover:bg-accent transition-colors"
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
            <button
              onClick={() => handleDeleteExercise(ex.id, day.id)}
              className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              aria-label={`Slett ${ex.name}`}
            >
              <TrashIcon />
            </button>
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

- [ ] **Step 2: Oppdater ProgramList.tsx**

Full fil:

```tsx
"use client"

import { useEffect, useState } from "react"
import { getPrograms, deleteProgram, type Program } from "@/lib/api"
import ProgramDetail from "./ProgramDetail"

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
)

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

  async function handleDeleteProgram(programId: string) {
    try {
      await deleteProgram(programId)
      setPrograms((prev) => prev.filter((p) => p.id !== programId))
    } catch (err) {
      console.error("Failed to delete program:", err)
    }
  }

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
        <div key={p.id} className="bg-card border rounded-lg flex items-center overflow-hidden">
          <button
            onClick={() => setSelectedId(p.id)}
            className="flex-1 p-3 text-left hover:bg-accent transition-colors"
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
          <button
            onClick={() => handleDeleteProgram(p.id)}
            className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            aria-label={`Slett ${p.name}`}
          >
            <TrashIcon />
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npx tsc --noEmit
```

Forventet: ingen feil.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/program/ProgramDetail.tsx web/src/components/program/ProgramList.tsx
git commit -m "feat: add trash icons for deleting exercises and programs"
```
