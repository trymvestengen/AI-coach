# Mal = økt-sammenslåing (del 2) — implementasjonsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Slå sammen mal-visning og aktiv økt til én visuell `WorkoutPage` med to tilstander (planlegging «Start økt» ↔ aktiv «Fullfør»), med «Forrige»-kolonne, persistert logging (UPSERT), hviletimer, sanntids-PR (Epley 1RM) og norske labels. Fjern den separate mal-popupen.

**Architecture (valgt — lazy økt-oppretting):** Planlegging lever på `/program/template/[id]` og leser/redigerer **malen** (template-endepunkter fra #45). «Start økt» oppretter økta og myk-navigerer til `/program/workout/[id]` (aktiv), som leser **økta** (`getWorkout` flettér planlagte + loggede sett) og logger via UPSERT-`logSet`. Felles `WorkoutPage`-komponent driver begge ruter. Ingen `started_at`-migrasjon.

**Tech Stack:** FastAPI + psycopg, Supabase Postgres, Next.js 16 + TS, Vitest + RTL, pytest.

**Forutsetning:** #45 merget. Branch `feat/mal-okt-merge` fra main (gjort).

**Referanse:** spec `docs/superpowers/specs/2026-06-14-trening-surface-redesign-design.md` (seksjon C «Valgt arkitektur»). Eksisterende `web/src/components/program/workout/WorkoutRun.tsx` er ~90% av aktiv-grid/hviletimer/finish — **WorkoutPage bygges ved å adaptere WorkoutRun**, ikke fra scratch.

---

## Filstruktur
- `api/db/migrations/023_workout_sets_unique.sql` (NY) — unik-constraint for UPSERT.
- `api/app/routers/workouts.py` (ENDRE) — `log_set` UPSERT; `template_id` i `get_workout`; `DELETE`/`PATCH /workouts/{id}/exercises/...`.
- `api/tests/test_workouts_router.py` (ENDRE).
- `web/src/lib/oneRepMax.ts` (NY) + test — Epley 1RM.
- `web/src/lib/api.ts` (ENDRE) — `template_id` på `WorkoutDetail`; `removeWorkoutExercise`, `swapWorkoutExercise`.
- `web/src/components/training/workout/WorkoutPage.tsx` (NY) + test — den samlede siden.
- `web/src/app/(tabs)/program/template/[templateId]/page.tsx` (ENDRE) — rendrer WorkoutPage planlegging.
- `web/src/app/(tabs)/program/workout/[workoutId]/page.tsx` (ENDRE) — rendrer WorkoutPage aktiv.
- `web/src/components/training/library/TrainingLibrary.tsx` (ENDRE) — mal-kort navigerer til mal-ruta (ingen popup).
- SLETT: `web/src/components/training/detail/TemplateSheet.tsx` (+ test), `web/src/components/training/detail/TemplateDetail.tsx` (+ test). BEHOLD `TemplateMenuSheet`.
- `docs/ARCHITECTURE.md` (ENDRE) — migrasjon 023.

---

## Task 1: Migrasjon 023 — unik-constraint på workout_sets (forutsetning for UPSERT)

**Files:** Create `api/db/migrations/023_workout_sets_unique.sql`; Modify `docs/ARCHITECTURE.md`.

FØRST: les `api/db/migrations/001_initial.sql` (og evt. senere) for å bekrefte at `workout_sets` IKKE allerede har en unik-constraint på `(workout_id, exercise_id, set_number)`. Hvis den finnes, hopp over CREATE og noter det.

- [ ] **Step 1:** Skriv fila:
```sql
-- api/db/migrations/023_workout_sets_unique.sql
-- Unik-constraint så log_set kan UPSERT (oppdatere et sett ved re-logging
-- i stedet for å duplisere). Se 2026-06-14-trening-surface-redesign-design.md.
-- Rydd evt. duplikater først (behold laveste id) for å unngå at constraint feiler:
DELETE FROM workout_sets a USING workout_sets b
  WHERE a.ctid > b.ctid
    AND a.workout_id = b.workout_id
    AND a.exercise_id = b.exercise_id
    AND a.set_number = b.set_number;
ALTER TABLE workout_sets
  ADD CONSTRAINT workout_sets_unique_per_set
  UNIQUE (workout_id, exercise_id, set_number);
```
- [ ] **Step 2:** Oppdater `docs/ARCHITECTURE.md` (migrasjonsrad 023 + noter constraint på workout_sets). IKKE applisér mot prod (orkestratoren gjør det).
- [ ] **Step 3:** Commit: `git add api/db/migrations/023_workout_sets_unique.sql docs/ARCHITECTURE.md && git commit -m "feat(db): migrasjon 023 — unik-constraint på workout_sets for UPSERT"`

---

## Task 2: `log_set` → UPSERT + `template_id` i `get_workout`

**Files:** Modify `api/app/routers/workouts.py`; Test `api/tests/test_workouts_router.py`.

Les `log_set` (POST /workouts/{id}/sets) og `get_workout` (GET /workouts/{id}) i filen først for eksakt nåværende SQL og respons-shape.

- [ ] **Step 1:** Skriv feilende tester:
```python
@pytest.mark.asyncio
async def test_log_set_upserts(monkeypatch, mock_conn, make_mock_get_conn):
    # ownership-sjekk returnerer en rad, så INSERT ... ON CONFLICT kjøres
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=("w-1",))
    cur_ins = AsyncMock(); cur_ins.fetchone = AsyncMock(return_value=("s-1",))
    mock_conn.execute = AsyncMock(side_effect=[cur_check, cur_ins])
    monkeypatch.setattr("app.routers.workouts.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).post("/api/workouts/w-1/sets", json={
        "exercise_id": "squat", "set_number": 1, "reps": 5, "weight_kg": 80,
    })
    assert resp.status_code == 201
    # verifiser at SQL-en inneholder ON CONFLICT
    sql = mock_conn.execute.call_args_list[-1].args[0]
    assert "ON CONFLICT" in sql.upper()


@pytest.mark.asyncio
async def test_get_workout_includes_template_id(monkeypatch, mock_conn, make_mock_get_conn):
    # tilpass mock til get_workout sin faktiske spørrings-sekvens (les koden!)
    ...  # implementer slik at responsen inneholder "template_id"
```
(For `test_get_workout_includes_template_id`: les `get_workout` og bygg mock-radene så de matcher kolonnene; assert `resp.json()["template_id"]` finnes. Hvis det er enklere, splitt i to tester.)

- [ ] **Step 2:** Kjør, verifiser FAIL.
- [ ] **Step 3:** Implementer:
  - I `log_set`: behold ownership-sjekken (workout tilhører bruker + ikke fullført). Endre INSERT til UPSERT:
```sql
INSERT INTO workout_sets (id, workout_id, exercise_id, set_number, reps, weight_kg, rpe)
VALUES (%s, %s, %s, %s, %s, %s, %s)
ON CONFLICT (workout_id, exercise_id, set_number)
DO UPDATE SET reps = EXCLUDED.reps, weight_kg = EXCLUDED.weight_kg, rpe = EXCLUDED.rpe
RETURNING id
```
  - I `get_workout`: legg `w.template_id` i head-SELECT og i retur-dicten (`"template_id": str(row_template_id) if ... else None`).
- [ ] **Step 4:** Kjør hele `test_workouts_router.py`, verifiser PASS (inkl. eksisterende).
- [ ] **Step 5:** Commit: `feat(api): log_set UPSERT + template_id i get_workout`

---

## Task 3: Workout-øvelse fjern/bytt-endepunkter (aktiv tilstand)

**Files:** Modify `api/app/routers/workouts.py`; Test `api/tests/test_workouts_router.py`. Gjenbruk `swap_active_workout_exercise`-logikken (workout_handlers.py) — enten kall handleren eller speil SQL-en.

- [ ] **Step 1:** Feilende tester for:
  - `DELETE /api/workouts/{id}/exercises/{exercise_id}` → sletter `workout_sets` for øvelsen i økta (eier-scopet via workout) → 200 `{status:"deleted"}`; 404 hvis økt ikke eies.
  - `PATCH /api/workouts/{id}/exercises/{exercise_id}` body `{new_exercise_id}` → flytter loggede sett til ny øvelse (swap) → 200; 404 hvis økt ikke aktiv/eies.
  (Skriv mock-baserte tester i samme stil som resten av fila.)
- [ ] **Step 2:** Kjør, FAIL.
- [ ] **Step 3:** Implementer begge ruter med ownership-sjekk (`SELECT id FROM workouts WHERE id=%s AND user_id=%s`), prøv/except + `logger.exception` + generisk feil (matche M1-mønster). Swap: `UPDATE workout_sets SET exercise_id=%s WHERE workout_id=%s AND exercise_id=%s`.
- [ ] **Step 4:** Kjør, PASS.
- [ ] **Step 5:** Commit: `feat(api): fjern/bytt øvelse i aktiv økt`

---

## Task 4: `oneRepMax.ts` — Epley 1RM (delt, testbar)

**Files:** Create `web/src/lib/oneRepMax.ts` + `web/src/lib/oneRepMax.test.ts`.

- [ ] **Step 1:** Feilende test:
```ts
import { describe, it, expect } from "vitest"
import { epley1rm, bestE1rm } from "./oneRepMax"

describe("oneRepMax", () => {
  it("epley: weight × (1 + reps/30)", () => {
    expect(epley1rm(80, 8)).toBeCloseTo(101.33, 1)
    expect(epley1rm(100, 1)).toBeCloseTo(103.33, 1)
  })
  it("epley: 0 or null weight → 0", () => {
    expect(epley1rm(null, 8)).toBe(0)
    expect(epley1rm(0, 8)).toBe(0)
  })
  it("bestE1rm picks the max across sets", () => {
    expect(bestE1rm([{ reps: 8, weight_kg: 80 }, { reps: 5, weight_kg: 90 }])).toBeCloseTo(105, 0)
  })
  it("bestE1rm of empty → 0", () => {
    expect(bestE1rm([])).toBe(0)
  })
})
```
- [ ] **Step 2:** Kjør, FAIL.
- [ ] **Step 3:** Implementer:
```ts
export function epley1rm(weightKg: number | null | undefined, reps: number | null | undefined): number {
  if (!weightKg || weightKg <= 0 || !reps || reps <= 0) return 0
  return weightKg * (1 + reps / 30)
}

export function bestE1rm(sets: { reps: number | null; weight_kg: number | null }[]): number {
  return sets.reduce((max, s) => Math.max(max, epley1rm(s.weight_kg, s.reps)), 0)
}
```
- [ ] **Step 4:** Kjør, PASS. **Step 5:** Commit: `feat(web): Epley 1RM-hjelper`

---

## Task 5: api.ts — template_id + workout-øvelse-klienter

**Files:** Modify `web/src/lib/api.ts`.

- [ ] **Step 1:** Legg `template_id?: string | null` på `WorkoutDetail`-typen (les typen, legg feltet additivt).
- [ ] **Step 2:** Legg til funksjoner (følg eksisterende fetch-mønster):
```ts
export async function removeWorkoutExercise(workoutId: string, exerciseId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workouts/${workoutId}/exercises/${exerciseId}`, {
    method: "DELETE", headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}
export async function swapWorkoutExercise(workoutId: string, exerciseId: string, newExerciseId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workouts/${workoutId}/exercises/${exerciseId}`, {
    method: "PATCH", headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ new_exercise_id: newExerciseId }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}
```
- [ ] **Step 3:** `npx tsc --noEmit` rent. **Step 4:** Commit: `feat(web): api-klient template_id + workout-øvelse-mutasjoner`

---

## Task 6: WorkoutPage — felles komponent, to tilstander (adapter WorkoutRun)

**Files:** Create `web/src/components/training/workout/WorkoutPage.tsx` + `.test.tsx`. Adapter innmaten fra `WorkoutRun.tsx`.

Props:
```ts
interface Props {
  mode: "planning" | "active"
  template?: TemplateDetail   // mode==="planning"
  workout?: WorkoutDetail     // mode==="active"
  exerciseNames: Record<string, string>
  folders: TemplateFolder[]
}
```
Krav (bygg trinnvis med tester per delkrav — se delsteg):
- **Grid `SETT / FORRIGE / KG / REPS / ✓`**, norske labels. I planlegging er ✓-kolonnen skjult/disabled og «Forrige» tom. I aktiv vises begge.
- **Primærknapp:** planlegging «Start økt» (oransje) → `startWorkoutFromTemplate(template.id)` → `router.push('/program/workout/'+workout_id)`. Aktiv «Fullfør» (grønn) → finish-ark (gjenbruk WorkoutRun sitt) → `completeWorkout`.
- **Redigering planlegging:** kg/reps/±sett → `updateTemplateExercise`; legg til → ExercisePicker → `addExerciseToTemplate`; fjern → `removeExerciseFromTemplate`; bytt → ExercisePicker → fjern+legg til. Re-fetch malen (`router.refresh()` på server-ruta eller client-reload).
- **Logging aktiv:** ✓ → `logSet` (UPSERT) + auto-start hviletimer + PR-sjekk; «+ Legg til sett»; legg til øvelse (lokal + materialiseres ved logging) / fjern (`removeWorkoutExercise`) / bytt (`swapWorkoutExercise`).
- **«Forrige»:** `getPreviousSets` (aktiv).
- **Hviletimer:** 90s default, justerbar per øvelse (lokal `Record<exId,number>`), auto-start på ✓, lyd + `navigator.vibrate`, kan hoppes over (behold WorkoutRun-mekanikk).
- **Sanntids-PR:** ved ✓, `epley1rm` for settet vs `bestE1rm(previous[ex] + loggede i økt)`; slår → feiring (toast).
- **⋯-meny:** gjenbruk `TemplateMenuSheet` (navn/mappe/slett) — bruk `template_id` (fra workout i aktiv, fra template i planlegging).

Delsteg (hver TDD: test → fail → impl → pass → commit):
- [ ] **6a:** Skjelett + to-tilstand-knapp («Start økt» vs «Fullfør») + norske grid-labels + ✓ skjult i planlegging. RTL: rendrer riktig knapp per `mode`.
- [ ] **6b:** Planleggings-redigering (kg/reps/±sett → updateTemplateExercise; fjern → removeExerciseFromTemplate). RTL.
- [ ] **6c:** Legg til / bytt øvelse via ExercisePicker (planlegging → template-endepunkter). RTL.
- [ ] **6d:** Aktiv logging: ✓ → logSet; «Forrige»-autofyll fra getPreviousSets. RTL.
- [ ] **6e:** Hviletimer (auto-start på ✓, justér, skip). RTL/timer.
- [ ] **6f:** Sanntids-PR (epley) feiring ved ny rekord. RTL.
- [ ] **6g:** Aktiv legg til/fjern/bytt øvelse (lokal + removeWorkoutExercise/swapWorkoutExercise). RTL.
- [ ] **6h:** «Start økt» (create+navigate) og «Fullfør» (completeWorkout via finish-ark). RTL.
- [ ] **6i:** ⋯ → TemplateMenuSheet. RTL.
Commit etter hvert delsteg.

---

## Task 7: Rute-sider rendrer WorkoutPage

**Files:** Modify `web/src/app/(tabs)/program/template/[templateId]/page.tsx` og `.../program/workout/[workoutId]/page.tsx`.

- [ ] **Step 1:** Mal-ruta: server-fetch `getTemplate` + `getExercises` (for exerciseNames) + `getTemplateFolders`, render `<WorkoutPage mode="planning" template={...} exerciseNames={...} folders={...} />`.
- [ ] **Step 2:** Workout-ruta: server-fetch `GET /workouts/{id}` + exercises/folders, render `<WorkoutPage mode="active" workout={...} ... />`.
- [ ] **Step 3:** `make check`. **Step 4:** Commit: `feat(web): rute-sider rendrer WorkoutPage`

---

## Task 8: TrainingLibrary → naviger til mal-ruta (fjern popup)

**Files:** Modify `web/src/components/training/library/TrainingLibrary.tsx` + test.

- [ ] **Step 1:** Oppdater test: klikk på mal-kort navigerer til `/program/template/[id]` (ikke åpner popup). Fjern popup-relaterte tester.
- [ ] **Step 2:** `onOpen={(id) => router.push('/program/template/'+id)}`; `NewTemplateSheet.onCreated` → naviger til mal-ruta. Fjern `<TemplateSheet>`-render + `openTemplateId`-state.
- [ ] **Step 3:** Verifiser test + `make check`. **Step 4:** Commit: `feat(web): mal-kort åpner mal=økt-siden (ingen popup)`

---

## Task 9: Slett TemplateSheet + gammel TemplateDetail; rydd opp

**Files:** Delete `web/src/components/training/detail/TemplateSheet.tsx` + `.test.tsx`, `web/src/components/training/detail/TemplateDetail.tsx` + `.test.tsx`. Søk etter gjenværende referanser.

- [ ] **Step 1:** `grep -rn "TemplateSheet\|TemplateDetail" web/src` — fjern alle importer/bruk (skal være ingen etter Task 7/8). `git rm` filene.
- [ ] **Step 2:** `make check` EXIT 0 (alle tester + build). Fiks evt. døde importer.
- [ ] **Step 3:** Commit: `chore(web): fjern TemplateSheet + gammel TemplateDetail (erstattet av WorkoutPage)`

---

## Avslutning
- [ ] Full `make check` EXIT 0.
- [ ] Orkestrator appliserer + verifiserer migrasjon 023 mot Supabase.
- [ ] Manuell røyktest: Trening → mal → planlegging-grid → rediger → «Start økt» → aktiv → logg ✓ (Forrige + hviletimer + PR) → bytt/legg til øvelse → Fullfør. Ingen popup, norske labels, ingen ukedager i økta.
- [ ] Push + PR; CI + Vercel-preview.

## Self-review-notater
- Spec-dekning: mal=økt to-tilstand (T6), Forrige (6d), hviletimer (6e), PR Epley (6f, T4), persistert logging UPSERT (T2,6d), legg til/bytt øvelse (6c,6g,T3), norske labels (6a), ⋯-innstillinger (6i), fjern popup (T8,T9). ✅
- Lazy-modell: ingen started_at-migrasjon; planlegging=template, aktiv=workout.
- 1RM: Epley live (ny `oneRepMax.ts`); historikk beholder Brzycki — dokumentert forskjell.
- Aktiv «legg til øvelse»: lokal state til første logging materialiserer settet (ingen ny tabell).
