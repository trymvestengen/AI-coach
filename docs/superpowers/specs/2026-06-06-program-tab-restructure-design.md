# Program-tab restructure (Strong-inspirert)

> **Status:** Design (godkjent 2026-06-06)
> **Scope:** Omstrukturer dagens `/program`-flate til Strong-stil. Pill-bar for mapper, quick-start-CTA for ad-hoc-økt, save-as-program-flyt etter ad-hoc.

## Bakgrunn

Forrige iterasjon (se [2026-06-06-program-tab-design.md](2026-06-06-program-tab-design.md)) introduserte mapper og programmer som to side-om-side 2-kolonne grids, samt tre separate ruter (bibliotek/detalj/kjør-økt). I bruk viste det seg at:

1. Mapper og programmer i samme view er visuelt rotete — det er ikke tydelig hva som ligger i en mappe og hva som er på rot.
2. Mappe-kortene har ingen funksjon (kan ikke åpnes).
3. Det mangler en «start ad-hoc-økt»-flyt — brukeren må alltid ha et program for å trene.

Denne specen redesigner library-flaten basert på Strong sin «Start Workout»-layout, og legger til ad-hoc-økt med save-as-program.

## Ikke-mål

- Templates-bibliotek (PPL, full body etc.) — fortsatt placeholder.
- «Bygg fra scratch»-wizard for programmer — fortsatt placeholder.
- Drag-and-drop av programmer mellom mapper — long-press-meny er nok foreløpig.
- Workout-historikk-flate på Trening-tabben — historikk lever på Profile-tabben.
- Endring av program-detalj eller kjør-økt-rutene (utover ad-hoc-utvidelsen av WorkoutRun).

## Arkitektur — ruter

Ingen endring fra forrige iterasjon:

| Rute | Hva som vises |
|---|---|
| `/program` | Bibliotek-landing (denne specen omstrukturerer denne) |
| `/program/[programId]` | Program-detalj (uendret) |
| `/program/workout/[workoutId]` | Kjør-økt (utvides med ad-hoc-mode) |

## Layout — ny landing

```
┌─────────────────────────┐
│ Trening                 │  ← stor tittel (NY)
│                         │
│ ┌─ Dagens økt ────────┐ │  ← banner (uendret, 5 states)
│ │ Underkropp · Dag 1  │ │
│ │ [ Start → ]         │ │
│ └─────────────────────┘ │
│                         │
│ HURTIGSTART             │  ← NY seksjon
│ ┌─────────────────────┐ │
│ │  + Start tom økt    │ │
│ └─────────────────────┘ │
│                         │
│ [Alle (3)][Min split][Bulk 26][+ Mappe]  ← pill-rad (NY)
│                         │
│ Programmer       [+ Nytt] │
│ ┌──────┐ ┌──────┐       │
│ │ PPL  │ │ Full │       │  ← 2-kol grid (uendret)
│ │ AKTIV│ │ body │       │
│ └──────┘ └──────┘       │
└─────────────────────────┘
```

### Pill-bar (FolderPillBar)

**Rekkefølge:**
1. `Alle (N)` — alltid først, default valgt. Viser totalt antall programmer.
2. Hver mappe — sortert eldste først. Bare navn (ingen count for å spare plass).
3. `+ Mappe` — alltid sist, stiplet ramme. Tap → `NewFolderSheet`.

**Visuell behandling:**
- Aktiv pill: fylt oransje (`var(--brand-orange)`), hvit tekst.
- Inaktiv pill: hvit bakgrunn, grå border.
- Horisontalt scrollbar hvis for mange. Aktiv pill scrolles automatisk inn i view ved valg.

**Long-press på mappe-pill:**
- Holder bruker > 500ms (touch) eller right-click (mus) → åpner `FolderActionsSheet` med to valg:
  - **Endre navn** → input-felt med nåværende navn → `PATCH /api/folders/[id]`.
  - **Slett** → confirm-dialog: «Slett 'X'? Programmene flyttes til 'Alle' (uten mappe).» → `DELETE /api/folders/[id]` (programmer mister `folder_id` via eksisterende `ON DELETE SET NULL`).

