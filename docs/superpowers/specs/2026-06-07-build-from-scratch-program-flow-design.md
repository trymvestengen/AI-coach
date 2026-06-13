# Build-from-Scratch Program Creation Flow — Design Spec

**Date:** 2026-06-07
**Status:** Approved (pending user spec review)
**Owner:** Trym
**Related specs:** [2026-06-06-program-tab-restructure-design.md](2026-06-06-program-tab-restructure-design.md), [2026-06-06-exercise-library-upgrade-design.md](2026-06-06-exercise-library-upgrade-design.md)

## Problem

Brukeren kan ikke lage et program manuelt. "Bygg fra scratch" i `NewProgramSheet` viser bare `alert("Bygg fra scratch kommer snart")`. Etter Free Exercise DB-importen (873 øvelser) trenger vi en flyt som lar brukeren bygge sitt eget program steg for steg.

## Goal

En Dropset-inspirert wizard som leder brukeren fra "Bygg fra scratch"-tap til et tomt, klart-til-fyll workout-program på 4 steg. Etter wizarden lander brukeren i en minimalistisk Strong-style editor der hver "+ Legg til øvelse" åpner eksisterende `ExercisePickerSheet`.

## Design Decisions (Brainstorming Outcomes)

Disse er låst fra Q1-Q6 i brainstormingen:

| # | Beslutning | Begrunnelse |
|---|------------|-------------|
| 1 | **Edit-in-place på detalj-skjermen** (ikke separat builder-rute) | Gjenbruker `ProgramDetail`, samme UI for view + bygg. |
| 2 | **Navn-prompt først, så opprett** | Programmet får identitet fra start. |
| 3 | **Alltid-på inline edit** (ingen modus-toggle) | Matcher Strong/Hevy. |
| 4 | **MVP scope** + `notes` per øvelse | Ingen drag-to-reorder, slide-to-delete eller animasjoner i v1. |
| 5 | **Aggregat sett-modell** (sets/reps/kg per øvelse) | Brukerens mentale modell; per-sett-frihet finnes på workout-tid. |
| 6 | **"Dag" = workout-template med flere ukedager** | Push kan kjøre Man+Ons+Fre — én template, mange økter. |

Visuell og UX-stil inspirert av Dropset-skjermbildene brukeren delte (2026-06-07).

## Architecture

### High-Level Flow

```
NewProgramSheet
  └─ Tap "Bygg fra scratch"
       │
       ▼
   Wizard (4 steg, full-screen route /program/new)
       ├─ Steg 1: Programnavn
       ├─ Steg 2: Workout-template (Custom/Push/Pull/Legs/Full body/Upper body)
       ├─ Steg 3: Workout-navn (pre-fylt fra template)
       └─ Steg 4: Ukedager ELLER Hyppighet (tabbed)
       │
       ▼
   POST /api/programs (med name + første dag i body)
       │
       ▼
   Redirect → /program/{id}
       │
       ▼
   ProgramDetail (alltid-på edit mode)
       ├─ Tap "+ Legg til øvelse" → ExercisePickerSheet → øvelsen legges til den dagen
       ├─ Tap øvelses-rad → EditExerciseSheet (sets/reps/kg/notes)
       ├─ Tap "+ LEGG TIL DAG" → wizard fra steg 2 (template-picker) for nytt workout
       └─ Tap "AKTIVER" → programmet blir aktivt (deaktiverer andre)
```

### Data Model (Schema)

**Migration 014: `program_days` får schedule-felter, `program_exercises` får `notes`**

```sql
-- api/db/migrations/014_program_day_schedule_and_notes.sql

ALTER TABLE program_days
  ADD COLUMN IF NOT EXISTS weekdays INTEGER[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS frequency_per_week INTEGER;

ALTER TABLE program_exercises
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Konsistens: enten weekdays er ikke-tom ELLER frequency_per_week er satt, men ikke begge.
-- (Soft-validert i app-lag for v1; constraint kan legges til senere.)

COMMENT ON COLUMN program_days.weekdays IS
  'Array of weekday integers (0=Sunday, 6=Saturday). Empty = no schedule.';
COMMENT ON COLUMN program_days.frequency_per_week IS
  'Alternative to weekdays: just count per week. Null when weekdays is used.';
```

