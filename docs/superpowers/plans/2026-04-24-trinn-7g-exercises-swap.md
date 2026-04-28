# Trinn 7G: Exercise Database + Swap Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Erstatt de 25 hardkodede øvelsene med hele wger.de-databasen (~2000 øvelser) via et fetch-script, og implementer Swap-knapp i ProgramScreen som åpner ExerciseLibrary i valgmodus slik at brukeren kan bytte ut en øvelse.

**Architecture:** To uavhengige deler: (1) et Node.js-script som henter øvelser fra wger.de REST API og skriver en ny `exercises.ts` med alle feltene vi trenger; (2) swap-flyten bruker `sessionStorage` som mellomlagring — Swap-knappen navigerer til `/exercises?swap=<slotIndex>`, ExerciseLibrary oppdager swap-parameteren og viser valgmodus, og etter valg lagres resultatet i sessionStorage og vi navigerer tilbake til Program. ProgramScreen leser sessionStorage på mount og oppdaterer øvelseslisten.

**Tech Stack:** Node.js fetch (≥18), tsx for å kjøre TypeScript-scriptet, wger.de REST API v2, Next.js 15 App Router, TypeScript, sessionStorage.

---

## File Map

**Created:**
- `scripts/fetch-exercises.ts` — engangsscript som henter fra wger.de og skriver ny exercises.ts

**Modified:**
- `web/src/lib/exercises.ts` — erstattes av script-output (beholder types + functions, erstatter EXERCISES-array)
- `web/src/app/(tabs)/exercises/page.tsx` — lese `swap` searchParam (Next.js 15 async), sende til ExerciseLibrary
- `web/src/components/exercises/ExerciseLibrary.tsx` — ny `swapSlot` prop, swap-modus UI
- `web/src/components/program/ProgramScreen.tsx` — `onSwap` prop til ExerciseRow, useEffect for sessionStorage-swap

---

### Task 1: Fetch-script for wger.de

**Files:**
- Create: `scripts/fetch-exercises.ts`

- [ ] **Step 1: Opprett scripts/-mappen og scriptet**

Lag `/Users/trymvestengen/Desktop/ai-coach/scripts/fetch-exercises.ts` med dette innholdet:

```typescript
#!/usr/bin/env npx tsx
/**
 * Engangsscript — henter øvelser fra wger.de og genererer web/src/lib/exercises.ts
 * Kjør: npx tsx scripts/fetch-exercises.ts
 */
import { writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "https://wger.de/api/v2"

// wger muscle ID → vår MuscleKey
const MUSCLE_KEY: Record<number, string> = {
  1:  "biceps",    // Biceps brachii
  2:  "shoulders", // Anterior deltoid
  3:  "chest",     // Serratus anterior
  4:  "chest",     // Pectoralis major
  5:  "hamstrings",// Biceps femoris
  6:  "calves",    // Gastrocnemius
  7:  "glutes",    // Gluteus maximus
  8:  "upperBack", // Trapezius
  9:  "quads",     // Quadriceps femoris
  10: "abs",       // Rectus abdominis
  11: "biceps",    // Brachialis
  12: "triceps",   // Triceps brachii
  13: "shoulders", // Posterior deltoid
  14: "calves",    // Soleus
  15: "lats",      // Latissimus dorsi
  16: "lowerBack", // Erector spinae
  17: "forearms",  // Brachioradialis
}

// wger equipment ID → displaynavn
const EQUIP: Record<number, string> = {
  1:  "Barbell",
  2:  "Barbell",    // SZ-Bar
  3:  "Dumbbell",
  4:  "Bodyweight", // Gym mat
  5:  "Machine",    // Swiss ball
  6:  "Bodyweight", // Pull-up bar
  7:  "Bodyweight", // Bench
  8:  "Bodyweight", // Body weight
  9:  "Machine",    // Incline bench
  10: "Cable",
  11: "Machine",
  12: "Barbell",    // Plate
  13: "Cable",      // Resistance band
  14: "Dumbbell",   // Kettlebell
}

// wger muscle category ID → primary display name
const CATEGORY_PRIMARY: Record<number, string> = {
  8:  "Arms",
  9:  "Legs",
  10: "Abs",
  11: "Chest",
  12: "Back",
  13: "Shoulders",
  14: "Calves",
  15: "Glutes",
}

// Muscles som er på frontsiden av kroppen
const FRONT_KEYS = new Set(["chest", "shoulders", "abs", "quads", "biceps", "forearms"])

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
}

async function fetchAll(url: string): Promise<any[]> {
  const results: any[] = []
  let next: string | null = url
  while (next) {
    const res = await fetch(next)
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${next}`)
    const data = await res.json()
    results.push(...(data.results ?? []))
    next = data.next ?? null
    if (next) await new Promise(r => setTimeout(r, 300)) // rate limit
    process.stdout.write(`\r  Hentet ${results.length} øvelser...`)
  }
  console.log()
  return results
}

