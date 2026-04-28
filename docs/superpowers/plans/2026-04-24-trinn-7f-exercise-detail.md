# Trinn 7F: Exercise Detail + Library — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bygg en øvelsesdatabase med 25 øvelser fra Hevy, en søkbar bibliotekskjerm og en detaljskjerm per øvelse med muskelkroppdiagram, tabs (Summary/History/How to) og progresjonskart.

**Architecture:** Fire tasks: (1) legg til tre ikoner + opprett `exercises.ts` dataobjekt, (2) bygg `ExerciseDetail.tsx` og rut `/exercises/[id]` (utenfor tabs-layout, ingen nav), (3) bygg `ExerciseLibrary.tsx` og rut `/exercises` (innenfor tabs), (4) koble `ProgramScreen` sine øvelseseader til riktige ruter. Mock-data for history og progression inlines i ExerciseDetail.

**Tech Stack:** Next.js 15 App Router, TypeScript, CSS custom properties, inline styles + eksisterende CSS utility klasser (.card, .caption, .metric, .metric-s, .title-l, .title-m, .tnum, .screen, .display-l).

---

## File Map

**Modified:**
- `web/src/components/ui/icons.tsx` — legg til PlayIcon, MoreIcon, PlusIcon
- `web/src/components/program/ProgramScreen.tsx` — gjør ExerciseRow klikkbar → `/exercises/[id]`

**Created:**
- `web/src/lib/exercises.ts` — øvelsesdatabase (25 øvelser)
- `web/src/components/exercises/ExerciseDetail.tsx` — detail-skjerm
- `web/src/components/exercises/ExerciseLibrary.tsx` — bibliotekskjerm
- `web/src/app/exercises/[id]/page.tsx` — detail-rut (utenfor tabs)
- `web/src/app/exercises/[id]/layout.tsx` — layout uten BottomNav
- `web/src/app/(tabs)/exercises/page.tsx` — bibliotek-rut

---

### Task 1: Ikoner + øvelsesdatabase

**Files:**
- Modify: `web/src/components/ui/icons.tsx`
- Create: `web/src/lib/exercises.ts`

- [ ] **Step 1: Legg til PlayIcon, MoreIcon, PlusIcon i icons.tsx**

Åpne `/Users/trymvestengen/Desktop/ai-coach/web/src/components/ui/icons.tsx` og legg til disse tre eksportene etter `UserPlusIcon`:

```tsx
export const PlayIcon = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 5v14l12-7L7 5Z"/>
  </svg>
)

export const MoreIcon = ({ size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>
  </svg>
)

export const PlusIcon = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
```

- [ ] **Step 2: Opprett exercises.ts**

Opprett `/Users/trymvestengen/Desktop/ai-coach/web/src/lib/exercises.ts` med dette innholdet:

```ts
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

export const EXERCISES: Exercise[] = [
  {
    id: "bench-press",
    name: "Bench Press",
    equipment: "Barbell",
    primary: "Chest",
    secondary: ["Shoulders", "Triceps"],
    highlight: ["chest", "shoulders", "triceps"],
    view: "front",
    description: "Compound pushing movement. Drive the bar off your chest using the full pec and front delt, locking out with the triceps. Keep shoulder blades pinched, feet planted.",
    tips: [
      "Bar path curves slightly back toward your face on the way up.",
      "Touch ~1–2 cm above the nipple line, not the sternum.",
      "Set up with a small arch — ribs up, butt on the bench, feet flat.",
    ],
    pr: "95 kg × 3", lastUsed: "2 days ago", lastWeight: "82.5 kg × 5",
  },
  {
    id: "incline-db-press",
    name: "Incline DB Press",
    equipment: "Dumbbell",
    primary: "Chest",
    secondary: ["Shoulders", "Triceps"],
    highlight: ["chest", "shoulders", "triceps"],
    view: "front",
    description: "Upper-chest focused pressing movement. The incline angle shifts load to the clavicular head of the pec. Keep elbows at ~60° to avoid shoulder impingement.",
    tips: [
      "Set bench to 30–45°. Higher angles shift load too much to shoulders.",
      "Pause briefly at the bottom to eliminate momentum.",
      "Retract and depress shoulder blades throughout the set.",
    ],
    pr: "32 kg × 8", lastUsed: "4 days ago", lastWeight: "28 kg × 10",
  },
  {
    id: "cable-fly",
    name: "Cable Fly",
    equipment: "Cable",
    primary: "Chest",
    secondary: [],
    highlight: ["chest"],
    view: "front",
    description: "Isolation movement that keeps constant tension on the pec throughout the full range of motion. Excellent for stretch-mediated hypertrophy.",
    tips: [
      "Slight bend in the elbows — don't let them straighten fully.",
      "Focus on squeezing the pecs at the midpoint, not just moving weight.",
      "Control the eccentric — resist the pull back to the start.",
    ],
    pr: "20 kg × 15", lastUsed: "4 days ago", lastWeight: "15 kg × 12",
  },
  {
    id: "overhead-press",
    name: "Overhead Press",
    equipment: "Barbell",
    primary: "Shoulders",
    secondary: ["Triceps", "Upper Back"],
    highlight: ["shoulders", "triceps"],
    view: "front",
    description: "Vertical pressing movement targeting the deltoids and triceps. A key indicator of upper-body pressing strength. Brace the core hard to protect the lower back.",
    tips: [
      "Tuck elbows slightly forward rather than flaring wide.",
      "Press slightly behind the head plane at the top.",
      "Push your head through at lockout — don't lean back.",
    ],
    pr: "72.5 kg × 3", lastUsed: "5 days ago", lastWeight: "65 kg × 5",
  },
  {
    id: "lateral-raise",
    name: "Lateral Raise",
    equipment: "Dumbbell",
    primary: "Shoulders",
    secondary: [],
    highlight: ["shoulders"],
    view: "front",
    description: "Isolation movement for the medial deltoid. Creates shoulder width. Best performed with moderate weight and strict form — avoid shrugging.",
    tips: [
      "Lead with the elbows, not the hands.",
      "Tilt the dumbbell slightly so the pinky side is higher (like pouring a jug).",
      "Stop at shoulder height — going higher recruits traps unnecessarily.",
    ],
    pr: "20 kg × 12", lastUsed: "5 days ago", lastWeight: "16 kg × 15",
  },
  {
    id: "face-pull",
    name: "Face Pull",
    equipment: "Cable",
    primary: "Shoulders",
    secondary: ["Upper Back"],
    highlight: ["shoulders", "upperBack"],
    view: "back",
    description: "Rear-delt and rotator-cuff focused pull. Excellent shoulder health exercise. Use a rope attachment and pull to face level with elbows high.",
    tips: [
      "Keep elbows high and flared out — above shoulder height.",
      "External-rotate at the end of the pull: 'show your biceps to the ceiling'.",
      "Light weight, high reps. This is a health movement, not a strength showcase.",
    ],
    pr: "30 kg × 20", lastUsed: "4 days ago", lastWeight: "22 kg × 15",
  },
  {
    id: "pull-up",
    name: "Pull Up",
    equipment: "Bodyweight",
    primary: "Lats",
    secondary: ["Biceps", "Upper Back"],
    highlight: ["lats", "biceps", "upperBack"],
    view: "back",
    description: "Vertical pulling compound movement. One of the best upper-body exercises. Full range of motion is key — dead hang at the bottom, chin over bar at top.",
    tips: [
      "Start from a dead hang with shoulders fully packed.",
      "Drive elbows down and back — think 'elbows to hips'.",
      "Control the descent over 2–3 seconds.",
    ],
    pr: "+20 kg × 5", lastUsed: "3 days ago", lastWeight: "+15 kg × 6",
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    equipment: "Cable",
    primary: "Lats",
    secondary: ["Biceps"],
    highlight: ["lats", "biceps"],
    view: "back",
    description: "Vertical pulling movement on a cable machine. Great for building lat width. Allows load variation not possible with pull-ups.",
    tips: [
      "Lean back slightly and pull to upper chest, not behind the neck.",
      "Initiate by depressing the shoulder blades before bending the elbows.",
      "Full stretch at the top — let arms reach overhead completely.",
    ],
    pr: "85 kg × 8", lastUsed: "3 days ago", lastWeight: "75 kg × 10",
  },
  {
    id: "barbell-row",
    name: "Barbell Row",
    equipment: "Barbell",
    primary: "Upper Back",
    secondary: ["Lats", "Biceps", "Lower Back"],
    highlight: ["upperBack", "lats", "biceps"],
    view: "back",
    description: "Horizontal pulling compound movement. Builds upper-back thickness and lat width. Hinge at the hips ~45° and row the bar to your lower abdomen.",
    tips: [
      "Pull to the belly button, not the chest — keeps the lats involved.",
      "Drive the elbows back and up, not straight back.",
      "Keep lower back flat — neutral spine throughout.",
    ],
    pr: "110 kg × 5", lastUsed: "3 days ago", lastWeight: "100 kg × 6",
  },
  {
    id: "chest-supported-row",
    name: "Chest-Supported Row",
    equipment: "Dumbbell",
    primary: "Upper Back",
    secondary: ["Lats", "Biceps"],
    highlight: ["upperBack", "lats"],
    view: "back",
    description: "Horizontal pull with chest supported on an incline bench. Eliminates lower-back involvement, letting you focus entirely on upper-back contraction.",
    tips: [
      "Pull elbows high and wide for upper traps; low and tight for lats.",
      "Pause and squeeze at the top for 1 second.",
      "Go heavier than you think — the support removes the stabilization tax.",
    ],
    pr: "36 kg × 10", lastUsed: "4 days ago", lastWeight: "30 kg × 10",
  },
  {
    id: "deadlift",
    name: "Deadlift",
    equipment: "Barbell",
    primary: "Lower Back",
    secondary: ["Glutes", "Hamstrings", "Upper Back"],
    highlight: ["lowerBack", "glutes", "hamstrings"],
    view: "back",
    description: "The king of posterior-chain movements. Builds total-body strength and mass. Brace hard, keep the bar close, and drive the floor away.",
    tips: [
      "Bar over mid-foot, about 2 cm from the shins before pulling.",
      "Take air before the pull — Valsalva brace throughout.",
      "Drive hips forward at lockout, don't hyperextend the lower back.",
    ],
    pr: "180 kg × 1", lastUsed: "6 days ago", lastWeight: "160 kg × 5",
  },
  {
    id: "back-squat",
    name: "Back Squat",
    equipment: "Barbell",
    primary: "Quads",
    secondary: ["Glutes", "Lower Back"],
    highlight: ["quads", "glutes"],
    view: "front",
    description: "Fundamental lower-body compound movement. High bar favors quad development; low bar favors posterior chain. Sit between the legs, not behind them.",
    tips: [
      "Knees track over the toes — never cave inward.",
      "Depth: aim for hip crease below the knee (parallel or below).",
      "Brace as if about to take a punch to the gut.",
    ],
    pr: "140 kg × 5", lastUsed: "5 days ago", lastWeight: "125 kg × 5",
  },
  {
    id: "romanian-deadlift",
    name: "Romanian Deadlift",
    equipment: "Barbell",
    primary: "Hamstrings",
    secondary: ["Glutes", "Lower Back"],
    highlight: ["hamstrings", "glutes", "lowerBack"],
    view: "back",
    description: "Hip hinge movement emphasizing the hamstrings eccentrically. Keep bar close to legs, hinge until hamstrings are fully stretched, then drive hips forward.",
    tips: [
      "The bar shouldn't leave your legs — drag it down your shins and thighs.",
      "Stop when you feel a strong hamstring stretch, not when the bar hits the floor.",
      "Soft bend in the knees — this is a hip hinge, not a squat.",
    ],
    pr: "130 kg × 6", lastUsed: "5 days ago", lastWeight: "115 kg × 8",
  },
  {
    id: "leg-press",
    name: "Leg Press",
    equipment: "Machine",
    primary: "Quads",
    secondary: ["Glutes"],
    highlight: ["quads", "glutes"],
    view: "front",
    description: "Machine-based lower-body push. Allows high volume without spinal loading. Foot position changes emphasis: high/wide = glutes, low/narrow = quads.",
    tips: [
      "Don't lock out the knees at the top — keep tension on the muscle.",
      "Control the descent — don't let the sled crash down.",
      "Maintain lower-back contact with the pad throughout.",
    ],
    pr: "280 kg × 10", lastUsed: "5 days ago", lastWeight: "240 kg × 12",
  },
  {
    id: "leg-curl",
    name: "Leg Curl",
    equipment: "Machine",
    primary: "Hamstrings",
    secondary: [],
    highlight: ["hamstrings"],
    view: "back",
    description: "Isolation movement for the hamstrings. Lying variant allows greater hip extension and a fuller stretch. Key supplemental exercise for hamstring hypertrophy.",
    tips: [
      "Pause at full contraction — squeeze for 1 second.",
      "Control the eccentric over 3 seconds.",
      "Hips stay on the pad — don't lift the hips to cheat.",
    ],
    pr: "75 kg × 12", lastUsed: "5 days ago", lastWeight: "60 kg × 12",
  },
  {
    id: "hip-thrust",
    name: "Hip Thrust",
    equipment: "Barbell",
    primary: "Glutes",
    secondary: ["Hamstrings"],
    highlight: ["glutes", "hamstrings"],
    view: "back",
    description: "Glute-dominant hip extension movement. Bench supports the upper back. Drive hips up until body forms a straight line from knees to shoulders.",
    tips: [
      "Chin to chest at the top — don't look up.",
      "Feet placement: shins vertical when hips are fully extended.",
      "Brace the core — don't hyperextend the lower back at the top.",
    ],
    pr: "180 kg × 8", lastUsed: "5 days ago", lastWeight: "160 kg × 10",
  },
  {
    id: "calf-raise",
    name: "Calf Raise",
    equipment: "Machine",
    primary: "Calves",
    secondary: [],
    highlight: ["calves"],
    view: "back",
    description: "Isolation movement for the gastrocnemius and soleus. Full range of motion is critical — deep stretch at the bottom, full contraction at the top.",
    tips: [
      "Full range: let the heel drop well below the step level.",
      "Slow the eccentric — calves respond well to time under tension.",
      "Straight knee = more gastrocnemius; bent knee = more soleus.",
    ],
    pr: "120 kg × 15", lastUsed: "5 days ago", lastWeight: "100 kg × 15",
  },
  {
    id: "bicep-curl",
    name: "Bicep Curl",
    equipment: "Barbell",
    primary: "Biceps",
    secondary: ["Forearms"],
    highlight: ["biceps", "forearms"],
    view: "front",
    description: "Classic bicep isolation. Supinated grip maximizes bicep involvement. Keep elbows stationary at the sides — don't swing the torso.",
    tips: [
      "Full extension at the bottom — don't cut the range short.",
      "Squeeze hard at the top and control the descent.",
      "Slightly narrower than shoulder-width grip to keep supination.",
    ],
    pr: "65 kg × 5", lastUsed: "3 days ago", lastWeight: "55 kg × 8",
  },
  {
    id: "hammer-curl",
    name: "Hammer Curl",
    equipment: "Dumbbell",
    primary: "Biceps",
    secondary: ["Forearms"],
    highlight: ["biceps", "forearms"],
    view: "front",
    description: "Neutral-grip curl that targets the brachialis and brachioradialis along with the bicep. Builds arm thickness. Can be done alternating or simultaneously.",
    tips: [
      "Neutral grip (thumbs up) throughout — no rotation.",
      "Elbows stay pinned to the sides.",
      "Great for lifters who feel elbow pain on supinated curls.",
    ],
    pr: "28 kg × 10", lastUsed: "3 days ago", lastWeight: "24 kg × 12",
  },
  {
    id: "tricep-pushdown",
    name: "Tricep Pushdown",
    equipment: "Cable",
    primary: "Triceps",
    secondary: [],
    highlight: ["triceps"],
    view: "back",
    description: "Cable isolation for the triceps. Use a rope or bar. Keep elbows pinned at your sides and fully extend at the bottom for maximum contraction.",
    tips: [
      "Elbows stay glued to your sides — don't let them flare.",
      "Flare the rope handles apart at the bottom for extra contraction.",
      "Slight forward lean to better isolate the lateral head.",
    ],
    pr: "55 kg × 12", lastUsed: "4 days ago", lastWeight: "45 kg × 15",
  },
  {
    id: "skullcrusher",
    name: "Skullcrusher",
    equipment: "Barbell",
    primary: "Triceps",
    secondary: [],
    highlight: ["triceps"],
    view: "back",
    description: "Lying tricep extension. One of the best mass builders for the long head of the tricep. Lower the bar to the forehead or slightly behind the head.",
    tips: [
      "Let the elbows drift slightly back during the lowering phase — stretches the long head.",
      "Keep upper arms perpendicular to the floor.",
      "Use an EZ bar to reduce wrist stress vs. straight bar.",
    ],
    pr: "65 kg × 8", lastUsed: "4 days ago", lastWeight: "55 kg × 10",
  },
  {
    id: "arnold-press",
    name: "Arnold Press",
    equipment: "Dumbbell",
    primary: "Shoulders",
    secondary: ["Triceps"],
    highlight: ["shoulders", "triceps"],
    view: "front",
    description: "Rotating dumbbell press created by Arnold Schwarzenegger. The rotation at the bottom engages the front delts through a longer range of motion.",
    tips: [
      "Start with palms facing you, rotate to facing forward as you press.",
      "Controlled rotation — not a sloppy swing.",
      "Great for front delt and overall shoulder hypertrophy.",
    ],
    pr: "28 kg × 10", lastUsed: "5 days ago", lastWeight: "24 kg × 10",
  },
  {
    id: "leg-extension",
    name: "Leg Extension",
    equipment: "Machine",
    primary: "Quads",
    secondary: [],
    highlight: ["quads"],
    view: "front",
    description: "Quad isolation machine. Targets the rectus femoris and vastus group. Excellent for finishing quad work or for those who can't squat heavy.",
    tips: [
      "Pause and squeeze hard at full extension.",
      "Seated position — adjust so knees align with the pivot.",
      "Slow the eccentric — quads benefit from time under tension.",
    ],
    pr: "100 kg × 12", lastUsed: "5 days ago", lastWeight: "80 kg × 15",
  },
  {
    id: "plank",
    name: "Plank",
    equipment: "Bodyweight",
    primary: "Abs",
    secondary: ["Lower Back"],
    highlight: ["abs", "lowerBack"],
    view: "front",
    description: "Isometric core stability exercise. Builds anti-extension strength and overall core endurance. Keep a straight line from head to heels.",
    tips: [
      "Squeeze glutes and abs hard — don't let hips sag or pike.",
      "Breathe normally — don't hold your breath.",
      "Progress by adding weight on the back or elevating feet.",
    ],
    pr: "3 min 20 sek", lastUsed: "2 days ago", lastWeight: "2 min 00 sek",
  },
  {
    id: "goblet-squat",
    name: "Goblet Squat",
    equipment: "Dumbbell",
    primary: "Quads",
    secondary: ["Glutes", "Abs"],
    highlight: ["quads", "glutes"],
    view: "front",
    description: "Front-loaded squat holding a dumbbell at the chest. Great for quad emphasis and as a teaching tool for squat mechanics. Keeps the torso upright.",
    tips: [
      "Hold the dumbbell vertically at chest height with both hands.",
      "Elbows track inside the knees at the bottom.",
      "Go deep — goblet squat naturally promotes good depth.",
    ],
    pr: "60 kg × 10", lastUsed: "7 days ago", lastWeight: "48 kg × 12",
  },
]

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
  "Bryst": ["Chest"],
  "Rygg": ["Upper Back", "Lats", "Lower Back"],
  "Skuldre": ["Shoulders"],
  "Biceps": ["Biceps"],
  "Triceps": ["Triceps"],
  "Bein": ["Quads", "Hamstrings", "Calves"],
  "Glutes": ["Glutes"],
  "Mage": ["Abs"],
}

export function filterExercises(group: MuscleGroup, query: string): Exercise[] {
  const q = query.toLowerCase().trim()
  return EXERCISES.filter(e => {
    const matchesGroup = group === "Alle" || MUSCLE_GROUP_MAP[group].includes(e.primary)
    const matchesQuery = q === "" || e.name.toLowerCase().includes(q) || e.primary.toLowerCase().includes(q)
    return matchesGroup && matchesQuery
  })
}
```