**Modell — weekday-konvensjon:**
- Vi bruker **Postgres DOW**: 0=Søn, 1=Man, 2=Tir, 3=Ons, 4=Tor, 5=Fre, 6=Lør (matcher JavaScript `Date.getDay()`)
- `program_days.weekdays = {1,3,5}` = Mandag/Onsdag/Fredag
- `program_days.frequency_per_week = 3` (alternativ — "3× per uke uten faste dager")
- I UI viser vi pills i Norge-rekkefølge (Man først), men lagrer DOW-integer
- **Mutual exclusion:** enten `weekdays` ikke-tom ELLER `frequency_per_week` satt — ikke begge, og ikke ingen. Validert i Pydantic via `@model_validator`.

**Konflikt-håndtering:** Hvis bruker oppretter to dager med overlappende `weekdays` (f.eks. Push og Pull begge på Mandag), tillates det med en advarsel i UI. Kalender-view senere kan rendre begge.

### Frontend Files

**Nye komponenter:**

| Fil | Rolle |
|-----|-------|
| `web/src/app/(tabs)/program/new/page.tsx` | Wizard host (route `/program/new`). Holder steg-state, progress-bar, navigation. |
| `web/src/components/program/wizard/WizardLayout.tsx` | Topp-bar (← + progress), bunn-bar (→ Fortsett), main slot. |
| `web/src/components/program/wizard/ProgramNameStep.tsx` | Steg 1 — input + validering (1-60 tegn). |
| `web/src/components/program/wizard/WorkoutTemplateStep.tsx` | Steg 2 — liste av maler (Custom topp, så Push/Pull/Legs/Full body/Upper body). |
| `web/src/components/program/wizard/WorkoutNameStep.tsx` | Steg 3 — input pre-fylt fra template. |
| `web/src/components/program/wizard/WorkoutScheduleStep.tsx` | Steg 4 — tabs (Ukedager/Hyppighet) + relevant input. |
| `web/src/components/program/detail/EditExerciseSheet.tsx` | Sheet med 4 felt: sets, reps, weight_kg, notes. |
| `web/src/components/program/detail/RenameDaySheet.tsx` | Sheet med ett felt: navn. |
| `web/src/components/program/detail/DayActionsSheet.tsx` | Sheet med actions: Rename, Endre ukedager, Slett dag. |
| `web/src/components/program/detail/ExerciseActionsSheet.tsx` | Sheet med actions: Rediger, Bytt øvelse, Fjern. |
| `web/src/components/program/detail/AddDaySheet.tsx` | Wrapper rundt steg 2-4 av wizarden for å legge til en NY dag i et eksisterende program. |

**Modifiserte komponenter:**

| Fil | Endring |
|-----|---------|
| `web/src/components/program/library/NewProgramSheet.tsx` | Fjern `alert(...)` for "Bygg fra scratch"; naviger til `/program/new`. |
| `web/src/components/program/detail/ProgramDetail.tsx` | Legg til "+ LEGG TIL DAG"-rad nederst. Tittelfelt blir tappbart (åpner rename-sheet). Topp-bar får "AKTIVER"-link. |
| `web/src/components/program/detail/DayCard.tsx` | Ukedag-label over dag-navn (orange uppercase). "..."-meny åpner `DayActionsSheet`. "+ Legg til øvelse"-link nederst i hver dag. Hver øvelses-rad får "..."-meny og er tappbar (åpner `EditExerciseSheet`). |
| `web/src/components/program/workout/ExercisePickerSheet.tsx` | Bekreft callback-shape: `onSelect(exerciseId: string)`. (Allerede slik — ingen endring forventet.) |
| `web/src/lib/api.ts` | Legg til `createProgram(body)`, `renameProgram(id, name)`, `addProgramDay(programId, body)`, `updateProgramDay(...)`, `deleteProgramDay(...)`, `updateProgramExercise(...)`, m.fl. |

