# Trening-tab: økt-maler (Strong-modell) — design

> **Status:** Design (under review 2026-06-13)
> **Scope:** Erstatt dagens `program → dager → øvelser`-modell med en flat «økt-mal»-modell (Strong-inspirert), med coach-forslag på toppen. Omdesigner Trening-tabben og rydder datamodellen + coach-tools deretter.

## Bakgrunn

Dagens modell bunter flere dager under ett «program» (f.eks. «PPL 6-dagers» = Push A, Pull A, Bein A, Push B, Pull B). I brainstorm 2026-06-13 konkluderte vi:

- Brukeren tenker i **enkelt-økter**, ikke i et multi-dag-program.
- Program-bibliotek + program-detalj føltes rotete pga. den nøstede `program → dag → øvelse`-strukturen.
- De største appene (Strong/Hevy) bruker en flat **template**-modell: du plukker en økt-mal og kjører. Det matcher brukerens mentale modell.

Vår differensiator er **coachen**: forslaget «hva du bør trene nå» ligger alltid øverst, men biblioteket av maler er alltid tilgjengelig for fritt valg. Det fjernet behovet for et eget «Selv-styrt vs Coach-styrt»-modusvalg (forkastet underveis) — én skjerm dekker begge behov.

## Produktmodell

- **Økt-mal** (heretter *mal*) er enheten: et navn + en ordnet liste øvelser, hver med planlagte sett (reps/vekt). Tilsvarer innholdet i dagens `program_day`.
- **Mappe** er en valgfri gruppering av maler. En mappe ER brukerens «split» (f.eks. mappen «Min PPL» inneholder Push A, Pull A, Bein …). Ett nivå — ingen mapper i mapper.
- **Coach-forslag** vises alltid øverst på Trening-tabben: coachen foreslår neste mal basert på historikk + mål. Brukeren kan følge forslaget («Start») eller bytte/plukke en annen mal fritt.
- **Quick Start** lar deg starte en tom økt uten mal (ad-hoc), med «lagre som mal» etterpå.
- **Aktiv-økt-bar:** hvis en økt pågår vises en minimert bar nederst (over bunn-navet) som lar deg fortsette.
- **Forkastet:** «program»-container (multi-dag), onboarding-modusvalg, modus-chip, ukedags-planlegging (`program_days.weekdays`/`frequency_per_week`).

## Skjermer

### Trening-tab (erstatter `program-library` + `program-detail`)
Referanse-mockup: `design-variants/app-preview/trening-strong.html` (Coach-styrt-rammen, uten modus-chip).

Topp→bunn:
1. Topbar: tittel «Start økt» + søk + tema.
2. **Coach-forslag** (oransje hero): eyebrow «COACHEN FORESLÅR», malnavn, kort begrunnelse («basert på økta i går»), «Start økt» + diskret «Bytt →».
3. **Hurtigstart:** «+ Start tom økt».
4. **Mappe-piller:** `Alle (N)` (default) · hver mappe · `+ Mappe`.
5. **Maler** (2-kol grid): malkort med navn + avkortet øvelses-preview + «⋯»-meny. Tap → mal-detalj. «+ Ny mal» i seksjonshodet.
6. **Aktiv-økt-bar** nederst hvis økt pågår.

### Mal-detalj / rediger (erstatter `program-detail` for én dag)
En ryddig enkelt-mal-visning: malnavn, øvelsesliste med sett (reps × vekt), rediger-modus (legg til/fjern/omorganiser øvelser og sett), «Start denne økta», «⋯» (gi nytt navn, flytt til mappe, dupliser, slett).

### WorkoutRun (kjør-økt)
Stort sett uendret. Starter fra en mal (`template_id`) eller ad-hoc. Logger sett mot `workouts`/`workout_sets` som i dag. «Fullfør» → ad-hoc kan lagres som mal (eksisterende save-as-flyt, omdøpt fra «program» til «mal»).

