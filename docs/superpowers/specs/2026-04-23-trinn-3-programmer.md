# Trinn 3: Programmer + Øvelsesbibliotek — Design Spec

**Goal:** Legge til Program-fane og øvelsesbibliotek slik at brukeren kan se treningsprogrammer og coachen kan lage nye via chat.

**Architecture:** Tre nye Postgres-tabeller for program-struktur. Én ny Claude-tool (`create_program`). Tre nye API-endepunkter. Tre nye React-komponenter.

---

## Database

### Nye tabeller (002_programs.sql)

```sql
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
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_day_id  UUID NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
    exercise_id     TEXT NOT NULL REFERENCES exercises(id),
    sets            INTEGER NOT NULL,
    reps            INTEGER NOT NULL,
    weight_kg       NUMERIC(6, 2),
    order_index     INTEGER NOT NULL DEFAULT 0
);
```

`programs.is_active` — kun én aktiv om gangen, enforces i backend ved `create_program`.

### Seed

`api/db/seed_programs.py` — inserter ett seed-program ("3-dagers styrkeprogram") med 3 dager og øvelser fra eksisterende `exercises`-tabell. Idempotent (`ON CONFLICT DO NOTHING` på name+user_id).

---

## Backend

### Ny migrasjonsfil
`api/db/migrations/002_programs.sql` — oppretter de tre tabellene over.

### Nytt Claude-tool i `api/app/tools/handlers.py`

**`create_program(name, days)`**
- `days`: liste av `{name: str, exercises: [{exercise_id, sets, reps, weight_kg?}]}`
- Setter alle eksisterende programmer for test-bruker til `is_active=false`
- Inserter program, deretter program_days (med day_number=index+1), deretter program_exercises
- Returnerer `{program_id, name, days_count}`

### Nye endepunkter

**`GET /api/programs`**
- Returnerer alle programmer for test-bruker
- Respons: `[{id, name, is_active, days_count}]`

**`GET /api/programs/{program_id}`**
- Returnerer fullt program med dager og øvelser
- Respons: `{id, name, is_active, days: [{day_number, name, exercises: [{exercise_id, name, sets, reps, weight_kg, muscle_groups}]}]}`

**`GET /api/exercises`**
- Returnerer øvelsesbibliotek (eksisterende `exercises`-tabell)
- Valgfritt query-param: `?muscle_group=ben`
- Respons: `[{id, name, muscle_groups, equipment, difficulty}]`

### Tool definition
`api/app/tools/definitions.py` oppdateres med `create_program`-tool.

---

## Frontend

### Nye komponenter

**`web/src/components/program/ProgramList.tsx`**
- Henter `GET /api/programs` ved mount
- Viser kort per program: navn, antall dager, aktiv-badge (grønn prikk)
- Trykk på kort → navigerer til ProgramDetail (via state/prop, ikke routing)
- Loading-state og tom-state

**`web/src/components/program/ProgramDetail.tsx`**
- Props: `programId: string`, `onBack: () => void`
- Henter `GET /api/programs/{id}`
- Dag-tabs øverst (Dag 1, Dag 2, ...), øvelsesliste under
- Hver øvelse: muskelgruppe-farge (placeholder-farge per gruppe), navn, sett × reps, vekt
- Knapp "Legg til øvelse" → åpner ExerciseLibrary

**`web/src/components/program/ExerciseLibrary.tsx`**
- Props: `programId: string`, `dayId: string`, `onClose: () => void`
- Henter `GET /api/exercises` (med muscle_group-filter ved valg)
- Muskelgruppe-chips øverst for filtrering
- Søkefelt for navn
- Trykk på øvelse → legger til i valgt dag (POST til ny intern state, ikke til DB i Trinn 3)
- I Trinn 3: kun UI-visning av tillegg, faktisk lagring via coachen

### Muskelgruppe-farger (placeholder)
```ts
const MUSCLE_COLORS: Record<string, string> = {
  ben: "#1e3a5f",
  bryst: "#3a1e1e",
  rygg: "#1e3a2a",
  skuldre: "#3a2a1e",
  armer: "#2a1e3a",
  core: "#1e2a3a",
}
```

### API-funksjoner
`web/src/lib/api.ts` utvides med:
- `getPrograms()`
- `getProgram(id: string)`
- `getExercises(muscleGroup?: string)`

### Program-tab
`web/src/app/(tabs)/program/page.tsx` — oppdateres fra placeholder til `<ProgramList />`.

---

## Verifikasjonskrav

Trinn 3 er ferdig når:
- Program-fanen viser seed-programmet
- Trykk på program åpner detaljvisning med dag-tabs og øvelser
- Coachen kan lage et nytt program via chat (`create_program`-tool)
- Øvelsesbiblioteket kan åpnes og filtreres på muskelgruppe

---

## Ikke i scope for Trinn 3
- Faktisk lagring av manuelt tillagte øvelser til DB (kun via coachen)
- Redigering av eksisterende programmer
- Sletting av programmer
- Ekte auth (fortsatt hardkodet test-bruker)
- Aktiv økt-logging mot program