**Ingen endringer:**
- `ExerciseDetailModal` — uendret (brukes fra picker).
- `WorkoutRun` — uendret.
- `ProgramMenuSheet` — uendret.
- Eksisterende stiltokens (`--brand-orange`, `--brand-canvas`, m.fl.).

### Backend Files

**Modifiserte:**

`api/app/routers/programs.py` — legg til disse endepunktene:

```python
class FirstDayBody(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    weekdays: list[int] = Field(default_factory=list)  # 0=Sun..6=Sat
    frequency_per_week: int | None = Field(default=None, ge=1, le=7)

    @model_validator(mode="after")
    def _xor_schedule(self):
        has_days = len(self.weekdays) > 0
        has_freq = self.frequency_per_week is not None
        if has_days == has_freq:
            raise ValueError("Provide either weekdays or frequency_per_week, not both")
        if has_days and any(d < 0 or d > 6 for d in self.weekdays):
            raise ValueError("weekdays must be 0..6")
        return self

class CreateProgramBody(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    first_day: FirstDayBody | None = None

@router.post("/programs", status_code=201)
async def create_program(request: Request, body: CreateProgramBody) -> dict: ...

class UpdateProgramBody(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    is_active: bool | None = None
    # NB: folder_id håndteres via separat eksisterende endepunkt for å unngå sentinel-kompleksitet

@router.patch("/programs/{program_id}")
async def update_program(program_id: uuid.UUID, request: Request, body: UpdateProgramBody) -> dict: ...

class AddDayBody(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    weekdays: list[int] = Field(default_factory=list)
    frequency_per_week: int | None = Field(default=None, ge=1, le=7)

@router.post("/programs/{program_id}/days", status_code=201)
async def add_day(program_id: uuid.UUID, request: Request, body: AddDayBody) -> dict: ...

class UpdateDayBody(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    weekdays: list[int] | None = None
    frequency_per_week: int | None = Field(default=None, ge=1, le=7)

@router.patch("/programs/{program_id}/days/{day_id}")
async def update_day(program_id: uuid.UUID, day_id: uuid.UUID, request: Request, body: UpdateDayBody) -> dict: ...

@router.delete("/programs/{program_id}/days/{day_id}", status_code=204)
async def delete_day(program_id: uuid.UUID, day_id: uuid.UUID, request: Request) -> None: ...

class UpdateProgramExerciseBody(BaseModel):
    sets: int | None = Field(default=None, ge=1, le=20)
    reps: int | None = Field(default=None, ge=1, le=99)
    weight_kg: float | None = Field(default=None, ge=0, le=999.99)
    notes: str | None = Field(default=None, max_length=500)

@router.patch("/programs/{program_id}/days/{day_id}/exercises/{exercise_id}")
async def update_program_exercise(
    program_id: uuid.UUID, day_id: uuid.UUID, exercise_id: uuid.UUID,
    request: Request, body: UpdateProgramExerciseBody
) -> dict:
    """Atomisk oppdatering:
    - sets: justerer antall rader i program_exercise_sets (legg til/slett rader for å matche)
    - reps: oppdaterer alle eksisterende sett-rader for denne øvelsen
    - weight_kg: oppdaterer alle eksisterende sett-rader
    - notes: oppdaterer notes-kolonnen på program_exercises
    """
    ...
```

**Eksisterende endepunkter brukes:**
- `POST /programs/{program_id}/days/{day_id}/exercises` — legg til øvelse til dag (allerede finnes)
- `DELETE /programs/{program_id}/days/{day_id}/exercises/{exercise_id}` — fjern øvelse fra dag (allerede finnes)
- `GET /programs/{program_id}` — hent program med dager og øvelser (allerede finnes)

**Tool dispatcher (Claude coach):** Vi oppdaterer `program_handlers.py` til å bruke det nye `program_exercise_sets`-skjemaet konsistent (allerede beskrevet i `chatbot-orchestration-design.md` follow-ups). Out-of-scope for denne PR-en, men det fikses parallelt.