async function main() {
  console.log("Henter øvelser fra wger.de...")
  
  // exerciseinfo inkluderer navn, muskler og utstyr inline (ett API-kall per side)
  const raw = await fetchAll(
    `${BASE}/exerciseinfo/?format=json&language=2&limit=100`
  )
  console.log(`Totalt hentet: ${raw.length} oppføringer`)
  
  const seen = new Set<string>()
  const exercises: any[] = []
  
  for (const e of raw) {
    // Finn engelsk navn
    const enTranslation = (e.translations ?? []).find((t: any) => t.language === 2)
    const name = enTranslation?.name?.trim()
    if (!name) continue
    
    const id = slugify(name)
    if (!id || seen.has(id)) continue
    seen.add(id)
    
    // Primær muskel
    const primaryMuscle = (e.muscles ?? [])[0]
    const primaryKey = primaryMuscle ? (MUSCLE_KEY[primaryMuscle.id] ?? null) : null
    const primaryName = primaryMuscle?.name_en
      ?? CATEGORY_PRIMARY[e.category?.id] 
      ?? "General"
    
    // Sekundære muskler
    const secondaryMuscles = e.muscles_secondary ?? []
    const secondaryKeys = secondaryMuscles
      .map((m: any) => MUSCLE_KEY[m.id])
      .filter(Boolean)
    const secondaryNames = secondaryMuscles
      .map((m: any) => m.name_en)
      .filter(Boolean)
    
    // Highlight (unike MuscleKey-verdier)
    const highlight = [...new Set([
      ...(primaryKey ? [primaryKey] : []),
      ...secondaryKeys,
    ])]
    
    // View: front hvis primærmuskel er på frontsiden
    const view = primaryKey && FRONT_KEYS.has(primaryKey) ? "front" : "back"
    
    // Utstyr
    const equipObj = (e.equipment ?? [])[0]
    const equipment = equipObj ? (EQUIP[equipObj.id] ?? "Bodyweight") : "Bodyweight"
    
    // Beskrivelse (strip HTML fra wger)
    const description = enTranslation?.description
      ? stripHtml(enTranslation.description)
      : ""
    
    exercises.push({
      id,
      name,
      equipment,
      primary: primaryName,
      secondary: secondaryNames,
      highlight,
      view,
      description,
      tips: [],
      pr: "",
      lastUsed: "",
      lastWeight: "",
    })
  }
  
  console.log(`Behandlet ${exercises.length} unike øvelser`)
  
  // Generer exercises.ts
  const ts = `// AUTO-GENERATED av scripts/fetch-exercises.ts — ikke rediger manuelt
// Kjør: npx tsx scripts/fetch-exercises.ts for å regenerere

export type MuscleKey =
  | "chest" | "shoulders" | "triceps" | "biceps" | "forearms"
  | "upperBack" | "lats" | "lowerBack"
  | "abs" | "glutes" | "quads" | "hamstrings" | "calves"

export interface Exercise {
  id: string
  name: string
  equipment: string
  primary: string
  secondary: string[]
  highlight: MuscleKey[]
  view: "front" | "back"
  description: string
  tips: string[]
  pr: string
  lastUsed: string
  lastWeight: string
}

export const EXERCISES: Exercise[] = ${JSON.stringify(exercises, null, 2)} as Exercise[]

export function getExercise(id: string): Exercise | undefined {
  return EXERCISES.find(e => e.id === id)
}

export const MUSCLE_GROUPS = [
  "Alle",
  "Bryst",
  "Rygg",
  "Skuldre",
  "Biceps",
  "Triceps",
  "Bein",
  "Glutes",
  "Mage",
] as const

export type MuscleGroup = typeof MUSCLE_GROUPS[number]

const MUSCLE_GROUP_MAP: Record<MuscleGroup, string[]> = {
  "Alle": [],
  "Bryst": ["Chest", "Pectoralis major", "Serratus anterior"],
  "Rygg": ["Upper Back", "Lats", "Lower Back", "Trapezius", "Latissimus dorsi", "Erector spinae"],
  "Skuldre": ["Shoulders", "Anterior deltoid", "Posterior deltoid"],
  "Biceps": ["Biceps", "Biceps brachii", "Brachialis"],
  "Triceps": ["Triceps", "Triceps brachii"],
  "Bein": ["Quads", "Hamstrings", "Calves", "Quadriceps femoris", "Biceps femoris", "Gastrocnemius", "Soleus"],
  "Glutes": ["Glutes", "Gluteus maximus"],
  "Mage": ["Abs", "Rectus abdominis"],
}

export function filterExercises(group: MuscleGroup, query: string): Exercise[] {
  const q = query.toLowerCase().trim()
  return EXERCISES.filter(e => {
    const matchesGroup = group === "Alle" || MUSCLE_GROUP_MAP[group].some(m =>
      e.primary.toLowerCase().includes(m.toLowerCase())
    )
    const matchesQuery =
      q === "" ||
      e.name.toLowerCase().includes(q) ||
      e.primary.toLowerCase().includes(q)
    return matchesGroup && matchesQuery
  })
}
`
  
  const outPath = join(__dirname, "../web/src/lib/exercises.ts")
  writeFileSync(outPath, ts, "utf-8")
  console.log(`Skrevet til ${outPath}`)
  console.log("Ferdig!")
}

