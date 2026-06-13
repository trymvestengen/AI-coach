# Trening økt-mal-modell — Frontend (Plan B) Implementeringsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [x]`) syntax.

**Goal:** Bygg frontend for økt-mal-modellen i forge-stil (lyst default + mørk modus), mot det nye template-API-et — så appen fungerer igjen OG leverer den nye modellen + forge-designet.

**Architecture:** Forge-designet integreres i det EKSISTERENDE Tailwind v4-systemet (`globals.css` har allerede `@theme inline`, `:root`, og en `.dark`-klasse-variant). Vi legger til mørke forge-verdier som `.dark`-overrides av `--brand-*`-tokensene (i dag flipper `.dark` kun shadcn-tokens, ikke brand-tokensene skjermene bruker), pluss en tema-bryter som toggler `.dark` på `<html>` + persisterer i localStorage. `lib/api.ts` legges om fra program- til template-API. Skjermene (trening-tab, mal-detalj, workout-run, downstream) bygges mot mockup-referansen `design-variants/app-preview/` (forge.css + trening-strong.html).

**Tech Stack:** Next.js 16 (App Router), Tailwind v4, TypeScript, Vitest + React Testing Library. Backend-API er ferdig + deployet (template-modell på main + migrert i Supabase).

**Dekomponering (3 delplaner — bygg i rekkefølge):**

| Delplan | Innhold | Leverer |
|---|---|---|
| **B-1 ✅ FERDIG** | Forge dark-tokens + tema-bryter + `lib/api.ts` → template-API | Levert i commits `f8bedf7`, `1cbab68`, `32ace11`, `8d9c0a9` |
| **B-2 (DENNE, detaljert)** | Trening-tab (coach-forslag + quick-start + mappe-piller + mal-grid + aktiv-bar) + mal-detalj | Trening-flaten fungerer mot ny API i forge-stil |
| **B-3 (skissert)** | WorkoutRun (template_id) + downstream home/kalender/historikk | Hele appen fungerer + forge-stil gjennomgående |

Hver delplan passerer `make check` og etterlater appen i en kjørbar tilstand. **Detaljér B-2 og B-3 når B-1 er i havn** (de bygger på B-1s API-klient + tokens, og mockup-referansen er allerede laget).

**Referansefiler (les før implementering):**
- `design-variants/app-preview/forge.css` — komponent-/token-vokabular (lyst+mørk).
- `design-variants/app-preview/COMPONENTS.md` — klasseliste + skjelett.
- `design-variants/app-preview/trening-strong.html` — Trening-tab-mockup (begge moduser).
- `web/src/app/globals.css` — dagens token-system (`:root` linje 51, `.dark` linje 140).
- `docs/superpowers/specs/2026-06-13-trening-templates-design.md` — produktmodell.

**Backend-API-kontrakt (ferdig — frontend skal matche dette):**
- `GET /api/templates` → `[{id, name, folder_id, exercise_count}]`
- `GET /api/templates/{id}` → `{id, name, folder_id, exercises:[{id, exercise_id, position, sets:[{id,set_number,reps,weight_kg}]}]}`
- `POST /api/templates {name, folder_id?}` → `{id, name}` (201)
- `PATCH /api/templates/{id} {name?, folder_id?, position?}` → `{id, status}`
- `DELETE /api/templates/{id}` → `{status}`
- `POST /api/templates/from-workout {workout_id, name, folder_id?}` → `{id, name}` (201)
- `GET /api/template-folders` → `[{id, name, template_count}]`; POST/PATCH/DELETE tilsvarende.
- `GET /api/coach/next-workout` → `{template_id, name, reason}` (alle null hvis ingen maler)
- `POST /api/workouts {template_id?}` → `{workout_id, template_id}`
- `GET /api/exercises`, `GET /api/exercises/{id}`, `GET /api/exercises/{id}/progression` — uendret.

---

## Delplan B-1: Forge-tokens + tema-bryter + API-klient