- [ ] **Step 3: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npx tsc --noEmit
```

Forventet: ingen feil.

- [ ] **Step 4: Commit**

```bash
git -C /Users/trymvestengen/Desktop/ai-coach add web/src/components/ui/icons.tsx web/src/lib/exercises.ts
git -C /Users/trymvestengen/Desktop/ai-coach commit -m "feat: add PlayIcon/MoreIcon/PlusIcon and exercises database"
```

---

### Task 2: ExerciseDetail-skjerm

**Files:**
- Create: `web/src/components/exercises/ExerciseDetail.tsx`
- Create: `web/src/app/exercises/[id]/layout.tsx`
- Create: `web/src/app/exercises/[id]/page.tsx`

- [ ] **Step 1: Opprett ExerciseDetail.tsx**

Opprett `/Users/trymvestengen/Desktop/ai-coach/web/src/components/exercises/ExerciseDetail.tsx`:

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronIcon, PlayIcon, MoreIcon, PlusIcon } from "@/components/ui/icons"
import type { Exercise, MuscleKey } from "@/lib/exercises"

/* ── MuscleBody ── */
function MuscleBody({ highlight, width = 100, view }: { highlight: MuscleKey[]; width?: number; view: "front" | "back" }) {
  const on = (k: MuscleKey) => highlight.includes(k)
  const accent = "var(--ai-accent)"
  const body = "rgba(255,255,255,0.12)"
  const out = "rgba(255,255,255,0.25)"

  return (
    <svg width={width} height={width * 1.5} viewBox="0 0 100 150" fill="none" aria-hidden="true">
      <circle cx="50" cy="12" r="7.5" fill={body} stroke={out} strokeWidth="0.7"/>
      <path d="M36 22 Q50 24 64 22 L68 36 Q70 48 68 62 Q65 74 62 82 L38 82 Q35 74 32 62 Q30 48 32 36 Z" fill={body} stroke={out} strokeWidth="0.7"/>
      <path d="M36 24 L28 30 Q24 38 26 52 L31 54 Q34 42 37 36 Z" fill={body} stroke={out} strokeWidth="0.7"/>
      <path d="M64 24 L72 30 Q76 38 74 52 L69 54 Q66 42 63 36 Z" fill={body} stroke={out} strokeWidth="0.7"/>
      <path d="M26 52 L22 76 L28 78 L32 54 Z" fill={body} stroke={out} strokeWidth="0.7"/>
      <path d="M74 52 L78 76 L72 78 L68 54 Z" fill={body} stroke={out} strokeWidth="0.7"/>
      <path d="M38 82 L34 114 L40 114 L46 84 Z" fill={body} stroke={out} strokeWidth="0.7"/>
      <path d="M62 82 L66 114 L60 114 L54 84 Z" fill={body} stroke={out} strokeWidth="0.7"/>
      <path d="M34 114 L32 142 L40 142 L40 114 Z" fill={body} stroke={out} strokeWidth="0.7"/>
      <path d="M66 114 L68 142 L60 142 L60 114 Z" fill={body} stroke={out} strokeWidth="0.7"/>

      {view === "front" && (
        <>
          {on("chest") && <path d="M38 30 Q50 34 62 30 L62 44 Q50 47 38 44 Z" fill={accent} opacity="0.72"/>}
          {on("shoulders") && <>
            <ellipse cx="34" cy="28" rx="6" ry="4.5" fill={accent} opacity="0.72"/>
            <ellipse cx="66" cy="28" rx="6" ry="4.5" fill={accent} opacity="0.72"/>
          </>}
          {on("abs") && <path d="M42 48 L58 48 L56 78 L44 78 Z" fill={accent} opacity="0.58"/>}
          {on("biceps") && <>
            <path d="M27 38 Q25 46 27 50 L31 50 Q33 44 33 38 Z" fill={accent} opacity="0.72"/>
            <path d="M73 38 Q75 46 73 50 L69 50 Q67 44 67 38 Z" fill={accent} opacity="0.72"/>
          </>}
          {on("forearms") && <>
            <path d="M24 58 L22 76 L28 78 L30 58 Z" fill={accent} opacity="0.6"/>
            <path d="M76 58 L78 76 L72 78 L70 58 Z" fill={accent} opacity="0.6"/>
          </>}
          {on("quads") && <>
            <path d="M38 86 L36 108 L42 108 L44 86 Z" fill={accent} opacity="0.72"/>
            <path d="M62 86 L64 108 L58 108 L56 86 Z" fill={accent} opacity="0.72"/>
          </>}
        </>
      )}
      {view === "back" && (
        <>
          {on("upperBack") && <path d="M36 26 Q50 30 64 26 L66 42 Q50 44 34 42 Z" fill={accent} opacity="0.72"/>}
          {on("lats") && <path d="M34 42 Q50 48 66 42 L64 60 Q50 63 36 60 Z" fill={accent} opacity="0.7"/>}
          {on("lowerBack") && <path d="M40 62 L60 62 L58 78 L42 78 Z" fill={accent} opacity="0.6"/>}
          {on("glutes") && <path d="M38 82 L62 82 L62 94 Q50 97 38 94 Z" fill={accent} opacity="0.72"/>}
          {on("hamstrings") && <>
            <path d="M38 94 L36 112 L42 112 L44 94 Z" fill={accent} opacity="0.7"/>
            <path d="M62 94 L64 112 L58 112 L56 94 Z" fill={accent} opacity="0.7"/>
          </>}
          {on("calves") && <>
            <path d="M34 116 L32 138 L40 138 L40 116 Z" fill={accent} opacity="0.72"/>
            <path d="M66 116 L68 138 L60 138 L60 116 Z" fill={accent} opacity="0.72"/>
          </>}
          {on("triceps") && <>
            <path d="M25 36 Q23 46 25 52 L29 52 Q31 44 31 36 Z" fill={accent} opacity="0.72"/>
            <path d="M75 36 Q77 46 75 52 L71 52 Q69 44 69 36 Z" fill={accent} opacity="0.72"/>
          </>}
          {on("shoulders") && <>
            <ellipse cx="34" cy="28" rx="6" ry="4.5" fill={accent} opacity="0.72"/>
            <ellipse cx="66" cy="28" rx="6" ry="4.5" fill={accent} opacity="0.72"/>
          </>}
        </>
      )}
    </svg>
  )
}

/* ── ExerciseIllustration ── */
function ExerciseIllustration({ highlight, view }: { highlight: MuscleKey[]; view: "front" | "back" }) {
  const [showBack, setShowBack] = useState(view === "back")
  return (
    <div style={{
      position: "relative",
      background: "radial-gradient(ellipse at 50% 40%, #1A1816 0%, #0A0A0B 70%)",
      borderRadius: 20, padding: "18px 16px",
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 24, minHeight: 220,
      border: "1px solid var(--border-1)", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: -20, top: "auto", height: 120,
        background: "radial-gradient(ellipse at 50% 100%, rgba(255,107,53,0.18), transparent 70%)",
        pointerEvents: "none",
      }} />
      <MuscleBody width={100} view="front" highlight={highlight} />
      <MuscleBody width={100} view="back" highlight={highlight} />
      <button
        onClick={() => setShowBack(v => !v)}
        aria-label="Toggle front/back view"
        style={{
          position: "absolute", top: 14, right: 14,
          width: 34, height: 34, borderRadius: 999,
          background: "rgba(10,10,11,0.7)", border: "1px solid var(--border-1)",
          color: "var(--fg-0)", display: "grid", placeItems: "center",
          backdropFilter: "blur(12px)", cursor: "pointer",
        }}
      >
        <PlayIcon size={12} />
      </button>
    </div>
  )
}

/* ── Tab button ── */
function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "10px 0", background: "none", border: "none",
      color: active ? "var(--fg-0)" : "var(--fg-2)",
      fontSize: 14, fontWeight: 600, letterSpacing: "-0.008em",
      position: "relative", cursor: "pointer",
    }}>
      {label}
      {active && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 2, background: "var(--ai-accent)", borderRadius: 2,
        }} />
      )}
    </button>
  )
}

/* ── MOCK progression data ── */
const PROG_PTS = [60, 62, 58, 65, 64, 68, 70, 72, 74, 76, 78, 80, 82.5]
const HISTORY = [
  { d: "Apr 23, 2026", s: "4 sett", best: "82.5 × 5", pr: true  },
  { d: "Apr 16, 2026", s: "4 sett", best: "80 × 5",   pr: false },
  { d: "Apr 9, 2026",  s: "3 sett", best: "80 × 4",   pr: false },
  { d: "Apr 2, 2026",  s: "4 sett", best: "77.5 × 5", pr: false },
  { d: "Mar 26, 2026", s: "4 sett", best: "75 × 5",   pr: false },
]

/* ── ExerciseDetail ── */
export default function ExerciseDetail({ exercise }: { exercise: Exercise }) {
  const router = useRouter()
  const [tab, setTab] = useState<"summary" | "history" | "howto">("summary")

  return (
    <div className="screen">
      <div style={{ height: 54 }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px 8px 8px" }}>
        <button onClick={() => router.back()} style={{
          width: 40, height: 40, borderRadius: 999,
          background: "transparent", border: "none", color: "var(--fg-0)",
          display: "grid", placeItems: "center", cursor: "pointer",
        }}>
          <ChevronIcon dir="left" size={20} />
        </button>
        <div className="title-m">{exercise.name}</div>
        <button style={{
          width: 40, height: 40, borderRadius: 999,
          background: "transparent", border: "none", color: "var(--fg-0)",
          display: "grid", placeItems: "center", cursor: "pointer",
        }}>
          <MoreIcon size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-1)", padding: "0 20px" }}>
        <TabButton label="Summary"  active={tab === "summary"}  onClick={() => setTab("summary")} />
        <TabButton label="History"  active={tab === "history"}  onClick={() => setTab("history")} />
        <TabButton label="How to"   active={tab === "howto"}    onClick={() => setTab("howto")} />
      </div>

      {/* Scroll area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 160px" }}>
        <ExerciseIllustration highlight={exercise.highlight} view={exercise.view} />

        {/* Name + tags */}
        <div style={{ marginTop: 14 }}>
          <div className="title-l">{exercise.name}</div>
          <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase",
              padding: "3px 8px", borderRadius: 6,
              background: "var(--ai-accent-soft)", color: "var(--ai-accent)",
            }}>
              Primary · {exercise.primary}
            </div>
            {exercise.secondary.map(s => (
              <div key={s} style={{
                fontSize: 11, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase",
                padding: "3px 8px", borderRadius: 6,
                background: "rgba(255,255,255,0.06)", color: "var(--fg-2)",
              }}>{s}</div>
            ))}
          </div>
        </div>

        {tab === "summary" && (
          <>
            {/* Coach tip */}
            <div style={{
              marginTop: 14, padding: "12px 14px",
              background: "linear-gradient(180deg, rgba(255,107,53,0.08), rgba(255,107,53,0.02))",
              border: "1px solid rgba(255,107,53,0.2)", borderRadius: 14,
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 999, flexShrink: 0,
                background: "radial-gradient(circle at 32% 32%, #FFC9A8, var(--ai-accent) 55%, #9A2E10)",
                boxShadow: "0 0 14px rgba(255,107,53,0.4)", marginTop: 1,
              }} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--ai-accent)", marginBottom: 2 }}>
                  Coach tip
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.4, color: "var(--fg-0)" }}>
                  Basert på dine siste tre sesjoner — prøv 2.5 kg over forrige gang. Bar-hastigheten har vært sterk.
                </div>
              </div>
            </div>

            {/* PR + last used */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              <div className="card" style={{ padding: 12 }}>
                <div className="caption">Personal record</div>
                <div className="metric" style={{ marginTop: 8, fontSize: 22 }}>{exercise.pr}</div>
                <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}>12 Apr 2026</div>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <div className="caption">Sist brukt</div>
                <div className="metric" style={{ marginTop: 8, fontSize: 22 }}>{exercise.lastUsed}</div>
                <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}>{exercise.lastWeight}</div>
              </div>
            </div>

            {/* Progression chart */}
            <div className="card" style={{ padding: 14, marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div className="caption">Tyngste vekt</div>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", marginTop: 4 }} className="tnum">
                    82.5 kg <span style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500 }}>· Apr 23</span>
                  </div>
                </div>
                <div style={{
                  fontSize: 12, color: "var(--ai-accent)", fontWeight: 600,
                  padding: "5px 10px", borderRadius: 999, background: "var(--ai-accent-soft)",
                }}>År ▾</div>
              </div>
              <svg width="100%" height="90" viewBox="0 0 320 90" preserveAspectRatio="none" style={{ display: "block" }} aria-hidden="true">
                <defs>
                  <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--ai-accent)" stopOpacity="0.35"/>
                    <stop offset="100%" stopColor="var(--ai-accent)" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {[0,1,2,3].map(i => (
                  <line key={i} x1="0" x2="320" y1={i * 22 + 6} y2={i * 22 + 6} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                ))}
                {(() => {
                  const pts = PROG_PTS
                  const min = 55, max = 85
                  const xs = pts.map((_, i) => (i / (pts.length - 1)) * 320)
                  const ys = pts.map(p => 82 - ((p - min) / (max - min)) * 72)
                  const line = pts.map((_, i) => `${i === 0 ? "M" : "L"}${xs[i].toFixed(1)},${ys[i].toFixed(1)}`).join(" ")
                  const area = `${line} L320,90 L0,90 Z`
                  return (
                    <>
                      <path d={area} fill="url(#chartFill)"/>
                      <path d={line} stroke="var(--ai-accent)" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
                      {xs.map((x, i) => i === xs.length - 1 && (
                        <circle key={i} cx={x} cy={ys[i]} r="3.5" fill="var(--ai-accent)" stroke="var(--bg-0)" strokeWidth="2"/>
                      ))}
                    </>
                  )
                })()}
                <text x="2" y="88" fontSize="9" fill="var(--fg-3)">Apr &apos;25</text>
                <text x="155" y="88" fontSize="9" fill="var(--fg-3)" textAnchor="middle">Okt &apos;25</text>
                <text x="316" y="88" fontSize="9" fill="var(--fg-3)" textAnchor="end">Apr &apos;26</text>
              </svg>
              <div style={{ display: "flex", gap: 6, marginTop: 12, overflowX: "auto" }}>
                {["Tyngste", "1RM est.", "Best volum", "Sesjonsvolum"].map((l, i) => (
                  <div key={l} style={{
                    fontSize: 11, fontWeight: 600, padding: "6px 10px", borderRadius: 999,
                    background: i === 0 ? "var(--ai-accent)" : "var(--bg-3)",
                    color: i === 0 ? "var(--primary-foreground)" : "var(--fg-1)",
                    border: i === 0 ? "none" : "1px solid var(--border-1)",
                    whiteSpace: "nowrap", flexShrink: 0,
                  }}>{l}</div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginTop: 18 }}>
              <div className="caption" style={{ marginBottom: 6 }}>Om øvelsen</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--fg-1)" }}>{exercise.description}</div>
            </div>
          </>
        )}

        {tab === "history" && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {HISTORY.map(h => (
              <div key={h.d} className="card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.008em" }}>{h.d}</div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{h.s} · top sett {h.best}</div>
                </div>
                {h.pr && (
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
                    padding: "3px 7px", borderRadius: 6,
                    background: "var(--ai-accent-soft)", color: "var(--ai-accent)",
                  }}>PR</div>
                )}
                <ChevronIcon size={14} />
              </div>
            ))}
          </div>
        )}

        {tab === "howto" && (
          <div style={{ marginTop: 14 }}>
            <div className="caption" style={{ marginBottom: 6 }}>Nøkkelpunkter</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {exercise.tips.map((t, i) => (
                <div key={i} style={{
                  display: "flex", gap: 12, padding: 12,
                  background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 12,
                }}>
                  <div className="tnum" style={{
                    width: 22, height: 22, borderRadius: 999,
                    background: "var(--ai-accent-soft)", color: "var(--ai-accent)",
                    display: "grid", placeItems: "center",
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.45, color: "var(--fg-1)" }}>{t}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "14px 20px 28px",
        background: "linear-gradient(to top, #0A0A0B 60%, rgba(10,10,11,0))",
      }}>
        <button style={{
          width: "100%", height: 52, borderRadius: 16,
          background: "var(--ai-accent)", color: "var(--primary-foreground)",
          border: "none", cursor: "pointer",
          fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          <PlusIcon size={18} />
          Logg øvelse
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Opprett layout.tsx for exercises/[id] (ingen BottomNav)**

Opprett `/Users/trymvestengen/Desktop/ai-coach/web/src/app/exercises/[id]/layout.tsx`:

```tsx
export default function ExerciseDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-[390px] h-full bg-background text-foreground shadow-2xl overflow-hidden">
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Opprett page.tsx for exercises/[id]**