**Filtrering:**
- Valgt pill = «Alle» → grid viser alle programmer uavhengig av `folder_id`.
- Valgt pill = spesifikk mappe → grid viser kun `programs.filter(p => p.folder_id === selectedFolderId)`.
- Hvis grid blir tom under en mappe-pill → vis «Ingen programmer i denne mappen. Flytt et hit fra ⋯-menyen.»

**Persistens:**
- Valgt pill lagres bare i React `useState` — ikke localStorage. Refresh = tilbake til «Alle».

### Quick start (QuickStartCTA)

Egen seksjon mellom banner og pill-rad:

```
HURTIGSTART
[ + Start tom økt ]
```

- Stiplet ramme, nøytral grå tekst (mindre fremtredende enn banner-CTA).
- Tap → `POST /api/workouts` uten `program_day_id` → redirect til `/program/workout/[workout_id]`.

### Program-grid

Uendret 2-kol grid. `ProgramCard` utvides med:
- Preview-tekst (truncated, 2-3 linjer): første 3 øvelser fra første dag, kommaseparert.
- Eksempel: «Back squat, Romanian deadlift, Leg press…»

`FolderCard.tsx` slettes (erstattet av pill-bar).

## Program-creation-flyt

`NewProgramSheet` (uendret) viser tre paths: Coach / Mal / Bygg selv. Når en path returnerer et nytt program, går vi gjennom **save-folder-flyten**:

### Første gang (ingen mapper)

Modal popper:

```
Lag din første mappe
Hva vil du kalle den?
[ Første split            ]   ← default-forslag
[ Lagre i mappen ]
[ Hopp over (ingen mappe) ]
```

- «Lagre»: `POST /api/folders { name }` → `PATCH /api/programs/[id] { folder_id }`.
- «Hopp over»: programmet beholder `folder_id = NULL`.

### Etterfølgende (mapper finnes)

Mini-sheet med radio-valg:

```
Lagre i mappe
[○] Ingen mappe
[●] Min split          ← default basert på valgt pill
[○] Bulk 26
[○] + Lag ny mappe…
[ Lagre ]
```

- Default-valg avhenger av valgt pill:
  - Pill = «Alle» → default «Ingen mappe».
  - Pill = spesifikk mappe → default den mappen.
- «+ Lag ny mappe…» → embed mini-form for nytt navn → opprett + velg.

### Coach-flyt (særhåndtering)

Coach-tool-use kan lage programmer direkte (uten å passere gjennom UI-en). Disse havner alltid med `folder_id = NULL`. Brukeren flytter dem selv via program-detalj sin ⋯-meny (`MoveToFolderSheet` finnes allerede).

## Ad-hoc-økt («Tom økt»)

### Start

Tap «+ Start tom økt» → `POST /api/workouts` uten body-felt (`program_day_id` = NULL) → redirect til `/program/workout/[id]`.

### WorkoutRun i ad-hoc-mode

`WorkoutRun` deriverer mode fra `workout.day_name`:
- `null` → ad-hoc.
- annet → vanlig.

**Empty state** (ingen øvelser ennå):

```
× [00:14]
Tom økt

Ingen øvelser ennå.
[ + Legg til øvelse ]
```

**Etter øvelser er lagt til:**

```
× [00:14]
Tom økt

┌ Back squat ─────────┐
│ Sett 1: 5×80 ✓      │
│ Sett 2: 5×80 ✓      │
│ [+ Legg til sett]   │
└─────────────────────┘

┌ Bench press ────────┐
│ [+ Legg til sett]   │
└─────────────────────┘

[ + Legg til øvelse ]
[ Fullfør økt ✓ ]
```