main().catch(e => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Kjør scriptet**

```bash
cd /Users/trymvestengen/Desktop/ai-coach && npx tsx scripts/fetch-exercises.ts
```

Forventet output:
```
Henter øvelser fra wger.de...
  Hentet 100 øvelser...
  Hentet 200 øvelser...
  ...
Totalt hentet: ~2000 oppføringer
Behandlet ~1800 unike øvelser
Skrevet til .../exercises.ts
Ferdig!
```

Hvis scriptet feiler med en HTTP-feil: wger.de kan være nede. Vent 30 sekunder og prøv igjen.

- [ ] **Step 3: Verifiser output**

```bash
head -5 /Users/trymvestengen/Desktop/ai-coach/web/src/lib/exercises.ts
wc -l /Users/trymvestengen/Desktop/ai-coach/web/src/lib/exercises.ts
```

Forventet: første linje er kommentar `// AUTO-GENERATED`, og filen er minst 10 000 linjer.

- [ ] **Step 4: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npx tsc --noEmit
```

Forventet: ingen feil. Merk: TypeScript kan ta 20–30 sekunder pga. stor fil — det er normalt.

Hvis du får feil som `Type 'string' is not assignable to type 'MuscleKey'`, finn linjen med `as Exercise[]` i det genererte scriptet og bekreft at den er der.

- [ ] **Step 5: Commit**

```bash
git -C /Users/trymvestengen/Desktop/ai-coach add scripts/fetch-exercises.ts web/src/lib/exercises.ts
git -C /Users/trymvestengen/Desktop/ai-coach commit -m "feat: replace exercise stubs with wger.de database (~1800 exercises)"
```

---

### Task 2: Swap-flyt — ExercisesPage + ExerciseLibrary

**Files:**
- Modify: `web/src/app/(tabs)/exercises/page.tsx`
- Modify: `web/src/components/exercises/ExerciseLibrary.tsx`

Swap-flyten: Swap-knapp → `/exercises?swap=<slotIndex>` → ExerciseLibrary i valgmodus → klikk på øvelse → lagrer i `sessionStorage` → `router.back()` → ProgramScreen leser sessionStorage.

- [ ] **Step 1: Oppdater exercises/page.tsx til å lese swap-parameteren**

Skriv over `/Users/trymvestengen/Desktop/ai-coach/web/src/app/(tabs)/exercises/page.tsx`:

```tsx
import ExerciseLibrary from "@/components/exercises/ExerciseLibrary"

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ swap?: string }>
}) {
  const params = await searchParams
  const swapSlot = params.swap !== undefined ? parseInt(params.swap, 10) : null
  return <ExerciseLibrary swapSlot={swapSlot} />
}
```

- [ ] **Step 2: Oppdater ExerciseLibrary med swap-modus**

Skriv over `/Users/trymvestengen/Desktop/ai-coach/web/src/components/exercises/ExerciseLibrary.tsx`:

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SearchIcon, ChevronIcon } from "@/components/ui/icons"
import { filterExercises, MUSCLE_GROUPS, type MuscleGroup, type Exercise } from "@/lib/exercises"

export default function ExerciseLibrary({ swapSlot = null }: { swapSlot?: number | null }) {
  const router = useRouter()
  const [group, setGroup] = useState<MuscleGroup>("Alle")
  const [query, setQuery] = useState("")

  const exercises = filterExercises(group, query)
  const isSwapMode = swapSlot !== null

  function handleSelect(ex: Exercise) {
    if (isSwapMode) {
      sessionStorage.setItem(
        "pendingSwap",
        JSON.stringify({ slot: swapSlot, exerciseId: ex.id, exerciseName: ex.name })
      )
      router.back()
    } else {
      router.push(`/exercises/${ex.id}`)
    }
  }

  return (
    <div className="screen">
      <div style={{ height: 54 }} />

      {/* Header */}
      <div style={{ padding: "8px 20px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        {isSwapMode && (
          <button
            onClick={() => router.back()}
            aria-label="Tilbake"
            style={{
              width: 36, height: 36, borderRadius: 999, flexShrink: 0,
              background: "transparent", border: "none", color: "var(--fg-0)",
              display: "grid", placeItems: "center", cursor: "pointer",
            }}
          >
            <ChevronIcon dir="left" size={20} />
          </button>
        )}
        <div style={{ flex: 1 }}>
          <div className="display-l" style={{ marginBottom: 2 }}>
            {isSwapMode ? "Velg øvelse" : "Øvelser"}
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-2)", fontWeight: 500 }}>
            {isSwapMode
              ? "Velg øvelsen du ønsker å bytte til"
              : `${exercises.length} øvelser`}
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "0 20px 10px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--bg-2)", border: "1px solid var(--border-1)",
          borderRadius: 12, padding: "10px 14px",
        }}>
          <SearchIcon size={16} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Søk etter øvelse..."
            aria-label="Søk etter øvelse"
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "var(--fg-0)", fontSize: 14, fontWeight: 500,
            }}
          />
        </div>
      </div>

      {/* Muscle group filter */}
      <div style={{ padding: "0 20px 10px" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {MUSCLE_GROUPS.map(g => {
            const active = group === g
            return (
              <button
                key={g}
                onClick={() => setGroup(g)}
                aria-pressed={active}
                aria-label={`Filter: ${g}`}
                style={{
                  flexShrink: 0, height: 32, padding: "0 14px", borderRadius: 999,
                  background: active ? "var(--ai-accent-soft)" : "var(--bg-2)",
                  border: active ? "1px solid rgba(255,107,53,0.3)" : "1px solid var(--border-1)",
                  color: active ? "var(--ai-accent)" : "var(--fg-2)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                {g}
              </button>
            )
          })}
        </div>
      </div>

      {/* Exercise list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 100px" }}>
        <div className="card" style={{ overflow: "hidden" }}>
          {exercises.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--fg-3)", fontSize: 14 }}>
              Ingen øvelser funnet
            </div>
          ) : exercises.map((ex, i) => (
            <button
              key={ex.id}
              onClick={() => handleSelect(ex)}
              aria-label={isSwapMode ? `Bytt til ${ex.name}` : `Se detaljer for ${ex.name}`}
              style={{
                width: "100%", textAlign: "left", background: "none",
                border: "none", color: "inherit", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px",
                borderTop: i === 0 ? "none" : "1px solid var(--border-1)",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: "var(--bg-3)", border: "1px solid var(--border-1)",
                display: "grid", placeItems: "center",
                fontSize: 16,
              }}>
                💪
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.008em" }}>{ex.name}</div>
                <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>
                  {ex.primary} · {ex.equipment}
                </div>
              </div>
              {isSwapMode ? (
                <div style={{
                  fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 999,
                  background: "var(--ai-accent-soft)", color: "var(--ai-accent)",
                  border: "1px solid rgba(255,107,53,0.2)", flexShrink: 0,
                }}>
                  Velg
                </div>
              ) : (
                <div style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase",
                  padding: "3px 7px", borderRadius: 6,
                  background: "var(--ai-accent-soft)", color: "var(--ai-accent)",
                  flexShrink: 0,
                }}>
                  {ex.primary}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npx tsc --noEmit
```

