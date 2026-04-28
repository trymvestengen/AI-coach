# Trinn 4: Legg til øvelse i program — Design Spec

**Goal:** Gjøre det mulig å legge til øvelser i et program direkte fra øvelsesbiblioteket i UI.

**Architecture:** Nytt POST-endepunkt i backend. ExerciseLibrary-komponenten får inline-expand UX med sett/reps/vekt-felter. ProgramDetail refresher etter vellykket tillegg.

---

## Backend

### Nytt endepunkt

**`POST /api/programs/{program_id}/days/{day_id}/exercises`**

Body:
```json
{
  "exercise_id": "squat",
  "sets": 3,
  "reps": 10,
  "weight_kg": 80.0
}
```

- Validerer at `program_id` tilhører test-brukeren — returnerer 404 hvis ikke
- Validerer at `day_id` tilhører `program_id` — returnerer 404 hvis ikke
- Beregner neste `order_index`: `SELECT COALESCE(MAX(order_index) + 1, 0) FROM program_exercises WHERE program_day_id = ?`
- Inserter rad i `program_exercises`
- Returnerer den nye øvelsen: `{id, exercise_id, name, sets, reps, weight_kg, muscle_groups, order_index}`

### Test

`api/tests/test_add_exercise_router.py` — 3 tester:
- POST med gyldige data returnerer 200 og ny øvelse
- POST med ugyldig `day_id` returnerer 404
- `order_index` beregnes som MAX+1 (mock med existerende øvelser i dag)

---

## Frontend

### ExerciseLibrary.tsx

Ny state:
- `expandedId: string | null` — hvilken øvelse-rad er ekspandert
- `form: { sets: string; reps: string; weight_kg: string }` — inputverdier

Props-endring: `onClose` beholdes. `programId` og `dayId` brukes nå faktisk (var tidligere unused).

UX-flyt:
1. Hver øvelse-rad får en "+" knapp til høyre
2. Trykk "+" → `expandedId` settes til øvelsens id, `form` nullstilles til `{sets: "3", reps: "10", weight_kg: ""}`
3. Kortets nedre del ekspanderer: tre inputfelter (Sett, Reps, Vekt kg) + "Legg til"-knapp + "Avbryt"-lenke
4. "Legg til" → POST til `/api/programs/{programId}/days/{dayId}/exercises` → ved suksess: kall `onAdd()`
5. "Avbryt" → `expandedId = null`
6. Kun ett kort kan være ekspandert om gangen

### ProgramDetail.tsx

Endring: `ExerciseLibrary` kalles nå med `onAdd`-callback i tillegg til `onClose`:

```tsx
<ExerciseLibrary
  programId={programId}
  dayId={libraryDayId}
  onClose={() => setLibraryDayId(null)}
  onAdd={() => {
    setLibraryDayId(null)
    getProgram(programId).then(setProgram)
  }}
/>
```

### api.ts

Ny funksjon:
```ts
addExerciseToDay(programId: string, dayId: string, body: {
  exercise_id: string
  sets: number
  reps: number
  weight_kg?: number
}): Promise<ProgramExercise>
```

---

## Verifikasjonskrav

Trinn 4 er ferdig når:
- Bruker trykker "+" på en øvelse i biblioteket
- Fyller inn sett, reps og valgfri vekt
- Trykker "Legg til"
- Biblioteket lukkes og dagen viser den nye øvelsen

---

## Ikke i scope for Trinn 4
- Slette øvelser fra program
- Endre rekkefølge på øvelser
- Redigere eksisterende øvelser i programmet
- Ekte auth