### Downstream-referanser (oppdateres)
- **Home:** «dagens/neste økt»-heroen drives nå av coach-forslaget (samme `next-workout`-kilde som Trening-tabben), ikke av `program_day.weekdays`.
- **Kalender:** viser fullførte økter fra historikk (ikke planlagte ukedager). Planlagt «i dag» = coach-forslaget.
- **Historikk:** referanse `program_day_id` → `template_id` (økt viser hvilken mal den kom fra, eller «Tom økt»).

## Datamodell

Prod har kun testdata (2 programmer, 4 dager, 9 sett, 8 økter), så vi optimaliserer for en ren målmodell.

### Målskjema
```sql
workout_templates (
  id uuid pk,
  user_id uuid fk,
  name text,
  folder_id uuid fk null → template_folders(id) ON DELETE SET NULL,
  position int,                 -- rekkefølge i mappe/bibliotek
  created_at timestamptz,
  archived_at timestamptz null  -- soft-delete/arkiv
)

template_exercises (
  id uuid pk,
  template_id uuid fk → workout_templates ON DELETE CASCADE,
  exercise_id text fk → exercises,
  position int,
  notes text null
)

template_exercise_sets (
  id uuid pk,
  template_exercise_id uuid fk → template_exercises ON DELETE CASCADE,
  set_number int,
  reps int null,
  weight_kg numeric null,
  notes text null
)

template_folders (              -- repurposing av program_folders
  id uuid pk,
  user_id uuid fk,
  name text,
  position int
)
```
- `workouts.program_day_id` → `workouts.template_id uuid null` (null = ad-hoc).
- RLS på alle nye/omdøpte tabeller (eierskap-scopet, jf. 005/017-mønsteret). `template_exercise_sets`/`template_exercises` scopes via forelder.

### Migrasjon (lav risiko — testdata)
1. Opprett `workout_templates`, `template_exercises`, `template_exercise_sets`; rename `program_folders` → `template_folders` (eller ny tabell + kopier).
2. **Hvert `program` → én `template_folder`** med programmets navn (bevarer «PPL»-grupperingen). Programmer som allerede lå i en gammel `program_folder` ignorerer det gamle folder-nivået (vi flater til ett nivå).
3. **Hvert `program_day` → én `workout_template`** (name = dagnavn, folder_id = folderen fra steg 2).
4. `program_exercises` → `template_exercises`, `program_exercise_sets` → `template_exercise_sets`.
5. `workouts.program_day_id` → `template_id` via day→template-mapping.
6. Dropp `programs`, `program_days`, gamle `program_exercises*` etter verifisering (egen opprydnings-migrasjon).
7. Oppdater `docs/ARCHITECTURE.md` (schema-docs-gaten).

> **Beslutning til review:** alternativt en *ren cutover* (dropp gammelt, start tomt) siden alt er testdata. Migrasjonen over er billig og bevarer Tryms testmaler/-økter, så den anbefales — men cutover er akseptabelt.

## Backend

### Endepunkter
| Metode | Rute | Hva |
|---|---|---|
| GET | `/api/templates` | Brukerens maler (m/ folder, preview-øvelser) |
| POST | `/api/templates` | Ny mal |
| GET | `/api/templates/{id}` | Mal m/ øvelser + sett |
| PATCH | `/api/templates/{id}` | Navn, folder, posisjon, øvelser/sett |
| DELETE | `/api/templates/{id}` | Slett/arkiver |
| GET/POST/PATCH/DELETE | `/api/template-folders[/{id}]` | Mapper (omdøpt fra program_folders) |
| GET | `/api/coach/next-workout` | `{ template_id, name, reason }` — coachens forslag |
| POST | `/api/workouts` | `{ template_id? }` — start fra mal eller ad-hoc (uendret kontrakt utvidet) |
| POST | `/api/templates/from-workout` | Lagre fullført ad-hoc-økt som mal (omdøpt fra `programs/from-workout`) |

Eierskap-validering + rate-limit-mønstrene fra security-auditen gjelder (LLM-leverte IDer verifiseres; ingen `str(e)`-lekkasje).