Forventet: ingen feil.

- [ ] **Step 4: Commit**

```bash
git -C /Users/trymvestengen/Desktop/ai-coach add "web/src/app/(tabs)/exercises/page.tsx" web/src/components/exercises/ExerciseLibrary.tsx
git -C /Users/trymvestengen/Desktop/ai-coach commit -m "feat: ExerciseLibrary swap mode with sessionStorage handoff"
```

---

### Task 3: Swap-flyt — ProgramScreen

**Files:**
- Modify: `web/src/components/program/ProgramScreen.tsx`

ProgramScreen må: (1) legge til `onSwap` prop på ExerciseRow, (2) koble Swap-knappen til `router.push('/exercises?swap=<index>')`, (3) lese `sessionStorage.pendingSwap` på mount og oppdatere øvelseslisten.

- [ ] **Step 1: Les gjeldende ProgramScreen.tsx**

Les filen for å se gjeldende ExerciseRow-signatur og ProgramScreen-funksjonsstart:

```bash
cat /Users/trymvestengen/Desktop/ai-coach/web/src/components/program/ProgramScreen.tsx
```

- [ ] **Step 2: Legg til useEffect og getExercise-import**

Øverst i filen, endre:
```tsx
import { useState } from "react"
import { useRouter } from "next/navigation"
```
til:
```tsx
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getExercise } from "@/lib/exercises"
```

