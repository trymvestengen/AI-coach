# Program-tab redesign

> **Status:** Design (godkjent 2026-06-06)
> **Scope:** Full re-arkitektur av Program-fanen — rebrand, omorganisering, splitt av se-program/kjør-økt, mappe-organisering.

## Bakgrunn og mål

Dagens `ProgramScreen.tsx` er en monolitt på ~735 linjer som blander tre konseptuelt forskjellige flater (bibliotek, dagsoversikt, aktiv-økt-logging) i én komponent. Den bruker fortsatt gamle CSS-variabler (`--ai-accent`, `--bg-2`, etc.) via legacy-aliaser, og har en hardkodet 12-ukers progress bar med placeholder-data.

Målet er å:

1. **Splitte konseptene** — bibliotek, program-detalj og kjør-økt blir tre separate ruter, hver med eget ansvar.
2. **Bruke brand-systemet** direkte (oransje på off-white, custom-ikoner) som i Home/Coach/Profile.
3. **Støtte flere programmer** — brukeren kan ha mange programmer organisert i egendefinerte mapper.
4. **Forberede for coach-orkestrering** — chat-coachen skal kunne opprette/oppdatere programmer; UI må reflektere dette tydelig.

## Ikke-mål (out-of-scope)

- Drag-and-drop mellom mapper i web-UI (lages som tap-handling «Flytt til mappe»-sheet i denne runden; drag kan komme senere).
- Ende-til-ende-tester (Playwright) — dekkes i egen workstream.
- «Bygg fra scratch»-wizarden — endepunktet og bunnen-sheet-valget eksisterer, men selve wizarden er en placeholder («Kommer snart»). Coach- og mal-flytene er hovedfokus i denne runden.
- Workout-historikk-skjerm — historikk eksisterer allerede via `/api/workouts`-endepunktet og er synlig på Profile-tabben. Egen historikk-flate på Program-tabben er ikke en del av dette redesignet.

## Arkitektur — ruter

| Rute | Hva som vises | Når brukeren er der |
|---|---|---|
| `/program` | Bibliotek (dagens-økt-banner + mapper + programmer) | Default-landing fra bunnmeny |
| `/program/[programId]` | Program-detalj (header + dager) | Tap på et program-kort |
| `/program/workout/[workoutId]` | Kjør-økt (full skjerm, ingen bunnmeny) | Tap «Start»/«Fortsett» på banner eller dag |

Bottom sheets for små handlinger (ikke egne ruter):

- `NewProgramSheet` — tre alternativer: Snakk med coachen, Velg mal, Bygg fra scratch.
- `NewFolderSheet` — input for mappenavn.
- `MoveToFolderSheet` — velg mappe (eller «Rot»).
- `ProgramMenuSheet` — fra `⋯` på detalj-skjerm: Sett aktiv / Flytt til mappe / Slett.

Modaler/overlays beholdes for:

- `RestTimer` — flytende countdown etter sett-check.
- `ShareSheet` — del-forhåndsvisning etter fullført økt.

## Komponentstruktur

### Server-komponenter (henter data)

```
web/src/app/(tabs)/program/
├── page.tsx                          ← bibliotek-landingsside
├── [programId]/
│   └── page.tsx                      ← program-detalj
└── workout/
    ├── layout.tsx                    ← fullskjerm-layout, ingen bunnmeny
    └── [workoutId]/
        └── page.tsx                  ← kjør-økt
```

### Klient-komponenter

```
web/src/components/program/
├── library/
│   ├── ProgramLibrary.tsx            ← orkestrerer hele bibliotek-skjermen
│   ├── TodaysWorkoutBanner.tsx       ← oransje banner, alle 5 states
│   ├── FolderGrid.tsx                ← 2-kol grid av mapper
│   ├── FolderCard.tsx                ← én mappe-tile
│   ├── ProgramGrid.tsx               ← 2-kol grid av programmer
│   ├── ProgramCard.tsx               ← ett program-tile (med AKTIV-pill)
│   ├── NewProgramSheet.tsx           ← bottom sheet med tre valg
│   ├── NewFolderSheet.tsx            ← bottom sheet med navn-input
│   ├── ProgramPickerSheet.tsx        ← velg aktivt program (brukes fra «Ingen aktiv»-banner)
│   └── EmptyLibrary.tsx              ← når brukeren ikke har noen programmer
├── detail/
│   ├── ProgramDetail.tsx             ← orkestrerer detalj-skjermen
│   ├── ProgramDetailHeader.tsx       ← navn + meny (sett aktiv, flytt, slett)
│   ├── DayCard.tsx                   ← én dag (med «I dag»-pill, hviledag-state)
│   ├── ProgramMenuSheet.tsx          ← ⋯-meny: sett aktiv / flytt / slett
│   └── MoveToFolderSheet.tsx         ← mappe-velger
├── workout/
│   ├── WorkoutRun.tsx                ← orkestrerer kjør-økt
│   ├── WorkoutHeader.tsx             ← × + timer + dagnavn
│   ├── ExerciseRow.tsx               ← øvelse med inline set-logging
│   ├── RestTimer.tsx                 ← (flyttes hit fra dagens placering)
│   └── ShareSheet.tsx                ← (flyttes hit; del-forhåndsvisning)
└── shared/
    └── icons.tsx                     ← program-spesifikke SVG-ikoner
```