**Forskjeller fra vanlig mode:**
- «+ Legg til øvelse» CTA alltid synlig nederst (i tillegg til knappen i empty state).
- Hver `WorkoutExerciseRow` får en «+ Legg til sett»-knapp (i vanlig mode er settene pre-fylt fra program-dagen).
- «Fullfør økt ✓» er alltid synlig (i vanlig mode dukker den bare opp når alle pre-fylte sett er logget).

### ExercisePickerSheet (NY)

Bottom sheet med:
- Søkefelt øverst.
- Liste fra `GET /api/exercises` (eksisterende endepunkt) — viser navn + muskel-grupper.
- Optional muskel-gruppe-filter (chips).
- Tap øvelse → legges til som ny rad i WorkoutRun + sheet lukkes.

### Fullfør → SaveAsProgramSheet (NY)

Tap «Fullfør økt ✓»:
1. `PATCH /api/workouts/[id]/complete` (eksisterende).
2. Hvis ad-hoc (workout hadde ingen `program_day_id`) → åpne `SaveAsProgramSheet`:

```
Lagre som program?
Lar deg gjenta denne økten senere.

Navn:
[ Tom økt 6. juni        ]

Mappe:
[○] Ingen mappe
[●] Min split
[○] + Ny mappe…

[ Lagre som program ]
[ Bare lagre økten  ]
```

- **«Bare lagre økten»**: ikke noe program lages, workouten er fullført og lagret som vanlig. Redirect til `/program`.
- **«Lagre som program»**: `POST /api/programs/from-workout { workout_id, name, folder_id }` → lager program med én dag «Dag 1» som inneholder workoutens øvelser. Default-sett (reps + kg) tas fra siste loggede sett per øvelse. Redirect til `/program`.

Hvis workouten var IKKE ad-hoc (var koblet til en program-dag), brukes eksisterende `ShareSheet` (uendret).

## Backend

### Nytt endepunkt: `POST /api/programs/from-workout`

```
body: { workout_id: string, name: string, folder_id: string | null }
response 201: { id, name, is_active: false, folder_id }
404: workout not found / not user's
400: workout has no logged sets
```

Logikk (i `api/app/routers/programs.py`):

1. Verifiser workout tilhører bruker.
2. Hent alle loggede sett gruppert per `exercise_id`.
3. Hvis ingen sett → 400.
4. Lag program: `INSERT INTO programs (id, user_id, name, folder_id)`.
5. Lag én dag: `INSERT INTO program_days (id, program_id, day_number=1, name=name)`.
6. For hver unike `exercise_id` i loggede sett:
   - `INSERT INTO program_exercises` med dummy `sets`/`reps`/`weight_kg` fra siste sett (gammel skjema-baggasje fra migration 002 — vi bruker bare fra `program_exercise_sets` videre).
   - For hvert sett: `INSERT INTO program_exercise_sets` med `reps`/`weight_kg`.

Returner det nye programmet.

### Eksisterende endepunkter

Ingen endring. `POST /api/workouts` aksepterer allerede ingen body (ad-hoc default).

## Klient-state-modell

### ProgramLibrary

```ts
const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null) // null = Alle
const [newProgramOpen, setNewProgramOpen] = useState(false)
const [newFolderOpen, setNewFolderOpen] = useState(false)
const [pickerOpen, setPickerOpen] = useState(false)
const [folderActions, setFolderActions] = useState<ProgramFolder | null>(null) // long-pressed pill
const [saveFolderOpen, setSaveFolderOpen] = useState<{ programId: string } | null>(null)

const visiblePrograms = useMemo(
  () => selectedFolderId === null
    ? programs
    : programs.filter(p => p.folder_id === selectedFolderId),
  [programs, selectedFolderId]
)
```

### WorkoutRun

```ts
const isAdHoc = workout.day_name === null
const [exercises, setExercises] = useState<ProgramExercise[]>(workout.exercises) // mutable in ad-hoc
const [pickerOpen, setPickerOpen] = useState(false)
const [saveAsProgramOpen, setSaveAsProgramOpen] = useState(false)
```