- [ ] **Step 3: Legg til onSwap prop i ExerciseRow**

Finn:
```tsx
function ExerciseRow({ ex, isLast, onClick }: { ex: Exercise; isLast: boolean; onClick: () => void }) {
```
Endre til:
```tsx
function ExerciseRow({ ex, isLast, onClick, onSwap }: { ex: Exercise; isLast: boolean; onClick: () => void; onSwap: () => void }) {
```

Finn Swap-knappen (den med `<path d="M1 4h8l-2-2M11 8H3l2 2" />`):
```tsx
      <button style={{
        flexShrink: 0,
        padding: "5px 10px", borderRadius: 999,
        fontSize: 11, color: "var(--fg-2)", fontWeight: 600, letterSpacing: 0.1,
        background: "var(--bg-3)", border: "1px solid var(--border-1)",
        display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
      }}>
```
Legg til `onClick={onSwap}` og `aria-label="Swap øvelse"`:
```tsx
      <button
        onClick={onSwap}
        aria-label="Swap øvelse"
        style={{
          flexShrink: 0,
          padding: "5px 10px", borderRadius: 999,
          fontSize: 11, color: "var(--fg-2)", fontWeight: 600, letterSpacing: 0.1,
          background: "var(--bg-3)", border: "1px solid var(--border-1)",
          display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
        }}>
```