## User Flow — Detaljert

### Steg 1: NewProgramSheet → Bygg fra scratch

Bruker er i `/program` (tab), tap "+ Nytt program"-knapp. Sheet åpnes med tre valg. Tap "Bygg fra scratch" → `router.push("/program/new")`.

### Steg 2: Wizard på `/program/new`

Wizard-host holder client-side state:

```ts
type WizardState = {
  step: 1 | 2 | 3 | 4
  programName: string
  workoutTemplate: 'custom' | 'push' | 'pull' | 'legs' | 'full-body' | 'upper-body' | null
  workoutName: string  // pre-fylt fra template
  schedule:
    | { kind: 'weekdays'; days: number[] }
    | { kind: 'frequency'; perWeek: number }
}
```

**Topp-bar:** ← (tilbake — steg 1: tilbake til library; ellers: forrige steg) + progress bar (25/50/75/100%).

**Steg 1 (ProgramNameStep):**
- Tittel: "Programnavn"
- Subtittel: "Hva skal programmet hete?"
- Input (single line, autofocus)
- "→ Fortsett"-knapp nederst (deaktivert hvis tom)
- Validering: 1-60 tegn

**Steg 2 (WorkoutTemplateStep):**
- Tittel: "Velg første økt"
- Subtittel: "Vi hjelper deg fylle på med øvelser etterpå."
- Liste:
  1. **Custom** (øverst, ikke pre-fylling)
  2. Push
  3. Pull
  4. Legs
  5. Full body
  6. Upper body
- Tap en rad → bla videre til steg 3 (lagrer valgt template). Custom → workoutName = "" (brukeren må fylle inn).
- Ingen "Fortsett"-knapp — valget i seg selv navigerer.

**Steg 3 (WorkoutNameStep):**
- Tittel: "Navn"
- Subtittel: "Tilpass navnet hvis du vil"
- Input pre-fylt fra template (f.eks. "Push"). Custom → tom input.
- "→ Fortsett"-knapp nederst (deaktivert hvis tom).
- Validering: 1-80 tegn.

**Steg 4 (WorkoutScheduleStep):**
- Topp: to tabs — "Ukedager" (default) | "Hyppighet"
- Ukedager-tab:
  - Prompt: "Hvilke ukedager vil du gjøre [push]-økter?"
  - 7 pills horisontalt (Man/Tir/Ons/Tor/Fre/Lør/Søn). Tap toggler.
  - Bekreftelse: "Push på Man, Ons og Fre" (oppdateres på tap).
- Hyppighet-tab:
  - Prompt: "Hvor mange ganger i uka vil du gjøre [push]?"
  - Pills i grid: 1× / 2× / 3× / 4× / 5×.
  - Bekreftelse: "Push 3 ganger i uka — vi planlegger dagene".
- "→ Fortsett"-knapp nederst:
  - Ukedager-tab: krever 1+ valgt for å være enabled.
  - Hyppighet-tab: krever et tall valgt.

På "Fortsett" i steg 4:
- POST `/api/programs` med:
  ```json
  {
    "name": "PPL 4-dagers",
    "first_day": {
      "name": "Push",
      "weekdays": [1, 3, 5],
      "frequency_per_week": null
    }
  }
  ```
- Backend lager program + første dag (én transaksjon).
- Frontend mottar `{ id: "..." }` → `router.replace("/program/{id}")`.

### Steg 3: ProgramDetail (edit-in-place)

Bruker lander på `/program/{id}`. Skjermen viser:

```
←       AKTIVER  ⋯
PPL 4-dagers ✎
1 dag · 3 økter/uke · ikke aktiv

MANDAG · ONSDAG · FREDAG
Push ✎                 ⋯
( ingen øvelser enda )
+ LEGG TIL ØVELSE

────────────────────────
+ LEGG TIL DAG
```