Opprett `/Users/trymvestengen/Desktop/ai-coach/web/src/app/exercises/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation"
import { getExercise } from "@/lib/exercises"
import ExerciseDetail from "@/components/exercises/ExerciseDetail"

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const exercise = getExercise(id)
  if (!exercise) notFound()
  return <ExerciseDetail exercise={exercise} />
}
```

- [ ] **Step 4: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npx tsc --noEmit
```

Forventet: ingen feil.

- [ ] **Step 5: Commit**

```bash
git -C /Users/trymvestengen/Desktop/ai-coach add web/src/components/exercises/ExerciseDetail.tsx web/src/app/exercises/
git -C /Users/trymvestengen/Desktop/ai-coach commit -m "feat: add ExerciseDetail screen with muscle diagram, tabs, chart"
```

---

### Task 3: ExerciseLibrary-skjerm

**Files:**
- Create: `web/src/components/exercises/ExerciseLibrary.tsx`
- Create: `web/src/app/(tabs)/exercises/page.tsx`

- [ ] **Step 1: Opprett ExerciseLibrary.tsx**

Opprett `/Users/trymvestengen/Desktop/ai-coach/web/src/components/exercises/ExerciseLibrary.tsx`:

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SearchIcon } from "@/components/ui/icons"
import { filterExercises, MUSCLE_GROUPS, type MuscleGroup } from "@/lib/exercises"

export default function ExerciseLibrary() {
  const router = useRouter()
  const [group, setGroup] = useState<MuscleGroup>("Alle")
  const [query, setQuery] = useState("")

  const exercises = filterExercises(group, query)

  return (
    <div className="screen">
      <div style={{ height: 54 }} />

      {/* Header */}
      <div style={{ padding: "8px 20px 12px" }}>
        <div className="display-l" style={{ marginBottom: 2 }}>Øvelser</div>
        <div style={{ fontSize: 13, color: "var(--fg-2)", fontWeight: 500 }}>
          {exercises.length} øvelser
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
              onClick={() => router.push(`/exercises/${ex.id}`)}
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
              <div style={{
                fontSize: 10, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase",
                padding: "3px 7px", borderRadius: 6,
                background: "var(--ai-accent-soft)", color: "var(--ai-accent)",
                flexShrink: 0,
              }}>
                {ex.primary}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Opprett (tabs)/exercises/page.tsx**

Opprett `/Users/trymvestengen/Desktop/ai-coach/web/src/app/(tabs)/exercises/page.tsx`:

```tsx
import ExerciseLibrary from "@/components/exercises/ExerciseLibrary"