- [ ] **Step 4: Legg til useEffect for sessionStorage i ProgramScreen**

Inne i `ProgramScreen`-funksjonen, legg til dette rett etter `const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES)`:

```tsx
  useEffect(() => {
    const raw = sessionStorage.getItem("pendingSwap")
    if (!raw) return
    sessionStorage.removeItem("pendingSwap")
    try {
      const { slot, exerciseId, exerciseName } = JSON.parse(raw)
      const libEx = getExercise(exerciseId)
      const name = libEx?.name ?? exerciseName ?? exerciseId
      setExercises(prev => prev.map((ex, i) =>
        i === slot ? { ...ex, id: exerciseId, name } : ex
      ))
    } catch {
      // ignorer korrupt data
    }
  }, [])
```

- [ ] **Step 5: Oppdater exercises.map til å sende onSwap**

Finn:
```tsx
            {exercises.map((ex, i) => (
              <ExerciseRow
                key={ex.id}
                ex={ex}
                isLast={i === exercises.length - 1}
                onClick={() => router.push(`/exercises/${ex.id}`)}
              />
            ))}
```
Endre til:
```tsx
            {exercises.map((ex, i) => (
              <ExerciseRow
                key={ex.id}
                ex={ex}
                isLast={i === exercises.length - 1}
                onClick={() => router.push(`/exercises/${ex.id}`)}
                onSwap={() => router.push(`/exercises?swap=${i}`)}
              />
            ))}
```

- [ ] **Step 6: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npx tsc --noEmit
```

Forventet: ingen feil.

- [ ] **Step 7: Commit**

```bash
git -C /Users/trymvestengen/Desktop/ai-coach add web/src/components/program/ProgramScreen.tsx
git -C /Users/trymvestengen/Desktop/ai-coach commit -m "feat: ProgramScreen swap wiring via sessionStorage"
```

---

## Self-Review

**Spec coverage:**
- ✅ wger.de script henter alle øvelser: Task 1
- ✅ exercises.ts erstattes med ~1800 øvelser: Task 1 Step 2-4
- ✅ MUSCLE_GROUP_MAP utvidet med wger-muskelnavne: Task 1 (script genererer ny filterExercises)
- ✅ ExerciseLibrary swap-modus med header "Velg øvelse": Task 2 Step 2
- ✅ Klikk i swap-modus → sessionStorage → router.back(): Task 2 Step 2 (handleSelect)
- ✅ ProgramScreen leser sessionStorage på mount: Task 3 Step 4
- ✅ Swap-knapp i ExerciseRow kaller onSwap: Task 3 Step 3
- ✅ exercises.map sender onSwap med riktig slot-index: Task 3 Step 5

**Placeholder scan:** Ingen TBD eller vage steg. Alle kodeblokker er komplette.

**Type consistency:**
- `onSwap: () => void` definert i Task 3 Step 3, brukt i Step 5 ✅
- `swapSlot: number | null` definert i Task 2 Step 1, konsumert i Step 2 ✅
- `pendingSwap` JSON-struktur: `{ slot, exerciseId, exerciseName }` — skrevet i Task 2, lest i Task 3 ✅
- `getExercise(exerciseId)` returnerer `Exercise | undefined` — håndtert med fallback i Task 3 ✅