### Fil-struktur (B-1)
| Fil | Ansvar | Status |
|---|---|---|
| `web/src/app/globals.css` | Mørke forge-verdier for `--brand-*`/`--bg-*`/`--fg-*`/`--ai-accent*` i `.dark` | Modify |
| `web/src/components/theme/ThemeToggle.tsx` | Sol/måne-knapp som toggler `.dark` + persisterer | Create |
| `web/src/components/theme/theme-init.ts` | Inline-script-streng som setter `.dark` før paint (no-flash) | Create |
| `web/src/app/layout.tsx` | Injiser theme-init-script i `<head>` | Modify |
| `web/src/lib/api.ts` | Template/folder/next-workout-funksjoner + typer; fjern program-funksjoner | Modify |
| Tester | `ThemeToggle.test.tsx`, `api` typer kompilerer | Create |

### Task 1: Mørke forge-tokens i globals.css

**Files:** Modify `web/src/app/globals.css` (`.dark`-blokken, ~linje 140).

**Kontekst:** I dag overstyrer `.dark` kun shadcn-tokensene (`--background` osv.), IKKE `--brand-*` som skjermene faktisk bruker. Legg til forge-grafitt-paletten som `.dark`-overrides av brand-tokensene + legacy-aliasene. Lyst tema (`:root`) er allerede brandets cream/oransje — ikke rør det.

- [x] **Step 1: Legg til forge dark-tokens i `.dark`-blokken** (etter de eksisterende shadcn-overridene, før blokken lukkes):

```css
  /* AI Coach forge dark-palett — overstyrer brand-tokensene i mørk modus */
  --brand-canvas: #15171a;
  --brand-surface: #1c1f24;
  --brand-subtle: #23272c;
  --brand-border: #2c3138;

  --brand-ink: #eef0ee;
  --brand-muted: #8b929b;
  --brand-faint: #5f656d;

  /* aksent beholdes brand-oransje i begge tema */
  --brand-orange: #f97316;
  --brand-orange-deep: #ea580c;
  --brand-orange-soft: #3a2a1c;

  --bg-0: var(--brand-canvas);
  --bg-1: var(--brand-surface);
  --bg-2: var(--brand-surface);
  --bg-3: var(--brand-subtle);
  --bg-4: var(--brand-border);

  --border-1: var(--brand-border);
  --border-2: var(--brand-border);
  --border-strong: rgba(255, 255, 255, 0.18);

  --fg-0: var(--brand-ink);
  --fg-1: #d6d9d6;
  --fg-2: var(--brand-muted);
  --fg-3: var(--brand-faint);

  --ai-accent: var(--brand-orange);
  --ai-accent-hot: #fb923c;
  --ai-accent-deep: var(--brand-orange-deep);
  --ai-accent-soft: var(--brand-orange-soft);
  --ai-accent-glow: rgba(249, 115, 22, 0.45);
```

- [x] **Step 2: Verifiser build** — `cd web && rm -rf .next && npm run build` → success (CSS kompilerer).
- [x] **Step 3: Manuell røyktest** — legg `class="dark"` på `<html>` i devtools på en skjerm; bekreft at flater blir grafitt og oransje består. Fjern igjen.
- [x] **Step 4: Commit** — `git add web/src/app/globals.css && git commit -m "feat(web): forge mørk-palett som .dark-overrides av brand-tokens"`

### Task 2: Tema-bryter + no-flash init

**Files:** Create `web/src/components/theme/ThemeToggle.tsx`, `web/src/components/theme/theme-init.ts`; Modify `web/src/app/layout.tsx`; Test `web/src/components/theme/ThemeToggle.test.tsx`.

