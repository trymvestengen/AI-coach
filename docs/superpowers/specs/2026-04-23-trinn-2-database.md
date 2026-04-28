# Trinn 2: Database + Treningslogg — Design Spec

**Goal:** Legge til Postgres-persistens via Supabase slik at coachen husker brukeren på tvers av sesjoner.

**Architecture:** psycopg3 async connection pool i backend. SQL-migrasjon kjøres manuelt én gang mot Supabase. Tre nye Claude-tools (log_workout, get_user_history, suggest_progression) lagrer og henter data. Hardkodet test-bruker inntil auth (Trinn 7). Ny WorkoutLog-komponent i frontend.

---

## Database

### Migrasjon
Én SQL-fil (`api/db/migrations/001_initial.sql`) som oppretter alle tabeller. Kjøres manuelt i Supabase SQL Editor.

Tabeller som opprettes:
- `users` — id, email, name, locale, persona_mode, goals, created_at
- `exercises` — id, name, muscle_groups, equipment, difficulty, instructions, source
- `workouts` — id, user_id, started_at, completed_at, notes, rpe
- `workout_sets` — id, workout_id, exercise_id, set_number, reps, weight_kg, rpe

### Seed
`api/db/seed.py` — leser `app/data/exercises.json` og INSERT-er alle 15 øvelser i `exercises`-tabellen. Kjøres én gang etter migrasjon. Bruker `ON CONFLICT DO NOTHING` for å være idempotent.

### Test-bruker
Fast UUID `00000000-0000-0000-0000-000000000001` hardkodet i backend inntil Trinn 7. Insertes av seed-scriptet.

---

## Backend

### Nye filer
- `api/app/db.py` — async connection pool (psycopg3), `get_conn()` context manager
- `api/db/migrations/001_initial.sql` — SQL for alle tabeller
- `api/db/seed.py` — seed exercises + test user

### Nye tools i `api/app/tools/handlers.py`

**`log_workout(exercises, notes?, rpe?)`**
- `exercises` er liste av `{exercise_id, sets: [{reps, weight_kg, rpe?}]}`
- `notes` er valgfri tekst-notat om økten, `rpe` er samlet RPE for hele økten (1-10)
- Oppretter én rad i `workouts`, deretter rader i `workout_sets` for hvert sett
- Returnerer workout_id og bekreftelse

**`get_user_history(limit=5)`**
- Henter siste N fullførte økter for test-brukeren
- Returnerer liste med økt-dato, øvelser, sett/reps/vekt

**`suggest_progression(exercise_id)`**
- Henter siste 2 ganger brukeren tok øvelsen
- Hvis siste økt var RPE ≤ 7: foreslår +2.5 kg
- Hvis RPE 8-9: samme vekt
- Hvis RPE 10 eller ingen data: returner siste vekt som referanse

### Nytt endepunkt
`GET /api/workouts` — returnerer siste 5 økter for test-brukeren, brukes av frontend WorkoutLog.

### Tool definitions
`api/app/tools/definitions.py` oppdateres med de tre nye tools.

---

## Frontend

### WorkoutLog-komponent
`web/src/components/workout/WorkoutLog.tsx`
- Henter siste 5 økter fra `GET /api/workouts` ved mount
- Viser liste med kort per økt: dato, antall øvelser, total volum (kg)
- Loading-state mens data hentes
- Tom-state hvis ingen økter enda

### Logg-skjermen
`web/src/app/(tabs)/log/page.tsx` oppdateres fra placeholder til å vise WorkoutLog.

### api.ts
`getWorkouts()` funksjon legges til i `web/src/lib/api.ts`.

---

## Verifikasjonskrav

Trinn 2 er ferdig når:
- Coachen kan si "du gjorde knebøy 80 kg x 5 sist, prøv 82,5 i dag" basert på ekte DB-data
- WorkoutLog i frontend viser loggede økter
- `suggest_progression` returnerer fornuftig forslag basert på RPE

---

## Ikke i scope for Trinn 2
- Ekte auth (hardkodet test-bruker)
- Aktiv økt-logging i UI (kun via chat)
- Progresjonsgraf
