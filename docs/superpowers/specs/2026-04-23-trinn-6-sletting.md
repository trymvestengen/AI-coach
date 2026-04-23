# Trinn 6: Sletting — Design Spec

**Goal:** Brukere kan slette sett (swipe), øvelser og programmer (søppelkasse-ikon) uten bekreftelsesdialog.

**Architecture:** 2 nye backend-endepunkter (DELETE program, DELETE exercise). Frontend: swipe-interaksjon på SetRow, søppelkasse-ikoner på øvelses- og programkort. Alle sletteoperasjoner oppdaterer lokal state umiddelbart uten full re-fetch.

---

## Backend

### Nye endepunkter

**`DELETE /api/programs/{program_id}`**

- Validerer at programmet tilhører `TEST_USER_ID`
- Sletter program (CASCADE fjerner program_days, program_exercises, program_exercise_sets)
- Returnerer `204 No Content`
- 404 hvis ikke funnet

**`DELETE /api/programs/{program_id}/days/{day_id}/exercises/{exercise_id}`**

- Validerer ownership med JOIN: `program_exercises JOIN program_days JOIN programs WHERE p.user_id = TEST_USER_ID`
- Sletter program_exercise-raden (CASCADE fjerner program_exercise_sets)
- Returnerer `204 No Content`
- 404 hvis ikke funnet

### Tester

`api/tests/test_delete_router.py`:
- DELETE program → 204
- DELETE program (ikke funnet) → 404
- DELETE exercise → 204
- DELETE exercise (ikke funnet) → 404

---

## Frontend

### api.ts — nye funksjoner

```ts
deleteExercise(programId, dayId, exerciseId): Promise<void>
deleteProgram(programId): Promise<void>
```

### ExerciseDetail.tsx — swipe-slett på SetRow

`SetRow` får swipe-venstre-støtte med touch-events:

- `onTouchStart`: lagrer start-X
- `onTouchMove`: beregner delta, bruker `transform: translateX(${delta}px)` (maks -80px)
- `onTouchEnd`: hvis delta < -60px → vis slett-tilstand (rød bakgrunn, søppelkasse synlig); ellers snap tilbake
- Slett-knapp kaller `deleteSet`, fjerner settet fra parent-state via `onDelete(set.id)`
- `SetRow` får ny prop: `onDelete: (setId: string) => void`

Swipe implementeres med inline style (ingen ekstra bibliotek).

### ProgramDetail.tsx — søppelkasse på øvelseskort

- Hvert øvelseskort viser en liten rød søppelkasse-knapp (høyre side)
- Knapp kaller `deleteExercise`, fjerner øvelsen fra `day.exercises` i lokal state
- Navigasjon til ExerciseDetail skjer kun ved klikk på kortteksten/fargeblokken, ikke på søppelkassen

### ProgramList.tsx — søppelkasse på programkort

- Hvert programkort viser en liten rød søppelkasse-knapp (høyre side)
- Knapp kaller `deleteProgram`, fjerner programmet fra `programs` i lokal state

---

## Ikke i scope for Trinn 6
- Bekreftelsesdialog
- Angre-funksjon (undo)
- Slette program-dager
- Rekkefølge på øvelser/sett