Affordances:
- **Tap programnavn (✎):** åpner rename-sheet
- **Tap "AKTIVER":** PATCH `/api/programs/{id}` med `is_active: true` → deaktiverer andre programmer (allerede håndtert av eksisterende `update_program`-handler logic)
- **Tap "⋯" (top-right):** `ProgramMenuSheet` (eksisterende — Slett, Dupliser, Flytt til mappe)
- **Tap dag-navn (✎):** `RenameDaySheet`
- **Tap "⋯" på dag:** `DayActionsSheet` (Rename, Endre ukedager, Slett dag)
- **Tap "+ LEGG TIL ØVELSE":** `ExercisePickerSheet` (eksisterende) → bruker velger → POST `/programs/{id}/days/{day_id}/exercises`
- **Tap øvelses-rad:** `EditExerciseSheet` med sets/reps/weight_kg/notes
- **Tap "⋯" på øvelse:** `ExerciseActionsSheet` (Rediger, Bytt, Fjern)
- **Tap "+ LEGG TIL DAG" nederst:** `AddDaySheet` (wrapper rundt steg 2-4 av wizarden)

### Edit-flyt for sett

`EditExerciseSheet` har 4 felt:
- **Sett** (number, 1-20, default 3)
- **Reps** (number, 1-99, default 10)
- **Vekt (kg)** (number, optional, default null)
- **Notes** (textarea, optional, max 500 tegn)

Lagre-knapp → PATCH `/programs/{id}/days/{day_id}/exercises/{exercise_id}` → optimistisk UI-oppdatering (raden rerendrer med "3 × 10 · 80 kg") + revalidate.

**Bemerkning — sett-modell:** Brukeren ser aggregat (3×10@80). Backend lagrer som N `program_exercise_sets`-rader. Hvis bruker endrer sets fra 3 → 5, backend legger til 2 nye rader med samme reps/vekt. Endrer fra 5 → 3, backend sletter de 2 siste. Endrer reps eller weight, alle sett-rader oppdateres.

## Validation & Edge Cases

| Case | Behavior |
|------|----------|
| Bruker går tilbake i wizarden | State holdes; tilbake-knapp fra steg 1 går til `/program` |
| Bruker lukker app midt i wizarden | State tapes (in-memory); programmet finnes ikke før POST i steg 4 |
| Wizard validering feiler | Knapp er deaktivert; ingen toast |
| POST `/api/programs` feiler | Toast "Kunne ikke lage program. Prøv igjen." Wizarden returnerer til steg 4 med state intakt |
| Bruker oppretter dag med konflikt på ukedag (Push Man + Pull Man) | Tillatt. Subtle hint i confirm-line: "Mandag har allerede en økt" |
| Bruker velger 0 ukedager OG ikke hyppighet | "Fortsett"-knapp deaktivert |
| Bruker tar tap "+ LEGG TIL DAG" på et eksisterende program | Samme `AddDaySheet`-flyt brukes; dagen legges til programmet |
| Network feil under øvelses-add/edit | Toast + rollback optimistisk update |
| Bruker sletter alle dager i et program | Programmet eksisterer fortsatt; viser "Legg til dag for å komme i gang" |

## Testing Strategy

### Backend tests (`api/tests/test_programs_v2.py`)

```python
async def test_create_program_with_first_day(client, auth_user):
    resp = await client.post("/api/programs", json={
        "name": "Test Program",
        "first_day": {
            "name": "Push",
            "weekdays": [1, 3, 5],
            "frequency_per_week": None,
        }
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Program"
    assert len(data["days"]) == 1
    assert data["days"][0]["name"] == "Push"
    assert data["days"][0]["weekdays"] == [1, 3, 5]

async def test_create_program_without_first_day(client, auth_user):
    resp = await client.post("/api/programs", json={"name": "Empty"})
    assert resp.status_code == 201
    assert resp.json()["days"] == []

async def test_update_program_name(...): ...
async def test_add_day_to_program(...): ...
async def test_update_day_weekdays(...): ...
async def test_delete_day(...): ...
async def test_update_exercise_sets_increases_set_rows(...): ...
async def test_update_exercise_sets_decreases_set_rows(...): ...
async def test_update_exercise_notes(...): ...
async def test_create_program_unauthorized(...): ...
async def test_create_program_invalid_weekday(client, auth_user):  # weekday > 6
    ...
async def test_first_day_requires_weekdays_xor_frequency(client, auth_user):
    # 422 when both empty
    # 422 when both set
    ...
```

