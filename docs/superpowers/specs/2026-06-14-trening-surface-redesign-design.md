# Trenings-flate-redesign — designspec

**Dato:** 2026-06-14
**Status:** Godkjent design (klar for implementasjonsplan)
**Omfang:** Hele trenings-flaten — Trening-oversikt, øvelses-system («legg til øvelse»), mal-popup og aktiv økt. Modellert på Strong/Hevy.

## Context

Brukeren er ikke fornøyd med trenings-flaten. Den umiddelbare smerten: «legg til øvelse» i den nye mal-popupen (PR #44) er en primitiv inline-liste uten søk, kategorisering eller sortering. Bredere ønsker brukeren at hele flaten — program/Trening, øvelse-velger og aktiv økt — skal kjennes like gjennomarbeidet som de største appene (Strong, Hevy, Dropset).

En benchmark av Strong/Hevy/Dropset/Boostcamp/Fitbod/JEFIT (se research i samtalen) viste tydelige fellesmønstre: én delt øvelse-velger med søk + filter (utstyr/målmuskel) + multi-select + egne øvelser; et `SETT/FORRIGE/KG/REPS/✓`-grid der «forrige» autofyller fra sist; hviletimer som auto-starter; og sanntids-PR-feiring. De fleste apper er **flate rutiner** (ikke fler-ukers program).

Mål: lande riktig informasjonsarkitektur og bygge flaten inkrementelt til Strong/Hevy-paritet, med rom for voice-laget senere.

## Besluttede valg (fra brainstorm)

1. **Flat modell** (Strong/Hevy-stil): en samling maler man starter ad-hoc. Ukedager er en løs plan (`scheduled_days`). Ingen «aktivt program»-konsept nå.
2. **Ett samlet øvelses-system**: samme komponent for å bla (referanse) og for å velge (picker med multi-select).
3. **Egne øvelser**: bruker kan opprette egne (`user_exercises`), vist sammen med det seedede biblioteket.
4. **IA som Strong/Hevy**: Trening-fanen huser både mal-bygging og økt-start; øvelsesbibliotek er en oppslagsflate, ikke egen bunn-fane; 4 bunn-faner beholdes (Hjem · Trening · Coach · Profil).
5. **Rekkefølge: picker-først, inkrementelt** — øvelses-systemet brukes både i mal-popup og aktiv økt, så det låser opp begge.

## Designprinsipp (voice-first / gym-kontekst)

Adoptert fra Dropset: appen brukes med «hender som rister, fra andre siden av rommet, med delt oppmerksomhet». Alt skal kunne gjøres med store touch-targets og være lesbart på avstand. Voice er en overlegg-kanal som kommer senere; designet skal ikke stenge for den (f.eks. «forrige»-kolonnen driver voice-dialog som «forrige gang tok du 80×8 — samme?»).

---

## A. Informasjonsarkitektur / navigasjon

- **Bunn-faner (uendret):** Hjem · Trening · Coach · Profil. Ingen 5. fane.
- **Trening-fanen** er hjem for både mal-bygging og økt-start (Strong «Start» / Hevy «Workout»): coachens «neste økt» + «Start tom økt» øverst, maler i mapper under.
- **Øvelses-systemet** nås kontekstuelt (fra mal-popup og aktiv økt som picker) og som oppslag fra Trening/Profil — ikke som egen bunn-fane. Dagens `/exercises`-rute beholdes som blamodus-inngang.
- **Kalender/ukeplan:** en «Denne uka»-widget på Hjem som åpner en popup (besluttet tidligere). Ingen kalender-fane.

## B. Øvelses-systemet (kjernen)

Én komponent, to moduser:

**Blamodus** (referanse, dagens `/exercises`): liste + detalj, ingen avhuking.

**Pickermodus** (åpnes fra mal-popup og aktiv økt):
- **Søk:** fuzzy på navn + målmuskel.
- **Filtre:** målmuskel og utstyr (dropper vanskelighet — knapt brukt i de store appene).
- **Sortering:** alfabetisk · nylig brukt · favoritter.
- **Multi-select:** avhuking → «Legg til N valgte». (Voice senere: «legg til benkpress, skråbenk og flyes».)
- **Egne øvelser:** «+ Lag ny øvelse» (navn, målmuskel, utstyr); vises sammen med biblioteket, eid av bruker.
- **Detalj:** gjenbruk `ExerciseDetailModal` (instruksjoner/bilde + historikk/PR).
- **Presentasjon:** eget ark/fullskjerm — ikke dagens trange inline-liste i `TemplateSheet`.

Datakilde: pickeren leser `exercises` der `user_id IS NULL` (seedet/global) `OR user_id = <bruker>` (egne) — ett enkelt filter, ingen union/FK-bytte.

## C. Mal = økt — én sammenslått side

Den separate mal-popupen (PR #44 `TemplateSheet`) og den separate aktiv-økt-skjermen (`WorkoutRun`) slås sammen til **én vedvarende side**: malen ER økt-siden. Trykk på en mal i Trening åpner denne siden direkte (ingen mellomside, ingen egen popup).

Samme layout, to tilstander:
- **Planlegging (ikke startet):** primærknappen øverst (der «Fullfør» sitter) viser **«Start økt»**. Grid-et er redigerbart (kg/reps, ± sett, bytt/legg til/fjern øvelse).
- **Aktiv (etter «Start økt»):** samme knapp blir grønn **«Fullfør»**; ✓ logger hvert sett; «Forrige»-kolonnen autofyller fra sist; hviletimer auto-starter; **sanntids-PR-feiring** når et sett slår forrige beste.

Felles:
- **Grid `SETT / FORRIGE / KG / REPS / ✓`** — ett grid for både plan og logging (`getPreviousSets` driver «Forrige»).
- **«+ Legg til øvelse»** åpner øvelses-pickeren (multi-select); **«↔ bytt»** bytter øvelse via samme picker.
- **Norske labels** gjennomgående («Finish»→«Fullfør», «Add Set»→«Legg til sett», «Previous»→«Forrige»).
- **Mal-innstillinger (navn, mappe, ukedager, slett) ligger i ⋯-menyen — IKKE inline på siden** (skal ikke forstyrre under økt). Dette er en eksplisitt korreksjon fra brukeren.
- **Persistert redigering:** `addSet`/`updateSet`/`deleteSet` (i dag stubbet/`void`-et) kobles til ekte endepunkter; planlagte endringer lagres på malen, loggede sett på økta.

Konsekvens for PR #44: backend-endepunktene (øvelse-CRUD på maler) og redigeringslogikken gjenbrukes. Frontend-`TemplateSheet`-popupen er en mellomstasjon som erstattes av denne sammenslåtte siden; `WorkoutRun` utvides til å være både plan- og logg-visning.

## D. Datamodell-endringer

- **Egne øvelser via nullbar `exercises.user_id`:** legg til `user_id UUID NULL REFERENCES users(id)` på `exercises` (NULL = seedet/global, non-null = brukerens egen). Dette holder alle eksisterende FK-er intakte (`template_exercises.exercise_id`, `workout_sets.exercise_id` peker fortsatt på `exercises.id`) og gjør pickeren til ett enkelt filter. RLS på `exercises`: lese `user_id IS NULL OR user_id = auth.uid()`; skrive/endre/slette kun egne (`user_id = auth.uid()`). Egne øvelser får en tekst-id (f.eks. `usr-<uuid>`) i samme id-rom.
- **`scheduled_days`** på `workout_templates` (`SMALLINT[]`, ISO 1–7, CHECK på verdiområde) — ukeplan, fra tidligere plan.
- **Favoritter:** `user_exercise_favorites(user_id, exercise_id)` join-tabell (RLS user-eid) — driver «favoritter»-sortering. «Nylig brukt» avledes fra `workout_sets`-historikk (ingen ny tabell). Filtrering på målmuskel/utstyr bruker eksisterende `exercises`-kolonner.

ARKITEKTUR.md må oppdateres for hver migrasjon (CLAUDE.md-krav).

## E. Implementasjonsrekkefølge (picker-først)

Hver del = egen shippbar PR, bygget på #44.

1. **Øvelses-systemet:** unified picker (søk/filter/sortering/multi-select) + egne øvelser (`exercises.user_id` + CRUD-endepunkter) + favoritter + detalj. Koble inn i dagens `TemplateSheet` (#44) som første konsument. (Implementasjonsplanen lages for DENNE delen først.)
2. **Mal = økt (sammenslått side):** slå sammen `TemplateSheet` + `WorkoutRun` til én side med to tilstander (Start økt ↔ Fullfør), grid med «Forrige»-kolonne, persistert sett-redigering, sanntids-PR, norske labels, mal-innstillinger i ⋯. Erstatter den separate mellomsiden helt.
3. **Trening-oversikt + ukeplan:** `scheduled_days` (satt via ⋯) + «Denne uka»-widget på Hjem, opprydding av Trening-oversikten.

## Testing-strategi

- **Backend (pytest):** nye endepunkter for `user_exercises` (CRUD, eierskap/404, RLS-verifisering mot prod), picker-søk/filter-respons. Sett-persistering i aktiv økt.
- **Frontend (Vitest + RTL):** picker (søk filtrerer, filter-chips, multi-select-akkumulering, «legg til N», lag egen øvelse); `TemplateSheet` åpner picker; `WorkoutRun` «forrige»-autofyll, bytt øvelse, PR-feiring.
- **Migrasjoner:** verifiser RLS + CHECK applisert i Supabase (samme gate som 019).
- TDD gjennomgående; `make check` før hver PR.

## Avgrenset / utsatt (YAGNI)

- **Voice-overlegg** i picker/aktiv økt — eget arbeid senere; designet stenger ikke for det.
- **Fler-ukers program-lag** (Boostcamp-stil) — bevisst utelatt; flat modell valgt.
- **Visuell finpuss** — kjøres via `design-compare` (CLAUDE.md) når flyten står; denne spec-en handler om IA/flyt, ikke endelig visuell retning.
- **Supersett/sett-typer (warmup/drop)** — vurderes i del 2 hvis tid; ikke kjernekrav nå.