export default function ExercisesPage() {
  return <ExerciseLibrary />
}
```

- [ ] **Step 3: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npx tsc --noEmit
```

Forventet: ingen feil.

- [ ] **Step 4: Commit**

```bash
git -C /Users/trymvestengen/Desktop/ai-coach add web/src/components/exercises/ExerciseLibrary.tsx "web/src/app/(tabs)/exercises/page.tsx"
git -C /Users/trymvestengen/Desktop/ai-coach commit -m "feat: add ExerciseLibrary with search and muscle group filter"
```

---

### Task 4: Koble ProgramScreen til øvelseruter

**Files:**
- Modify: `web/src/components/program/ProgramScreen.tsx`
- Modify: `web/src/components/layout/BottomNav.tsx`

- [ ] **Step 1: Legg til DumbbellIcon-lenke til øvelsebiblioteket i BottomNav**

Nei — vi legger ikke øvelser i BottomNav (for mange tabs). I stedet legger vi en "Se alle øvelser"-knapp nederst i ProgramScreen.

Åpne `/Users/trymvestengen/Desktop/ai-coach/web/src/components/program/ProgramScreen.tsx`.

1. Legg til import av `useRouter`:
```tsx
import { useState } from "react"
import { useRouter } from "next/navigation"
```

2. Legg til `useRouter()` øverst i `ProgramScreen`:
```tsx
export default function ProgramScreen() {
  const router = useRouter()
  const [exercises] = useState<Exercise[]>(INITIAL_EXERCISES)
```