### Coach-forslag («neste økt»)-logikk
**v1 (heuristikk, ingen LLM-kall):** Se siste fullførte økt sin mal. Hvis den lå i en mappe → foreslå neste mal i mappen (etter `position`, syklisk). Ellers → foreslå malen som er trent for lengst siden (mest «stale»). Tom historikk → første mal. Begrunnelsen («basert på økta i går») genereres fra denne logikken.
**v2 (senere):** la coach-LLM-en raffinere forslaget med mål/skader/restitusjon. Egen tool. Ikke i dette scope.

### Coach-tools (rename + opprydding)
- `create_program` → `create_template(name, exercises[])`
- `add_program_day` / `remove_program_day` / `rename_program_day` → **fjernes** (ikke lenger dager).
- `add_exercise_to_day` / `remove_exercise_from_day` / `swap_exercise_in_day` / `update_exercise_sets` → opererer på `template_id`.
- `create_folder` / `rename_folder` / `delete_folder` / `list_folders` → template-mapper.
- Nytt: `suggest_next_workout` (valgfritt; ellers dekkes av endepunktet). Oppdater `dispatcher.py` + `BASE_PROMPT` tool-liste + `tool-labels.ts`.

## Komponentstruktur (frontend)
```
web/src/components/training/            (erstatter components/program/)
├── library/
│   ├── TrainingLibrary.tsx             (Trening-tab: forslag + quickstart + piller + grid + aktiv-bar)
│   ├── CoachSuggestionCard.tsx
│   ├── FolderPillBar.tsx               (gjenbrukes fra dagens, omdøpt)
│   ├── TemplateCard.tsx
│   └── ...sheets (NewTemplate, NewFolder, MoveToFolder, SaveAsTemplate)
├── detail/
│   └── TemplateDetail.tsx              (mal-detalj/rediger)
└── workout/
    └── WorkoutRun.tsx                  (~uendret; template_id i stedet for program_day)
```
Bygges i forge-design-systemet (lyst default + mørk modus) som er låst separat.

## Ikke-mål
- Onboarding-modusvalg / Selv-styrt-vs-Coach-styrt (forkastet — én skjerm).
- Ukedags-planlegging og `weekdays`/`frequency_per_week` (forkastet).
- Coach-LLM-drevet forslag (v2, senere) — v1 er heuristikk.
- Mal-versjonering/historikk på maler (senere).
- Drag-and-drop-omorganisering (long-press/meny holder i v1).

## Sekvensering (viktig)
Program-koden som restruktureres ligger nå i fly i PR-stacken #25–#30 (ikke merget). Denne redesignen **erstatter** mye av den. Anbefalt rekkefølge:
1. Merge forge-design-systemet + program-stacken først (dagens verifiserte tilstand).
2. Implementer denne redesignen som eget workstream på toppen.

Alternativt: hvis vi vet at program-tabben uansett skrives om nå, kan vi vurdere å ikke merge program-detaljene fra stacken — men det er en egen beslutning utenfor denne specen.

## Åpne beslutninger (for review)
1. **Migrasjon vs cutover** (anbefaler migrasjon — billig, bevarer testdata).
2. **Folder-mapping:** program → mappe (anbefalt, bevarer gruppering) vs. flate alt til løse maler.
3. **next-workout v1:** heuristikk (anbefalt) vs. vente på coach-LLM.
4. **Terminologi i UI:** «Mal» vs «Økt» vs «Template». (Anbefaler «Økt» som det brukeren ser, «mal» internt.)

## Testing
- Backend (pytest): templates CRUD + eierskap (404 på fremmed), folders, `next-workout`-heuristikk (rotasjon i mappe, stale-fallback, tom historikk), `from-workout`, migrasjon-smoke (program_day → template).
- Frontend (vitest): TrainingLibrary (forslag vises, fritt valg), TemplateCard preview, FolderPillBar filter, SaveAsTemplate, CoachSuggestionCard.
