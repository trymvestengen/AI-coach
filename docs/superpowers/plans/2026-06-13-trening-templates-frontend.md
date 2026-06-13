# Trening økt-mal-modell — Frontend (Plan B) Implementeringsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Bygg frontend for økt-mal-modellen i forge-stil (lyst default + mørk modus), mot det nye template-API-et — så appen fungerer igjen OG leverer den nye modellen + forge-designet.

**Architecture:** Forge-designet integreres i det EKSISTERENDE Tailwind v4-systemet (`globals.css` har allerede `@theme inline`, `:root`, og en `.dark`-klasse-variant). Vi legger til mørke forge-verdier som `.dark`-overrides av `--brand-*`-tokensene (i dag flipper `.dark` kun shadcn-tokens, ikke brand-tokensene skjermene bruker), pluss en tema-bryter som toggler `.dark` på `<html>` + persisterer i localStorage. `lib/api.ts` legges om fra program- til template-API. Skjermene (trening-tab, mal-detalj, workout-run, downstream) bygges mot mockup-referansen `design-variants/app-preview/` (forge.css + trening-strong.html).

**Tech Stack:** Next.js 16 (App Router), Tailwind v4, TypeScript, Vitest + React Testing Library. Backend-API er ferdig + deployet (template-modell på main + migrert i Supabase).

**Dekomponering (3 delplaner — bygg i rekkefølge):**

| Delplan | Innhold | Leverer |
|---|---|---|
| **B-1 (DENNE, detaljert)** | Forge dark-tokens + tema-bryter + `lib/api.ts` → template-API | Tema-infrastruktur + API-klient klar; ingen brutte typer |
| **B-2 (skissert)** | Trening-tab (coach-forslag + quick-start + mappe-piller + mal-grid + aktiv-bar) + mal-detalj/rediger | Trening-flaten fungerer mot ny API i forge-stil |
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

- [ ] **Step 1: Legg til forge dark-tokens i `.dark`-blokken** (etter de eksisterende shadcn-overridene, før blokken lukkes):

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

- [ ] **Step 2: Verifiser build** — `cd web && rm -rf .next && npm run build` → success (CSS kompilerer).
- [ ] **Step 3: Manuell røyktest** — legg `class="dark"` på `<html>` i devtools på en skjerm; bekreft at flater blir grafitt og oransje består. Fjern igjen.
- [ ] **Step 4: Commit** — `git add web/src/app/globals.css && git commit -m "feat(web): forge mørk-palett som .dark-overrides av brand-tokens"`

### Task 2: Tema-bryter + no-flash init

**Files:** Create `web/src/components/theme/ThemeToggle.tsx`, `web/src/components/theme/theme-init.ts`; Modify `web/src/app/layout.tsx`; Test `web/src/components/theme/ThemeToggle.test.tsx`.

- [ ] **Step 1: Skriv testen** (`ThemeToggle.test.tsx`):
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

- [ ] **Step 2: Kjør, forvent FAIL** — `cd web && npm run test -- ThemeToggle` (komponent mangler).

- [ ] **Step 3: Skriv `ThemeToggle.tsx`:**
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