3. Gjør `ExerciseRow` klikkbar — endre `ExerciseRow`-komponenten til å ta en `onClick` prop. Finn denne delen i komponenten:

```tsx
function ExerciseRow({ ex, isLast }: { ex: Exercise; isLast: boolean }) {
```

Endre til:

```tsx
function ExerciseRow({ ex, isLast, onClick }: { ex: Exercise; isLast: boolean; onClick: () => void }) {
```

Og endre den første `<div>` inne i ExerciseRow (øvelsesnavn/detalj-div) til en `<button>`:

Finn:
```tsx
      <div style={{ flex: 1, minWidth: 0, padding: "6px 0", cursor: "pointer" }}>
```

Endre til:
```tsx
      <button onClick={onClick} style={{ flex: 1, minWidth: 0, padding: "6px 0", cursor: "pointer", background: "none", border: "none", color: "inherit", textAlign: "left" }}>
```

Og lukk med `</button>` i stedet for `</div>` for den blokken (name + tnum-div).

4. I `ProgramScreen`, oppdater exercise-map til å sende `onClick`:

Finn:
```tsx
            {exercises.map((ex, i) => (
              <ExerciseRow key={ex.id} ex={ex} isLast={i === exercises.length - 1} />
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
              />
            ))}
```

5. Legg til "Se øvelsebiblioteket"-knapp etter exercise-card `.card`-div (men fortsatt innenfor scroll-area). Legg til etter den avsluttende `</div>` for exercise-list padding-div:

```tsx
        {/* Link to exercise library */}
        <div style={{ padding: "12px 0 0" }}>
          <button
            onClick={() => router.push("/exercises")}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 16,
              background: "var(--bg-2)", border: "1px solid var(--border-1)",
              color: "var(--fg-2)", fontSize: 13, fontWeight: 600,
              cursor: "pointer", letterSpacing: "-0.005em",
            }}
          >
            Se øvelsebiblioteket →
          </button>
        </div>
```

- [ ] **Step 2: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npx tsc --noEmit
```

Forventet: ingen feil. Merk: `exercise.id` i ProgramScreen matcher kanskje ikke øvelse-IDer i exercises.ts — det er greit for nå (ruten eksisterer men 404 hvis ID ikke finnes). Vi bruker samme ID-nøkler for INITIAL_EXERCISES i neste step.

- [ ] **Step 3: Oppdater INITIAL_EXERCISES i ProgramScreen til å bruke rette IDer**

I `ProgramScreen.tsx`, oppdater `INITIAL_EXERCISES` til å bruke IDer som matcher `exercises.ts`. Endre id-felter:

```tsx
const INITIAL_EXERCISES: Exercise[] = [
  { id: "incline-db-press",      name: "Incline DB Press",      sets: 4, targetReps: "8-10", targetWeight: 22.5, rpe: 8,
    setLog: [{ r: 10, w: 20 }, { r: 9, w: 22.5 }, { r: 8, w: 22.5 }, { r: null, w: null }] },
  { id: "chest-supported-row",   name: "Chest-supported Row",   sets: 4, targetReps: "10",   targetWeight: 18,   rpe: 7,
    setLog: [{ r: null, w: null }, { r: null, w: null }, { r: null, w: null }, { r: null, w: null }] },
  { id: "overhead-press",        name: "Seated Shoulder Press", sets: 3, targetReps: "10-12",targetWeight: 14,   rpe: 7,
    setLog: [{ r: null, w: null }, { r: null, w: null }, { r: null, w: null }] },
  { id: "lat-pulldown",          name: "Lat Pulldown",          sets: 3, targetReps: "12",   targetWeight: 45,   rpe: 8,
    setLog: [{ r: null, w: null }, { r: null, w: null }, { r: null, w: null }] },
  { id: "cable-fly",             name: "Cable Fly",             sets: 3, targetReps: "12-15",targetWeight: 12,   rpe: 7,
    setLog: [{ r: null, w: null }, { r: null, w: null }, { r: null, w: null }] },
  { id: "face-pull",             name: "Face Pull",             sets: 3, targetReps: "15",   targetWeight: 10,   rpe: 6,
    setLog: [{ r: null, w: null }, { r: null, w: null }, { r: null, w: null }] },
]
```

- [ ] **Step 4: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npx tsc --noEmit
```

Forventet: ingen feil.

- [ ] **Step 5: Commit**

```bash
git -C /Users/trymvestengen/Desktop/ai-coach add web/src/components/program/ProgramScreen.tsx
git -C /Users/trymvestengen/Desktop/ai-coach commit -m "feat: wire ProgramScreen exercises to /exercises/[id] routes"
```