### Frontend tests (Vitest)

```tsx
// ProgramNameStep.test.tsx — knapp deaktivert med tom input, enabled med navn
// WorkoutTemplateStep.test.tsx — Custom øverst, tap navigerer
// WorkoutScheduleStep.test.tsx — tabs bytter, pills toggler, bekreftelse oppdateres
// EditExerciseSheet.test.tsx — felter validerer (sets > 0, reps > 0)
// AddDaySheet.test.tsx — bruker steg 2-4, lagrer ny dag
```

### Manuell e2e

1. Logg inn → tab Programmer
2. Tap "+ Nytt program" → "Bygg fra scratch"
3. Skriv "PPL 4-dagers" → Fortsett
4. Tap "Push" → ingen "Fortsett"-tap nødvendig
5. Navnet er "Push" → Fortsett
6. Tap Man, Ons, Fre → Fortsett
7. Land på `/program/{id}` — viser Push med ukedag-label
8. Tap "+ LEGG TIL ØVELSE" → søk "benkpress" → tap → Benkpress lagt til
9. Tap Benkpress-raden → sheet → 3 sett, 8 reps, 80 kg, notes "kontroller knebøy" → Lagre
10. Raden viser "3 × 8 · 80 kg"
11. Tap "+ LEGG TIL DAG" → Pull → Tir, Tor → Fortsett
12. Pull-dag lagt til
13. Tap "AKTIVER" → grønn pill "Aktiv" vises på programkortet i biblioteket

## Out of Scope (v1)

- Drag-to-reorder dager eller øvelser
- Slide-to-delete
- Kalender-view (mappes til `program_days.weekdays` senere)
- Endre weekdays-overlapp-konflikt med eksplisitt UI
- Templates-flyt ("Velg en mal" forblir placeholder — egen workstream)
- Per-sett pyramide-redigering i program-bygger (kan justeres i workout-run)
- Re-orden av dager basert på weekday-sortering (vi viser dem i `day_number`-rekkefølge; sortering kan komme med kalender-view)

## Dependencies

- Migration 014 må deployes før backend-endepunktene
- `program_handlers.py`-fix for `program_exercise_sets` (out-of-scope her, men nødvendig for at coachen skal kunne bruke `add_exercise_to_day`)
- Free Exercise DB (873 øvelser) — allerede importert

## Open Questions

1. Skal "AKTIVER"-link i topp-bar ha en bekreftelse hvis et annet program er aktivt? **Beslutning:** Nei — handlingen er reversibel og friction-fritt aktivering matcher Strong-stil.
2. Hva med "rest days" i en uke som ikke er dekket? **Beslutning:** Out-of-scope. Vi viser bare programmerte dager; resten av uka er implisitt hvile.
3. Bør "Custom"-template gi en helt tom navne-input? **Beslutning:** Ja — brukeren skriver det de vil ("Mage", "Kondisjon", etc.). Default placeholder: "Min økt".

## Future Work (post-v1)

- Kalender-view som visualiserer programmets `weekdays` over en uke
- Drag-to-reorder dager (omsortering)
- Drag-to-reorder øvelser innenfor en dag
- Per-sett-styring i bygger (pyramide, drop-sett)
- Auto-generer maler basert på template-valg (Push → pre-fyll bryst/skuldre-øvelser)
- "Velg en mal"-flyt (egen workstream)

## Rollout

1. Migration 014 deployes til staging → verifiser kolonner finnes
2. Backend-endepunkter merget + deployet
3. Frontend wizard + edit-in-place merget
4. Manuell e2e i preview-env
5. Migration 014 deployes til prod
6. Frontend prod-deploy
7. Trym tester e2e i prod