### Sletting

Disse filene slettes når den nye strukturen er på plass:

- `web/src/components/program/ProgramScreen.tsx` (monolitt)
- `web/src/components/program/ProgramList.tsx`
- `web/src/components/program/ProgramDetail.tsx` (eldre version)
- `web/src/components/program/ExerciseDetail.tsx` — sjekkes mot bruk; hvis ingen referanser igjen utenfor den gamle skjermen, slettes.
- `web/src/components/program/ExerciseLibrary.tsx` — samme: sjekk og slett hvis dødt.

## Designprinsipper

- **Brand-vars direkte** — `var(--brand-orange)`, `var(--brand-canvas)`, `var(--brand-surface)`, etc. Ingen `--ai-accent`/`--bg-2`-bruk i nye filer.
- **2-kol grid** for både mapper og programmer i biblioteket.
- **Liste-visning** under kjør-økt (alle øvelser synlige, inline set-logging — ikke én-om-gangen).
- **Aktiv-program-pille** øverst i høyre hjørne på program-kortet, oransje fyllfarge.
- **Mappe-tiles** har subtil orange-tinted gradient bakgrunn (`#fff5ee → #fff`) for å skille seg fra program-tiles.

## Banner-states (TodaysWorkoutBanner)

Banneret er øverst i biblioteket og kan være i én av fem states:

| State | Trigger | Visuell behandling | CTA |
|---|---|---|---|
| **Økt pågår** | Uavsluttet workout finnes (in_progress) | Oransje gradient, pulserende prikk, «PÅGÅENDE»-label | «Fortsett →» |
| **Dagens økt klar** | Aktivt program + workout-dag i dag, ingen pågående | Oransje gradient, «DAGENS ØKT»-label | «Start →» |
| **Hviledag** | Aktivt program, ingen workout-dag i dag | Dempet oransje (`#fff5ee → #ffedd5`), mørk tekst | «Se programmet →» |
| **Ingen aktiv** | Bruker har programmer, ingen markert aktiv | Nøytral hvit, stiplet border | «Velg aktivt program» (→ ProgramPickerSheet) |
| **Tom** | Bruker har ingen programmer i det hele tatt | Nøytral hvit, stiplet border | «Lag program» (→ NewProgramSheet) |

## Datamodell og API

### Programmer

Aktiv-program-semantikk: **kun ett program kan være aktivt om gangen** per bruker. Å sette et annet som aktivt deaktiverer det forrige automatisk. Dette holder banner-logikken entydig.

### Mapper

- Helt brukerstyrt: ingen predefinerte mapper.
- En mappe har: `id`, `user_id`, `name`, `created_at`.
- Et program har et nullable `folder_id`. Null = ligger i «rot».
- Sletting av en mappe flytter alle programmer i den til rot (ikke kaskade-sletter programmer).

### Eksisterende endepunkter (ingen endring)

- `GET /api/programs/active`
- `POST /api/workouts` (start økt)
- `POST /api/workouts/[id]/sets`
- `POST /api/workouts/[id]/complete`
- `POST /api/workouts/[id]/share`

### Nye endepunkter

| Endepunkt | Formål |
|---|---|
| `GET /api/programs` | Liste alle programmer (id, name, folder_id, is_active, current_week, days_count) |
| `PATCH /api/programs/[id]` | Endre `is_active` / `folder_id` / `name` |
| `DELETE /api/programs/[id]` | Slett program |
| `GET /api/folders` | Brukerens mapper |
| `POST /api/folders` | Opprett (body: `{ name }`) |
| `PATCH /api/folders/[id]` | Endre navn |
| `DELETE /api/folders/[id]` | Slett (programmer flyttes til rot via transaksjon) |
| `GET /api/workouts/in-progress` | Returnerer uavsluttet workout (eller null) — banner trenger dette for «Økt pågår»-state |
| `DELETE /api/workouts/[id]` | Forkast en pågående eller fullført økt (brukes fra «Forkast økt»-confirm i `WorkoutRun`) |

Backend-router-organisering:

- `api/app/routers/programs.py` — utvides med PATCH/DELETE.
- `api/app/routers/folders.py` — ny router.
- `api/app/routers/workouts.py` — utvides med `/in-progress`-endepunkt.

Database (Supabase Postgres):

- Ny tabell `folders` med `id`, `user_id`, `name`, `created_at` + RLS-policies som matcher mønsteret fra `user_injuries`/`user_preferences`.
- Ny kolonne `folder_id` på `programs` (nullable, FK til `folders(id)` ON DELETE SET NULL).

