# Trinn 5: Sett-styring i program — Design Spec

**Goal:** Erstatte aggregert sets/reps/weight_kg med individuelle sett-rader per øvelse. "+" i biblioteket legger til øvelsen direkte. Egne sett redigeres i en ExerciseDetail-visning.

**Architecture:** DB-migrasjon fjerner kolonner og oppretter `program_exercise_sets`. Eksisterende endepunkter oppdateres. Nye endepunkter for sett-CRUD. ExerciseLibrary forenkles. Ny ExerciseDetail-komponent med inline-redigerbare rader.

---

## Backend

### Migrasjon: `api/db/migrations/003_program_exercise_sets.sql`

```sql
CREATE TABLE IF NOT EXISTS program_exercise_sets (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_exercise_id UUID NOT NULL REFERENCES program_exercises(id) ON DELETE CASCADE,
    set_number     INTEGER NOT NULL,
    reps           INTEGER NOT NULL CHECK (reps > 0),
    weight_kg      NUMERIC(6, 2),
    CONSTRAINT uq_exercise_set_order UNIQUE (program_exercise_id, set_number)
);

-- Migrer eksisterende data
INSERT INTO program_exercise_sets (program_exercise_id, set_number, reps, weight_kg)
SELECT
    pe.id,
    generate_series(1, pe.sets) AS set_number,
    pe.reps,
    pe.weight_kg
FROM program_exercises pe
WHERE pe.sets > 0;

ALTER TABLE program_exercises DROP COLUMN sets;
ALTER TABLE program_exercises DROP COLUMN reps;
ALTER TABLE program_exercises DROP COLUMN weight_kg;
```

### Oppdaterte endepunkter

**`POST /api/programs/{program_id}/days/{day_id}/exercises`**

Body endres — fjerner `sets`, `reps`, `weight_kg`:
```json
{ "exercise_id": "squat" }
```

- Validerer program → dag → øvelse (404 hvis ikke funnet)
- Inserter i `program_exercises` (som før)
- Inserter automatisk 1 defaultsett: `set_number=1, reps=10, weight_kg=null`
- Returnerer:
```json
{
  "id": "...",
  "exercise_id": "squat",
  "name": "Squat",
  "muscle_groups": ["quads", "glutes"],
  "order_index": 0,
  "sets": [{ "id": "...", "set_number": 1, "reps": 10, "weight_kg": null }]
}
```

**`GET /api/programs/{program_id}`**

Returnerer øvelser med `sets`-array i stedet for aggregerte felter:
```json
{
  "id": "...",
  "name": "3-dagers styrkeprogram",
  "days": [
    {
      "id": "...",
      "day_number": 1,
      "name": "Ben",
      "exercises": [
        {
          "id": "...",
          "exercise_id": "squat",
          "name": "Squat",
          "muscle_groups": ["quads"],
          "order_index": 0,
          "sets": [
            { "id": "...", "set_number": 1, "reps": 5, "weight_kg": 80.0 },
            { "id": "...", "set_number": 2, "reps": 5, "weight_kg": 80.0 }
          ]
        }
      ]
    }
  ]
}
```

### Nye endepunkter

**`GET /api/programs/{program_id}/days/{day_id}/exercises/{exercise_id}`**

Returnerer øvelse med alle sett. Validerer program → dag → øvelse.

Response: samme shape som øvelsesobjektet i GET /programs/{id}.

---

**`POST /api/programs/{program_id}/days/{day_id}/exercises/{exercise_id}/sets`**

Body: `{ "reps": 10, "weight_kg": 80.0 }` (`weight_kg` valgfri)

- Beregner neste `set_number`: `SELECT COALESCE(MAX(set_number) + 1, 1) FROM program_exercise_sets WHERE program_exercise_id = ?`
- Inserter rad
- Returnerer: `{ "id": "...", "set_number": 3, "reps": 10, "weight_kg": 80.0 }`

---

**`PATCH /api/programs/{program_id}/days/{day_id}/exercises/{exercise_id}/sets/{set_id}`**

Body: `{ "reps": 12, "weight_kg": 82.5 }` (begge felter valgfrie, minst ett påkrevd)

- Validerer at set_id tilhører exercise_id
- Oppdaterer kun angitte felter
- Returnerer oppdatert sett

---

**`DELETE /api/programs/{program_id}/days/{day_id}/exercises/{exercise_id}/sets/{set_id}`**

- Validerer at set_id tilhører exercise_id
- Sletter rad
- Returnerer `204 No Content`

---

### Tester

`api/tests/test_sets_router.py`:
- POST sets → returnerer 200 med nytt sett
- POST sets → set_number beregnes som MAX+1
- PATCH set → oppdaterer reps/weight_kg
- PATCH set med ukjent set_id → 404
- DELETE set → 204
- DELETE ukjent set → 404

---

## Frontend

### TypeScript-typer (`web/src/lib/api.ts`)

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
```

Nye funksjoner:
```ts
addSet(programId, dayId, exerciseId, body: { reps: number; weight_kg?: number }): Promise<ProgramExerciseSet>
updateSet(programId, dayId, exerciseId, setId, body: { reps?: number; weight_kg?: number | null }): Promise<ProgramExerciseSet>
deleteSet(programId, dayId, exerciseId, setId): Promise<void>
```

`addExerciseToDay` endres — body har kun `exercise_id: string` (ingen sets/reps/weight_kg).

### ExerciseLibrary.tsx

Fjerner: `expandedId`, `form`, `submitting` state, `handleAdd`-funksjon, og hele den ekspanderte seksjonen.

Ny "+" onClick:
```tsx
async function handleAdd(exerciseId: string) {
  setAddingId(exerciseId)
  try {
    await addExerciseToDay(programId, dayId, { exercise_id: exerciseId })
    onAdd()
  } catch (err) {
    console.error(err)
  } finally {
    setAddingId(null)
  }
}
```

State: `addingId: string | null` — viser spinner på knappen som er i ferd med å legge til.

### ProgramDetail.tsx

Ny state: `selectedExercise: { id: string; name: string } | null`

Øvelseskort viser oppsummering:
- Hvis alle sett har samme reps og weight: `{N} sett · {reps} reps · {weight} kg`
- Hvis varierende: `{N} sett`
- Hvis ingen sett: `Ingen sett`

Trykk på øvelseskort → setter `selectedExercise`. Viser `ExerciseDetail` i stedet for dagsvisningen når `selectedExercise !== null`.

### ExerciseDetail.tsx (ny komponent)

Props: `programId, dayId, exerciseId, exerciseName, onBack: () => void`

- Fetcher `GET /api/programs/{id}/days/{day_id}/exercises/{exercise_id}` ved mount
- Header: `←` + øvelsenavn
- Tabellheader: `SET | FORRIGE | KG | REPS`
- Per sett:
  - `SET`: set_number
  - `FORRIGE`: `-` (hardkodet for nå)
  - `KG`: tallinput, kaller `updateSet` ved blur
  - `REPS`: tallinput, kaller `updateSet` ved blur
- "+ Legg til sett"-knapp: kaller `addSet` med reps fra siste sett (eller 10 hvis ingen), weight_kg fra siste sett, refresher listen
- Ingen slette-funksjonalitet i denne trinnen

---

## Ikke i scope for Trinn 5
- "Forrige"-kolonne med ekte treningshistorikk
- Slette sett
- Slette øvelse fra program
- Rekkefølge på øvelser
- Ekte auth