- [x] **Step 1: Skriv testen** (`ThemeToggle.test.tsx`):
```tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import ThemeToggle from "./ThemeToggle"

afterEach(() => {
  document.documentElement.classList.remove("dark")
  localStorage.clear()
})

test("toggler .dark på html og persisterer", () => {
  render(<ThemeToggle />)
  const btn = screen.getByRole("button", { name: /tema/i })
  expect(document.documentElement.classList.contains("dark")).toBe(false)
  fireEvent.click(btn)
  expect(document.documentElement.classList.contains("dark")).toBe(true)
  expect(localStorage.getItem("forge-theme")).toBe("dark")
  fireEvent.click(btn)
  expect(document.documentElement.classList.contains("dark")).toBe(false)
  expect(localStorage.getItem("forge-theme")).toBe("light")
})
```

- [x] **Step 2: Kjør, forvent FAIL** — `cd web && npm run test -- ThemeToggle` (komponent mangler).

- [x] **Step 3: Skriv `ThemeToggle.tsx`:**
```tsx
"use client"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"))
  }, [])
  function toggle() {
    const next = !document.documentElement.classList.contains("dark")
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("forge-theme", next ? "dark" : "light")
    setDark(next)
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Bytt tema"
      aria-pressed={dark}
      style={{
        width: 36, height: 36, borderRadius: 999, cursor: "pointer",
        background: "var(--brand-surface)", border: "1px solid var(--brand-border)",
        color: "var(--brand-ink)", display: "grid", placeItems: "center", fontSize: 16,
      }}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  )
}
```