## Dataflyt

### Bibliotek (`/program`)

Server-komponent henter parallelt:

1. `getActiveProgramToday()` → `{ program, day }` eller `null`
2. `getInProgressWorkout()` → workout-objekt eller `null`
3. `getPrograms()` → alle programmer
4. `getFolders()` → mapper

Sender alt som props til `<ProgramLibrary />`. Klient bare rendrer; mutasjoner (sett aktiv, flytt, slett, opprett) kaller API og deretter `router.refresh()` for å re-fetche serverdata.

### Program-detalj (`/program/[id]`)

Server henter:

1. Programmet (med dager og øvelser)
2. Brukerens mapper (for `MoveToFolderSheet`)
3. Hvilken dag som er «i dag» (samme logikk som banneret)

### Kjør-økt (`/program/workout/[id]`)

Server henter workout + tilhørende dag + øvelser. Klient håndterer sett-logging optimistisk:

- Hver sett-check oppdaterer lokal state umiddelbart.
- I bakgrunnen kalles `POST /api/workouts/[id]/sets`.
- Ved feil: én retry. Hvis fortsatt feil: liten toast «Lagrer i bakgrunnen» og forsøk fortsetter ved neste sett-check.
- «Fullfør økt» kalles når alle sett er ferdige → vis `ShareSheet` → tilbake til `/program`.

## Edge cases

| Scenario | Hva som skjer |
|---|---|
| To programmer markert aktive (gammel data) | Server velger nyeste (siste `updated_at`) som aktiv ved henting; viser advarsel-toast første gang |
| Bruker sletter aktivt program | `is_active` faller bort, banner går til «Ingen aktiv»-state |
| Bruker sletter mappe med programmer i | Programmene flyttes til rot via transaksjon (FK ON DELETE SET NULL) |
| Workout-id i URL finnes ikke / hører til annen bruker | Redirect til `/program` med toast «Økt ikke funnet» |
| Bruker prøver å starte ny økt mens en pågår | Banner er i «Økt pågår»-state, ingen «Start»-CTA. Bruker må fullføre eller forkaste den pågående først (se neste rad). |
| Bruker vil forkaste en pågående økt | I `WorkoutRun` viser `×`-knappen en confirm-sheet med to valg: «Lukk og fortsett senere» (workout består som `in_progress`) eller «Forkast økt» (`DELETE /api/workouts/[id]`, banner faller tilbake til «Dagens økt klar» eller «Hviledag»). |
| Sett-logging feiler | Optimistisk update + én retry. Vedvarende feil: toast og fortsett. |
| Bruker går ut av kjør-økt-skjermen midt i økten | Workout består som `in_progress`, banneret blir «Økt pågår» med «Fortsett»-CTA |
| API helt nede ved server-render | Banner og lister viser sist hentede data; mutasjoner viser inline-feil i sheet/knapp |

## Testing

### Frontend (Vitest, co-located)

- `TodaysWorkoutBanner.test.tsx` — alle fem states rendrer riktig CTA og tekst
- `ProgramCard.test.tsx` — AKTIV-pill vises kun når aktiv
- `FolderCard.test.tsx` — viser riktig antall programmer
- `WorkoutRun.test.tsx` — set-check-flyt, all-done → fullfør-knapp, optimistisk update ruller tilbake på feil

### Backend (pytest)

- `test_programs_router.py` — list/patch/delete; sett-aktiv deaktiverer forrige; slett-mappe flytter programmer til rot
- `test_folders_router.py` — create/rename/delete
- `test_workouts_router.py` — utvides med `in_progress`-endepunkt

### Ende-til-ende

Ikke i denne specen. Dekkes når Playwright-workstreamen kommer.

## Migreringsplan (kort)

1. Backend først: nye endepunkter + ny `folders`-tabell + `folder_id`-kolonne (migration). Eksisterende endepunkter forblir uendret.
2. Klient-komponenter under `library/`, `detail/`, `workout/` — bygges parallelt med backend.
3. Ny `page.tsx` byttes inn når komponentene er klare.
4. Slett gamle filer i `web/src/components/program/` etter at den nye `page.tsx` er live og verifisert i preview.
5. Frontend-tester legges til underveis (TDD per komponent).

## Hva som leveres etter denne specen

En fungerende Program-tab som:

- Lar brukeren se alle programmene sine organisert i egendefinerte mapper.
- Viser dagens økt prominent øverst, med alle 5 banner-states implementert.
- Lar brukeren starte en økt og logge sett i en dedikert fullskjerm-rute.
- Lar coachen opprette programmer (via eksisterende chat-flyt) som havner i biblioteket.
- Lar brukeren velge mal eller (placeholder) bygge fra scratch via `NewProgramSheet`.
- Bruker brand-systemet konsekvent.
