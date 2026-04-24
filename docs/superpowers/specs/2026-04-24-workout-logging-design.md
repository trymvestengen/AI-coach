# Workout Logging — Implementation Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect the Program screen to the real FastAPI backend so users can load their actual program, log sets inline with reps and weight, rest between sets with a configurable timer, and see completed workouts in the Log screen.

**Architecture:** The existing FastAPI + PostgreSQL backend already has the schema and most endpoints. We add four missing endpoints, re-seed the exercises table with wger IDs, wire the Program screen to the API, add inline set logging with a rest timer, and connect the WorkoutLog screen to real data.

**Tech Stack:** FastAPI (Python, psycopg3), Next.js 15 App Router, PostgreSQL, React state for session tracking, localStorage for rest timer preference.

---

## File map

**Backend — new/modified:**
- `api/app/routers/workouts.py` — add `POST /api/workouts`, `POST /api/workouts/{id}/sets`, `PATCH /api/workouts/{id}/complete`
- `api/app/routers/programs.py` — add `GET /api/programs/active`
- `api/db/seed_wger.py` — one-time script: upsert all 855 wger exercises into `exercises` table

**Frontend — new/modified:**
- `web/src/lib/api.ts` — add `startWorkout()`, `logSet()`, `completeWorkout()`, `getActiveProgram()`
- `web/src/components/program/ProgramScreen.tsx` — replace mock data with API calls, add inline set logging, rest timer
- `web/src/components/program/RestTimer.tsx` — new: bottom sheet rest timer component
- `web/src/components/log/WorkoutLog.tsx` — replace mock data with `getWorkouts()` API call

---

## Section 1: Exercise re-seed

The backend's `exercises` table has old IDs. The frontend uses wger slug IDs (e.g. `bench-press`). They must match for `workout_sets.exercise_id` to be meaningful.

`api/db/seed_wger.py` reads `web/src/lib/exercises.ts`, extracts the EXERCISES array via regex or by generating a JSON sidecar, then upserts each exercise:

```sql
INSERT INTO exercises (id, name, muscle_groups, equipment, difficulty, instructions)
VALUES (%s, %s, %s, %s, %s, %s)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, muscle_groups = EXCLUDED.muscle_groups,
  equipment = EXCLUDED.equipment, instructions = EXCLUDED.instructions
```

Mapping from wger Exercise fields to DB columns:
- `id` → `id`
- `name` → `name`
- `[primary, ...secondary]` → `muscle_groups` (TEXT[])
- `[equipment]` → `equipment` (TEXT[])
- `"intermediate"` → `difficulty` (hardcoded default — wger has no difficulty field)
- `description` → `instructions`

The script is run once: `python api/db/seed_wger.py`

---

## Section 2: Backend endpoints

### `GET /api/programs/active`

Returns the active program with all days and their exercises+sets. Reuses the existing query from `GET /api/programs/{id}` but adds `WHERE p.is_active = true` filter.

Response shape (same as existing `GET /api/programs/{id}`):
```json
{
  "id": "uuid",
  "name": "Hypertrophy 4×",
  "is_active": true,
  "days": [
    {
      "id": "uuid",
      "day_number": 1,
      "name": "Upper A",
      "exercises": [
        {
          "id": "uuid",
          "exercise_id": "bench-press",
          "name": "Bench Press",
          "muscle_groups": ["Chest"],
          "order_index": 0,
          "sets": [
            { "id": "uuid", "set_number": 1, "reps": 8, "weight_kg": null }
          ]
        }
      ]
    }
  ]
}
```

Returns 404 if no active program exists.

### `POST /api/workouts`

Creates a new workout session.

Request body: `{ "program_day_id": "uuid" }` (optional — can be null if logging freestyle)

Response:
```json
{ "workout_id": "uuid", "started_at": "2026-04-24T10:00:00Z" }
```

Implementation: INSERT into `workouts` with `user_id = TEST_USER_ID`, `started_at = NOW()`, `completed_at = NULL`.

### `POST /api/workouts/{workout_id}/sets`

Logs one completed set.

Request body:
```json
{ "exercise_id": "bench-press", "set_number": 1, "reps": 8, "weight_kg": 80.0, "rpe": null }
```

`rpe` is optional. `weight_kg` is optional (bodyweight exercises).

Response:
```json
{ "id": "uuid", "exercise_id": "bench-press", "set_number": 1, "reps": 8, "weight_kg": 80.0, "rpe": null }
```

Implementation: INSERT into `workout_sets`. Validates workout belongs to TEST_USER_ID.

### `PATCH /api/workouts/{workout_id}/complete`

Marks workout as finished.

Request body:
```json
{ "rpe": 8, "notes": "" }
```