## Komponentstruktur

```
web/src/components/program/library/
├── ProgramLibrary.tsx              [omstruktureres]
├── TodaysWorkoutBanner.tsx          [uendret]
├── QuickStartCTA.tsx                [NY]
├── FolderPillBar.tsx                [NY]
├── FolderActionsSheet.tsx           [NY]
├── SaveFolderSheet.tsx              [NY]
├── ProgramCard.tsx                  [utvides med preview-tekst]
├── FolderCard.tsx                   [SLETTES]
├── NewProgramSheet.tsx              [uendret]
├── NewFolderSheet.tsx               [uendret]
└── ProgramPickerSheet.tsx           [uendret]

web/src/components/program/workout/
├── WorkoutRun.tsx                   [utvides for ad-hoc-mode]
├── WorkoutExerciseRow.tsx           [utvides med «+ Legg til sett»]
├── ExercisePickerSheet.tsx          [NY]
├── SaveAsProgramSheet.tsx           [NY]
├── WorkoutHeader.tsx                [uendret]
├── CloseConfirmSheet.tsx            [uendret]
├── RestTimer.tsx                    [uendret]
└── ShareSheet.tsx                   [uendret]
```

## Edge cases

| Scenario | Hva som skjer |
|---|---|
| Bruker sletter mappe som er valgt som pill | `selectedFolderId` resettes til `null` («Alle») etter delete |
| Bruker oppretter sin første mappe via «+ Mappe» (pill) | Ingen automatisk re-filter — bruker må selv tappe den nye pillen for å se den filtrert |
| Ad-hoc-økt fullført uten å logge noe sett | `SaveAsProgramSheet` viser «Bare lagre økten» som eneste valg (lagre-program-knappen er disablet) |
| Bruker forsøker «+ Legg til sett» i vanlig (ikke-ad-hoc) mode | Knappen vises ikke i denne modusen — pre-fylte sett fra programmet er allerede der |
| Long-press på «Alle»-pill | Ingen meny — Alle er ikke en mappe |
| Long-press på «+ Mappe»-pill | Ingen meny |
| Lite mobil-skjerm med 6+ mapper i pill-bar | Horisontal scroll fungerer, aktiv pill scrolles inn |

## Testing

### Frontend (Vitest)

- `FolderPillBar.test.tsx` — Alle vises, filter funker, long-press trigger
- `FolderActionsSheet.test.tsx` — Rename og Slett trigger riktige API-kall
- `SaveFolderSheet.test.tsx` — First-time vs etterfølgende, default-valg basert på pill
- `QuickStartCTA.test.tsx` — Trigger start-workout-flyt
- `SaveAsProgramSheet.test.tsx` — Lagre-program knapp disabled hvis ingen sett
- `WorkoutRun.test.tsx` — Utvides for ad-hoc-mode (legg til øvelse, legg til sett, fullfør → SaveAsProgramSheet)

### Backend (pytest)

- `test_programs_router.py` — utvides med `from_workout`-endepunkt: 400 hvis ingen sett, 404 hvis fremmed workout, 201 ved suksess

## Migreringsplan (kort)

1. Backend først: `POST /api/programs/from-workout` med tester.
2. Library-komponentene: bygg `QuickStartCTA`, `FolderPillBar`, `FolderActionsSheet`, `SaveFolderSheet` parallelt.
3. Omstrukturer `ProgramLibrary` — fjern mappe-grid, legg inn pill-bar + quick-start. Slett `FolderCard`.
4. Utvid `ProgramCard` med preview-tekst.
5. Workout-utvidelser: `ExercisePickerSheet`, `SaveAsProgramSheet`, ad-hoc-mode i `WorkoutRun`, «+ Legg til sett» i `WorkoutExerciseRow`.
6. Verifiser i preview (apply migration ikke nødvendig — ingen DB-endringer).