- [x] **Step 4: Skriv `theme-init.ts`** (eksporterer script-strengen som settes før paint):
```ts
export const themeInitScript = `(function(){try{var t=localStorage.getItem('forge-theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})()`
```

- [x] **Step 5: Injiser i `layout.tsx`** — i `<head>` (eller øverst i `<body>`), legg:
```tsx
import { themeInitScript } from "@/components/theme/theme-init"
// ...inni <html>:
<head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
```
(Hvis layout allerede har `<head>`/script-mønster, følg det.)

- [x] **Step 6: Kjør testen → PASS.** `cd web && npm run test -- ThemeToggle`.
- [x] **Step 7: Commit** — `git add web/src/components/theme web/src/app/layout.tsx && git commit -m "feat(web): tema-bryter (.dark) med localStorage-persistens + no-flash init"`

### Task 3: `lib/api.ts` → template-API

**Files:** Modify `web/src/lib/api.ts`. Test: typecheck (`npm run typecheck`).

**Kontekst:** Fjern program-funksjonene (`getPrograms`, `getProgram`, `getActiveProgram`, `addExerciseToDay`, `addSet`/`updateSet`/`deleteSet` mot program, `deleteProgram`, `ProgramDay`/`Program`-typer) og `startWorkout(program_day_id)`. Legg til template-funksjoner mot kontrakten øverst. Behold `getExercises`/`getExerciseDetail`/exercise-typer (uendret API).

- [x] **Step 1: Legg til typer:**
```ts
export type TemplateSetPlan = { id: string; set_number: number; reps: number | null; weight_kg: number | null }
export type TemplateExercise = { id: string; exercise_id: string; position: number; sets: TemplateSetPlan[] }
export type Template = { id: string; name: string; folder_id: string | null; exercise_count?: number }
export type TemplateDetail = { id: string; name: string; folder_id: string | null; exercises: TemplateExercise[] }
export type TemplateFolder = { id: string; name: string; template_count: number }
export type NextWorkout = { template_id: string | null; name: string | null; reason: string | null }
```

- [x] **Step 2: Legg til funksjoner** (bruk eksisterende `authedFetch`/header-mønster i fila — sjekk hvordan `getWorkouts` henter token):
```ts
export async function getTemplates(): Promise<Template[]> {
  const res = await fetch(`${API_BASE}/api/templates`, { headers: await authHeaders(), cache: "no-store" })
  if (!res.ok) throw new Error(`getTemplates: ${res.status}`)
  return res.json()
}
export async function getTemplate(id: string): Promise<TemplateDetail> {
  const res = await fetch(`${API_BASE}/api/templates/${id}`, { headers: await authHeaders(), cache: "no-store" })
  if (!res.ok) throw new Error(`getTemplate: ${res.status}`)
  return res.json()
}
export async function createTemplate(name: string, folderId?: string | null): Promise<{ id: string; name: string }> {
  const res = await fetch(`${API_BASE}/api/templates`, {
    method: "POST", headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ name, folder_id: folderId ?? null }),
  })
  if (!res.ok) throw new Error(`createTemplate: ${res.status}`)
  return res.json()
}
export async function getFolders(): Promise<TemplateFolder[]> {
  const res = await fetch(`${API_BASE}/api/template-folders`, { headers: await authHeaders(), cache: "no-store" })
  if (!res.ok) throw new Error(`getFolders: ${res.status}`)
  return res.json()
}
export async function getNextWorkout(): Promise<NextWorkout> {
  const res = await fetch(`${API_BASE}/api/coach/next-workout`, { headers: await authHeaders(), cache: "no-store" })
  if (!res.ok) throw new Error(`getNextWorkout: ${res.status}`)
  return res.json()
}
export async function startWorkout(templateId?: string | null): Promise<{ workout_id: string; template_id: string | null }> {
  const res = await fetch(`${API_BASE}/api/workouts`, {
    method: "POST", headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ template_id: templateId ?? null }),
  })
  if (!res.ok) throw new Error(`startWorkout: ${res.status}`)
  return res.json()
}
```
> **Note:** bruk det faktiske auth-header-mønsteret i fila (les hvordan `getWorkouts`/`startWorkout` henter Supabase-token i dag — gjenbruk det, ikke finn opp `authHeaders` hvis et annet mønster finnes; tilpass koden over til eksisterende stil).

- [x] **Step 3: Fjern program-funksjonene + program-typene** (`getPrograms`, `getProgram`, `getActiveProgram`, `addExerciseToDay`, program-`addSet`/`updateSet`/`deleteSet`, `deleteExercise` mot program, `deleteProgram`, `ProgramDay`, `Program`, `ProgramExercise`, `ProgramExerciseSet`, `WorkoutTemplate`, `DaySchedule`). La midlertidig stå de som fortsatt importeres av ikke-migrerte skjermer hvis det trengs for at typecheck skal passere — men målet er å fjerne dem. Alternativt: behold dem som `@deprecated` til B-2/B-3 fjerner kallsteder, for å holde typecheck grønn underveis.

- [x] **Step 4: Typecheck** — `cd web && npm run typecheck`. Forventet: feil i skjermer som fortsatt importerer fjernede program-funksjoner. **Beslutning:** for B-1 holder vi typecheck grønn ved å beholde program-funksjonene som deprecated stubs (kaster `Error("fjernet — bruk template-API")` ved kall) til B-2/B-3 migrerer kallstedene. Da kompilerer alt, og runtime-feil bare i ikke-migrerte skjermer (som uansett er under ombygging).
- [x] **Step 5: Commit** — `git add web/src/lib/api.ts && git commit -m "feat(web): api-klient for template-modell (+ deprecated program-stubs)"`

### B-1 verifisering
`cd web && npm run typecheck && npm run test` → grønt. Tema-bryter virker (manuelt), api-klient eksporterer template-funksjoner.

---

## Delplan B-2: Trening-tab + mal-detalj (DETALJERT)

**Mål:** Trening-tab + mal-detalj fungerer mot template-API i forge-stil. Trening-tabben er i dag tom/brutt fordi backend fjernet `/api/programs` (commits `2fbe219`/`8c79167`) — `program/page.tsx` får 404 → tom liste. B-2 gjør flaten levende igjen mot template-API-et.

**Designreferanse:** `design-variants/app-preview/trening-strong.html` (begge moduser). Topbar «Start økt», (valgfritt) coach-forslags-hero, «Start tom økt», mappe-piller, mal-grid (2 kolonner), minimert aktiv-økt-bar over nav.

### API-virkelighet som styrer scope (lest fra kontrakten + `api.ts`)
- `GET /api/templates` → `{id, name, folder_id, exercise_count}` — **ingen øvelsesnavn** i lista. ⇒ `TemplateCard` viser navn + «N øvelser», ikke navne-preview (avvik fra mockupens «Benkpress, …»; bevisst, API-drevet).
- `GET /api/templates/{id}` → `exercises:[{exercise_id, position, sets}]` — **ingen øvelsesnavn**. ⇒ `TemplateDetail` henter `getExercises()` én gang og bygger `exercise_id → name`-map.
- Kontrakten har **ingen** endepunkt for å redigere øvelser/sett *inne i* en mal (maler bygges via «lagre fra økt»). ⇒ `TemplateDetail` = **vis** (øvelser + sett) + gi nytt navn + flytt til mappe + slett + «Start denne økta». Ingen sett-editor i B-2.
- «Start»-handlinger kaller `startWorkoutFromTemplate()` og navigerer til `/program/workout/{workout_id}`. **Selve workout-run-ruta er B-3.** I B-2 testes Start = (kaller API + navigerer), ikke kjøreskjermen. Dette er den bevisste B-2/B-3-grensa.

### Fil-struktur (B-2)
| Fil | Ansvar | Status |
|---|---|---|
| `web/src/lib/api.ts` | Legg til `createTemplateFolder`, `updateTemplate`, `deleteTemplate` | Modify |
| `web/src/components/training/library/TemplateCard.tsx` (+ test) | Mal-kort: navn + «N øvelser» + ⋯-meny-knapp; tap → detalj | Create |
| `web/src/components/training/library/FolderPillBar.tsx` (+ test) | Mappe-piller mot `TemplateFolder` (navn + `template_count`) | Create |
| `web/src/components/training/library/CoachSuggestionCard.tsx` (+ test) | Hero «Coachen foreslår» fra `NextWorkout`; «Start økt» + «Bytt» | Create |
| `web/src/components/training/library/NewTemplateSheet.tsx` | Bunnark: navn (+ valgfri mappe) → `createTemplate` → detalj | Create |
| `web/src/components/training/library/NewFolderSheet.tsx` | Bunnark: navn → `createTemplateFolder` → refresh | Create |
| `web/src/components/training/library/ActiveWorkoutBar.tsx` | Minimert aktiv-økt-bar (fra `getInProgressWorkout`) | Create |
| `web/src/components/training/library/TrainingLibrary.tsx` (+ test) | Sammenstilling (client): hero + quick-start + piller + grid + aktiv-bar + sheets | Create |
| `web/src/app/(tabs)/program/page.tsx` | Server-henting (`templates`, `template-folders`, `next-workout`, `in-progress`) → `TrainingLibrary` | Rewrite |
| `web/src/components/training/detail/TemplateMenuSheet.tsx` | Bunnark: gi nytt navn / flytt / slett mal | Create |
| `web/src/components/training/detail/TemplateDetail.tsx` (+ test) | Vis øvelser + sett (navn via exercise-map), Start, ⋯-meny | Create |
| `web/src/app/(tabs)/program/template/[templateId]/page.tsx` | Server-henting `getTemplate(id)` + `getExercises` + folders → `TemplateDetail` | Create |

**Opprydding (slutt av B-2):** gammel `program/library/*`-flate er ikke lenger lenket fra noen rute. Vi **lar den stå** til B-3 (som rydder `program/`-mappa + `[programId]`-ruta + program-funksjoner i `api.ts` samlet), for å holde diffen per delplan fokusert og typecheck grønn. Eneste unntak: `program/page.tsx` skrives om nå (det ER Trening-tabben).

### Task 1: API-helpers (`createTemplateFolder`, `updateTemplate`, `deleteTemplate`)
**Files:** Modify `web/src/lib/api.ts`. Verifisering: `npm run typecheck`.
- [x] **Step 1:** Legg til, i `/* ── Templates ── */`-blokken, med samme `getAuthHeaders`-mønster:
```ts
export async function createTemplateFolder(name: string): Promise<TemplateFolder> { /* POST /api/template-folders */ }
export async function updateTemplate(id: string, body: { name?: string; folder_id?: string | null }): Promise<{ id: string; status: string }> { /* PATCH /api/templates/{id} */ }
export async function deleteTemplate(id: string): Promise<void> { /* DELETE /api/templates/{id} */ }
```
- [x] **Step 2:** `cd web && npm run typecheck` → grønt. **Commit.**

### Task 2: `TemplateCard` (TDD)
**Files:** Create `web/src/components/training/library/TemplateCard.{tsx,test.tsx}`.
- [x] **Step 1 (RED):** test — gjengir navn + «3 øvelser» (fra `exercise_count`); klikk på kortet kaller `onOpen(id)`; klikk på ⋯-knappen kaller `onMenu(id)` og bobler IKKE til `onOpen`. Kjør → FAIL.
- [x] **Step 2 (GREEN):** komponent: `panel`-stil (`var(--brand-surface)`/`--brand-border`, radius 14, min-høyde ~124, 2-kol-vennlig). Props `{ template: Pick<Template,"id"|"name"|"exercise_count">, onOpen, onMenu }`. Tall i mono. Kjør → PASS.
- [x] **Step 3:** `make check`-delsteg (`typecheck` + `test`). **Commit.**

### Task 3: `FolderPillBar` (training-variant, TDD)
**Files:** Create `web/src/components/training/library/FolderPillBar.{tsx,test.tsx}`.
- [x] **Step 1 (RED):** test — «Alle (N)» aktiv som standard; klikk en mappe-pille kaller `onSelect(id)`; klikk «+ Mappe» kaller `onAddFolder`; long-press/contextmenu på pille kaller `onFolderLongPress(folder)`. Kjør → FAIL.
- [x] **Step 2 (GREEN):** adaptér mønsteret fra `program/library/FolderPillBar.tsx` men mot `TemplateFolder` (`template_count`). Kjør → PASS.
- [x] **Step 3:** delsteg-check. **Commit.**

### Task 4: `CoachSuggestionCard` (TDD)
**Files:** Create `web/src/components/training/library/CoachSuggestionCard.{tsx,test.tsx}`.
- [x] **Step 1 (RED):** test — gitt `{template_id, name:"Pull A", reason:"basert på økta i går"}`: viser «Coachen foreslår», navn, reason; «Start økt» kaller `onStart(template_id)`; «Bytt» kaller `onSwap`. Kjør → FAIL.
- [x] **Step 2 (GREEN):** `hero`-stil (oransje), eyebrow/tittel/sub + primær-knapp + «Bytt»-lenke. Rendres kun av forelder når `template_id != null`. Kjør → PASS.
- [x] **Step 3:** delsteg-check. **Commit.**

### Task 5: Sheets (`NewTemplateSheet`, `NewFolderSheet`, `ActiveWorkoutBar`)
**Files:** Create de tre filene. (Bunnark-mønster kopieres fra `program/library/NewFolderSheet.tsx`.)
- [x] **Step 1 (RED):** `NewTemplateSheet`-test — skriv navn + submit kaller `createTemplate` og `onCreated`/navigerer (mock `@/lib/api`). `NewFolderSheet`-test — submit kaller `createTemplateFolder` + `onCreated`. Kjør → FAIL.
- [x] **Step 2 (GREEN):** implementér begge ark + `ActiveWorkoutBar` (presentasjons-bar: `{ workoutId, label, onContinue }`, `accent-soft`-stil; enkel render-test). Kjør → PASS.
- [x] **Step 3:** delsteg-check. **Commit.**

### Task 6: `TrainingLibrary` + server-page (TDD)
**Files:** Create `web/src/components/training/library/TrainingLibrary.{tsx,test.tsx}`; Rewrite `web/src/app/(tabs)/program/page.tsx`.
- [x] **Step 1 (RED):** test — gitt props `{templates, folders, nextWorkout, inProgress}`:
  - viser «Start tom økt»; klikk → `startWorkoutFromTemplate(undefined)` + push (mock api + `useRouter`).
  - `nextWorkout.template_id` satt ⇒ `CoachSuggestionCard` synlig; null ⇒ skjult.
  - velg mappe-pille ⇒ grid filtreres på `folder_id`.
  - `inProgress` satt ⇒ `ActiveWorkoutBar` synlig.
  Kjør → FAIL.
- [x] **Step 2 (GREEN):** sett sammen komponentene + lokal `selectedFolderId`-state + sheet-state; «Start»-handlinger kaller `startWorkoutFromTemplate` → `router.push('/program/workout/'+id)`. Kjør → PASS.
- [x] **Step 3:** skriv om `program/page.tsx` (server): hent `templates`, `template-folders`, `next-workout`, `in-progress` parallelt via `safeFetch`-mønsteret → `TrainingLibrary`. `npm run build` + `make check`. **Commit.**

### Task 7: `TemplateDetail` + rute (TDD)
**Files:** Create `web/src/components/training/detail/TemplateDetail.{tsx,test.tsx}`, `TemplateMenuSheet.tsx`, `web/src/app/(tabs)/program/template/[templateId]/page.tsx`.
- [x] **Step 1 (RED):** test — gitt `templateDetail` + `exerciseNames`-map: viser malnavn, hver øvelses navn + sett-spec («3 × 8 @ 60 kg»); «Start denne økta» kaller `onStart(template.id)`; ⋯ åpner meny. Kjør → FAIL.
- [x] **Step 2 (GREEN):** komponent (`panel-list`/`exercise-row`-stil), `TemplateMenuSheet` (gi nytt navn via `updateTemplate`, flytt til mappe via `updateTemplate{folder_id}`, slett via `deleteTemplate` → tilbake til `/program`). Kjør → PASS.
- [x] **Step 3:** rute-side (server): `getTemplate(id)` (404 → `notFound()`) + `getExercises()` → bygg navne-map → `TemplateDetail`. `make check`. **Commit.**

### B-2 verifisering
`cd web && npm run typecheck && npm run test && npm run build` → grønt. Manuell røyktest på localhost (lyst+mørk): Trening-tab viser maler/mapper, coach-forslag når det finnes, mappe-filter virker, mal-detalj åpnes og viser øvelser, ny mal/mappe-ark virker. (Selve «Start»-kjøringen fullføres i B-3.)

## Delplan B-3: WorkoutRun-rute + downstream (DETALJERT)

**Mål:** Hele appen fungerer mot template-modellen. «Start» fullfører hele loopen start → kjør → fullfør, og Hjem/Kalender slutter å peke på døde program-ruter.

**Funn fra utforskning (styrer scope):**
- `GET /api/workouts/{id}` og `/in-progress` er **allerede template-baserte** (joiner `workout_templates`/`template_exercises`). `WorkoutRun` rendrer derfor template-øvelser uten endring — den mangler bare en **rute**.
- `WorkoutRun` logger sett via `exercise_id` + `set_number` (workout-agnostisk) → fungerer frittstående. `folders`-propen brukes ikke i kroppen.
- Ingen backend-endepunkt for å legge til ad-hoc-øvelser midt i en økt → «+ Legg til øvelse» utelates i B-3 (krever backend; egen task senere).
- `Kalender` henter `/api/programs/active` (nå 404) — template-modellen har ingen ukeplan. Kalenderen blir en **fullførte-økter-per-uke**-visning.
- `Historikk` fungerer (`day_name` fra template-join); `program_name` blir null.

### Sub-tasks (bygg i rekkefølge, commit + `make check`-delsteg hver):

**B-3.1 — Workout-run-rute (KEYSTONE, gjør «Start» ekte)**
- [x] Create `web/src/app/(tabs)/program/workout/[workoutId]/page.tsx` (server): auth-gate → `getWorkout(id)` (404 → `notFound()`) → render `<WorkoutRun workout={...} folders={[]} />`.
- [x] Gjør `folders` valgfri i `WorkoutRun` (default `[]`) så ruta slipper program-kobling.
- [x] Verifiser i browser: `/program` → «Start tom økt» / coach-forslag «Start» → lander på kjøreskjermen; logg et sett; «Fullfør» → sammendrag → `/historikk/{id}`.

**B-3.2 — Lagre fullført økt som mal**
- [ ] `api.ts`: `createTemplateFromWorkout({ workout_id, name, folder_id? })` (POST `/api/templates/from-workout`).
- [ ] I `WorkoutRun` sin «done»-skjerm: knapp «Lagre som mal» → enkelt navn-ark → kall + toast/redirect. (TDD på et lite `SaveAsTemplateSheet`.)

**B-3.3 — Hjem mot template-modellen**
- [ ] `home/page.tsx`: bytt `/api/programs/active`-avledning med `getNextWorkout()` + `getInProgressWorkout()`.
- [ ] `HomeScreen.tsx`: hero «neste økt» fra next-workout (knapp → `startWorkoutFromTemplate` → kjørerute); in-progress-banner → `/program/workout/{id}` (ikke `/program/{program_id}`); fjern/skjul `MOCK_FRIENDS`/`MOCK_SUGGESTIONS` (skjules til sosialt er ekte).

**B-3.4 — Kalender mot template-modellen**
- [ ] `kalender/page.tsx`: dropp aktivt-program/ukeplan; vis fullførte økter per dag denne uka (fra `/api/workouts`), behold forge-stil.

**B-3.5 — Global tema-bryter**
- [ ] Flytt `ThemeToggle` til en delt plassering (fast topp-høyre i `(tabs)/layout.tsx`) så mørk modus er tilgjengelig på alle faner; fjern den tab-lokale i `TrainingLibrary` for å unngå duplikat. (Verifiser ingen overlapp på home/profile.)

**B-3.6 — Opprydding av gammel program-flate**
- [ ] Slett `web/src/components/program/library/*` og `program/detail/ProgramDetail.tsx` m.fl. som ikke lenger lenkes; flytt `WorkoutRun` + `ExercisePickerSheet` til `components/training/`.
- [ ] Slett `[programId]`-ruta + `program/new` hvis ubrukt.
- [ ] `api.ts`: fjern program-funksjonene (`getPrograms`, `getProgram`, `getActiveProgram`, program-`addSet`/`updateSet`/`deleteSet`, `patchProgram`, `ProgramDay`/`Program`-typer osv.) når alle kallsteder er borte.
- [ ] Full `make check` + manuell røyktest (lyst+mørk).

---

## Self-review (B-1)
- **Spec-dekning:** forge lyst+mørk (Task 1-2), tema-persistens (Task 2), template-API-klient (Task 3). Skjermene er B-2/B-3 (skissert, detaljeres ved oppstart per skillens dekomponerings-råd). ✓
- **Navnekonsistens:** `Template`/`TemplateDetail`/`TemplateFolder`/`NextWorkout`-typer + `getTemplates`/`getTemplate`/`createTemplate`/`getFolders`/`getNextWorkout`/`startWorkout(templateId)` brukt likt; matcher backend-kontrakten øverst. ✓
- **Åpne avhengigheter:** Task 3 forutsetter at det faktiske auth-header-mønsteret i `api.ts` gjenbrukes (flagget i note). Deprecated-stub-strategien holder typecheck grønn til B-2/B-3 migrerer kallstedene.
- **Placeholder-skann:** ingen TBD/TODO uten konkret innhold; deprecated-stubs er en bevisst, beskrevet strategi, ikke en placeholder.