Both fields optional. Sets `completed_at = NOW()`.

Response:
```json
{ "workout_id": "uuid", "completed_at": "2026-04-24T11:02:00Z" }
```

---

## Section 3: Frontend API client (`api.ts`)

Add four functions:

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
  exercise_id: string; set_number: number; reps: number; weight_kg?: number | null; rpe?: number | null
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

---

## Section 4: RestTimer component

`web/src/components/program/RestTimer.tsx`

Props:
```typescript
interface RestTimerProps {
  seconds: number          // configured duration
  onDone: () => void       // called when timer reaches 0 or user skips
  onChangeDefault: (s: number) => void  // called when user edits duration
}
```

Rendered as a fixed bottom sheet (above BottomNav). Shows:
- Large countdown number (seconds remaining)
- Circular progress ring
- "Hopp over" (skip) button → calls `onDone()`
- Tap on the time number → inline input to change duration → persists to localStorage under key `restTimerSeconds` (default: 90)

State: `useEffect` with `setInterval` ticking down. Calls `onDone()` when it hits 0.

---

## Section 5: ProgramScreen — real data + inline logging

**Data loading:**
```
mount → getActiveProgram() → store in state
       → if error/404: show "Ingen aktiv plan" empty state
```

The active program's days replace `WEEK_DAYS`. Day names come from `day.name`. "Today" is determined by matching `day_number` to current weekday (Monday=1 … Sunday=7). If no match, defaults to day 1.

**State additions:**
```typescript
const [program, setProgram] = useState<Program | null>(null)
const [selectedDayIndex, setSelectedDayIndex] = useState(0)
const [workoutId, setWorkoutId] = useState<string | null>(null)
const [setLog, setSetLog] = useState<Record<string, SetEntry[]>>({})
  // key: program exercise id, value: array of { r, w, done }
const [restTimer, setRestTimer] = useState<{ active: boolean; setKey: string } | null>(null)
const [restSeconds, setRestSeconds] = useState<number>(
  () => parseInt(localStorage.getItem("restTimerSeconds") ?? "90", 10)
)
```

**Start workout:**

When `workoutId` is null, the exercise rows are read-only (show target reps/weight). A "Start økt" button sits below the exercise list. Tapping it:
1. Calls `startWorkout(selectedDay.id)`
2. Sets `workoutId` in state
3. Initializes `setLog` from the selected day's exercises (all sets `{ r: targetReps, w: targetWeight, done: false }`)

**Inline set rows (when workoutId is set):**

Each exercise row expands to show its sets. Each set row:
```
Set 1  [  8  ] reps  [ 80.0 ] kg  [✓]
```
- Reps and weight are `<input type="number">` fields, pre-filled from `setLog`
- Checkmark button: marks set done → calls `logSet(workoutId, { exercise_id, set_number, reps, weight_kg })` → triggers rest timer

**Finish workout:**

When all sets in `setLog` are `done: true`, a "Fullfør økt" button appears. Tapping calls `completeWorkout(workoutId)` → clears `workoutId` from state → resets `setLog`.

**Error handling:** API errors show a brief toast (inline text, no modal). If `startWorkout` fails, `workoutId` stays null.

---

## Section 6: WorkoutLog — real data

Replace `MOCK_WORKOUTS` with an API call:

```typescript
const [workouts, setWorkouts] = useState<Workout[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  getWorkouts()
    .then(raw => setWorkouts(raw.map(mapWorkout)))
    .catch(() => {})
    .finally(() => setLoading(false))
}, [])
```

`mapWorkout` converts the API shape to the existing `Workout` UI type:
- `workout_id` → `id`
- `date` → format as Norwegian weekday string (e.g. "Torsdag")
- Group `sets` by `exercise_id` → `exercises[]`
- Sum `reps × weight_kg` across all sets → `volume`
- Count sets → `totalSets`
- `rpe` → `rpe`
- `label`: first two letters of first exercise name
- `hue`: hash of workout_id to a number 0–360
- `name`: first exercise name or "Treningsøkt"
- `duration`: not stored yet — omit or show "–"
- `prs`: not tracked yet — show 0

Show a loading skeleton while fetching. Show "Ingen treninger ennå" if empty.

---

## Data flow summary

```
ProgramScreen mount
  → GET /api/programs/active
  → render days + exercises (read-only)

User taps "Start økt"
  → POST /api/workouts → workout_id
  → set rows become editable

User fills reps/weight, taps ✓
  → POST /api/workouts/{id}/sets
  → rest timer starts

Timer ends / user skips
  → timer dismissed

All sets done
  → "Fullfør økt" appears
  → PATCH /api/workouts/{id}/complete
  → session cleared

WorkoutLog mount
  → GET /api/workouts
  → render real history
```