- [ ] **Step 4: Skriv `theme-init.ts`** (eksporterer script-strengen som settes før paint):
```ts
export const themeInitScript = `(function(){try{var t=localStorage.getItem('forge-theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})()`
```

- [ ] **Step 5: Injiser i `layout.tsx`** — i `<head>` (eller øverst i `<body>`), legg:
```tsx
import { themeInitScript } from "@/components/theme/theme-init"
// ...inni <html>:
<head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
```
(Hvis layout allerede har `<head>`/script-mønster, følg det.)

- [ ] **Step 6: Kjør testen → PASS.** `cd web && npm run test -- ThemeToggle`.
- [ ] **Step 7: Commit** — `git add web/src/components/theme web/src/app/layout.tsx && git commit -m "feat(web): tema-bryter (.dark) med localStorage-persistens + no-flash init"`

### Task 3: `lib/api.ts` → template-API

**Files:** Modify `web/src/lib/api.ts`. Test: typecheck (`npm run typecheck`).

**Kontekst:** Fjern program-funksjonene (`getPrograms`, `getProgram`, `getActiveProgram`, `addExerciseToDay`, `addSet`/`updateSet`/`deleteSet` mot program, `deleteProgram`, `ProgramDay`/`Program`-typer) og `startWorkout(program_day_id)`. Legg til template-funksjoner mot kontrakten øverst. Behold `getExercises`/`getExerciseDetail`/exercise-typer (uendret API).

- [ ] **Step 1: Legg til typer:**
```ts
export type TemplateSetPlan = { id: string; set_number: number; reps: number | null; weight_kg: number | null }
export type TemplateExercise = { id: string; exercise_id: string; position: number; sets: TemplateSetPlan[] }
export type Template = { id: string; name: string; folder_id: string | null; exercise_count?: number }
export type TemplateDetail = { id: string; name: string; folder_id: string | null; exercises: TemplateExercise[] }
export type TemplateFolder = { id: string; name: string; template_count: number }
export type NextWorkout = { template_id: string | null; name: string | null; reason: string | null }
```

- [ ] **Step 2: Legg til funksjoner** (bruk eksisterende `authedFetch`/header-mønster i fila — sjekk hvordan `getWorkouts` henter token):
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

- [ ] **Step 3: Fjern program-funksjonene + program-typene** (`getPrograms`, `getProgram`, `getActiveProgram`, `addExerciseToDay`, program-`addSet`/`updateSet`/`deleteSet`, `deleteExercise` mot program, `deleteProgram`, `ProgramDay`, `Program`, `ProgramExercise`, `ProgramExerciseSet`, `WorkoutTemplate`, `DaySchedule`). La midlertidig stå de som fortsatt importeres av ikke-migrerte skjermer hvis det trengs for at typecheck skal passere — men målet er å fjerne dem. Alternativt: behold dem som `@deprecated` til B-2/B-3 fjerner kallsteder, for å holde typecheck grønn underveis.

- [ ] **Step 4: Typecheck** — `cd web && npm run typecheck`. Forventet: feil i skjermer som fortsatt importerer fjernede program-funksjoner. **Beslutning:** for B-1 holder vi typecheck grønn ved å beholde program-funksjonene som deprecated stubs (kaster `Error("fjernet — bruk template-API")` ved kall) til B-2/B-3 migrerer kallstedene. Da kompilerer alt, og runtime-feil bare i ikke-migrerte skjermer (som uansett er under ombygging).
- [ ] **Step 5: Commit** — `git add web/src/lib/api.ts && git commit -m "feat(web): api-klient for template-modell (+ deprecated program-stubs)"`

### B-1 verifisering
`cd web && npm run typecheck && npm run test` → grønt. Tema-bryter virker (manuelt), api-klient eksporterer template-funksjoner.

---

## Delplan B-2 (skisse — detaljeres ved oppstart)

**Mål:** Trening-tab + mal-detalj fungerer mot template-API i forge-stil.

**Filer (erstatter `web/src/components/program/`-flaten):**
- `web/src/app/(tabs)/program/page.tsx` — server-henting (`getTemplates`, `getFolders`, `getNextWorkout`) → `TrainingLibrary`.
- `web/src/components/training/library/TrainingLibrary.tsx` — coach-forslag-kort + quick-start + mappe-piller + mal-grid + minimert aktiv-bar (mockup: `trening-strong.html`).
- `web/src/components/training/library/{CoachSuggestionCard,TemplateCard,FolderPillBar,NewTemplateSheet,NewFolderSheet}.tsx`.
- `web/src/app/(tabs)/program/[programId]/page.tsx` → omdøp/erstatt med mal-detalj-rute som henter `getTemplate(id)`.
- `web/src/components/training/detail/TemplateDetail.tsx` — øvelsesliste + sett, rediger, «Start denne økta».
- Co-located vitest-tester per komponent (forny `ProgramCard.test`/`FolderPillBar.test` → template-varianter).
- Slett gamle `program/library/*`, `program/detail/ProgramDetail.tsx` m.fl. som er erstattet.

**Tasks (grovt):** (1) api-helpers ferdig fra B-1; (2) TemplateCard + test; (3) FolderPillBar (gjenbruk eksisterende, bytt data); (4) CoachSuggestionCard + test; (5) TrainingLibrary sammenstilling + server-page; (6) TemplateDetail + rediger; (7) sheets (ny mal/mappe, lagre-som-mal); (8) slett gammel program-flate; `make check`.

## Delplan B-3 (skisse — detaljeres ved oppstart)

**Mål:** WorkoutRun + downstream fungerer mot template; forge-stil gjennomgående.

**Filer:**
- `web/src/components/program/workout/WorkoutRun.tsx` → `template_id` i stedet for program_day; «+ Legg til øvelse» via `ExercisePickerSheet`; «Fullfør» → `SaveAsTemplateSheet` (POST `/api/templates/from-workout`).
- `web/src/app/(tabs)/home/page.tsx` + `components/home/HomeScreen.tsx` — hero/«neste økt» fra `getNextWorkout()`; fjern `MOCK_FRIENDS`/`MOCK_SUGGESTIONS` (M3-beslutning) eller skjul til sosialt er klart.
- `web/src/app/(tabs)/kalender/page.tsx`, `historikk/page.tsx` — referanser `program_day_id`→`template_id` / mal-navn.
- `web/src/lib/api.ts` — fjern de deprecated program-stubs når alle kallsteder er migrert.

**Tasks (grovt):** (1) WorkoutRun template-mode + test; (2) ExercisePicker/SaveAsTemplate sheets; (3) HomeScreen next-workout + mock-data-beslutning; (4) kalender/historikk re-pek; (5) fjern deprecated stubs; (6) full `make check` + manuell røyktest på localhost (lyst+mørk).

---

## Self-review (B-1)
- **Spec-dekning:** forge lyst+mørk (Task 1-2), tema-persistens (Task 2), template-API-klient (Task 3). Skjermene er B-2/B-3 (skissert, detaljeres ved oppstart per skillens dekomponerings-råd). ✓
- **Navnekonsistens:** `Template`/`TemplateDetail`/`TemplateFolder`/`NextWorkout`-typer + `getTemplates`/`getTemplate`/`createTemplate`/`getFolders`/`getNextWorkout`/`startWorkout(templateId)` brukt likt; matcher backend-kontrakten øverst. ✓
- **Åpne avhengigheter:** Task 3 forutsetter at det faktiske auth-header-mønsteret i `api.ts` gjenbrukes (flagget i note). Deprecated-stub-strategien holder typecheck grønn til B-2/B-3 migrerer kallstedene.
- **Placeholder-skann:** ingen TBD/TODO uten konkret innhold; deprecated-stubs er en bevisst, beskrevet strategi, ikke en placeholder.
