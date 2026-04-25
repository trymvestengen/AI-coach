# HomeScreen Real Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded stats and coach card in HomeScreen with real data from the API.

**Architecture:** `home/page.tsx` fetches workouts and active program in parallel alongside the existing profile fetch, computes streak and weekly stats server-side, and passes them as typed props to `HomeScreen`. No new backend endpoints needed.

**Tech Stack:** Next.js 15 App Router, TypeScript

---

## File Map

| File | Change |
|------|--------|
| `web/src/app/(tabs)/home/page.tsx` | Add parallel fetches + stat computation |
| `web/src/components/home/HomeScreen.tsx` | Accept new props, render real data |

---

### Task 1: Update home page to fetch and compute stats

**Files:**
- Modify: `web/src/app/(tabs)/home/page.tsx`

The existing `home/page.tsx` already fetches the profile and validates auth. This task adds two more parallel fetches and three helper functions.

Workout shape from `GET /api/workouts` (each item):
```ts
{
  workout_id: string
  date: string          // "YYYY-MM-DD"
  completed_at: string  // ISO timestamp, e.g. "2026-04-24T18:30:00+00:00"
  notes: string | null
  rpe: number | null
  started_at: string | null
  sets: Array<{
    exercise_id: string
    set_number: number
    reps: number | null
    weight_kg: number | null
    rpe: number | null
  }>
}
```

Active program shape from `GET /api/programs/active`:
```ts
{
  id: string
  name: string
  is_active: boolean
  days: Array<{
    id: string
    day_number: number
    name: string
    exercises: Array<{ ... }>
  }>
}
```

- [ ] **Step 1: Write the updated page**

```tsx
// web/src/app/(tabs)/home/page.tsx
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import HomeScreen from "@/components/home/HomeScreen"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface WorkoutSet {
  reps: number | null
  weight_kg: number | null
}

interface Workout {
  completed_at: string
  sets: WorkoutSet[]
}

function calcStreak(workouts: Workout[]): number {
  const days = new Set(workouts.map(w => w.completed_at.slice(0, 10)))
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const startOffset = days.has(todayStr) ? 0 : 1
  let streak = 0
  for (let i = startOffset; ; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const s = d.toISOString().slice(0, 10)
    if (days.has(s)) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function calcWeeklyStats(workouts: Workout[]): { count: number; volumeT: number } {
  const monday = getMonday(new Date())
  const weekWorkouts = workouts.filter(w => new Date(w.completed_at) >= monday)
  const count = weekWorkouts.length
  const volumeKg = weekWorkouts.flatMap(w => w.sets).reduce((sum, s) => {
    if (s.weight_kg && s.reps) return sum + s.weight_kg * s.reps
    return sum
  }, 0)
  return { count, volumeT: volumeKg / 1000 }
}

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const headers = { Authorization: `Bearer ${session.access_token}` }

  const [profileRes, workoutsRes, programRes] = await Promise.all([
    fetch(`${API_BASE}/api/users/profile`,   { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/workouts`,         { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/programs/active`,  { headers, cache: "no-store" }),
  ])

  if (profileRes.status === 404) redirect("/onboarding")
  if (!profileRes.ok) throw new Error(`Failed to load profile: ${profileRes.status}`)

  const profile = await profileRes.json()

  const workouts: Workout[] = workoutsRes.ok ? await workoutsRes.json() : []
  const streak = calcStreak(workouts)
  const { count: workoutsThisWeek, volumeT: weeklyVolumeT } = calcWeeklyStats(workouts)

  const activeProgram = programRes.ok
    ? await programRes.json().then((p: { name: string; days: unknown[] }) => ({
        name: p.name,
        dayCount: p.days.length,
      }))
    : null

  return (
    <HomeScreen
      firstName={profile.first_name}
      streak={streak}
      workoutsThisWeek={workoutsThisWeek}
      weeklyVolumeT={weeklyVolumeT}
      activeProgram={activeProgram}
    />
  )
}
```

- [ ] **Step 2: Check TypeScript**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors from this file.

- [ ] **Step 3: Commit**

```bash
git add "web/src/app/(tabs)/home/page.tsx"
git commit -m "feat: fetch and compute real stats in home page"
```

---

### Task 2: Update HomeScreen to render real data

**Files:**
- Modify: `web/src/components/home/HomeScreen.tsx`

The current `HomeScreen` accepts only `{ firstName: string }`. This task extends the props and replaces the hardcoded stat tiles and coach card with the real data.

Current hardcoded values to replace:
- Line 90: `Push A` → `activeProgram.name`
- Line 92: `5 øvelser · ~52 min · Uke 4 av 8` → `{activeProgram.dayCount}-dagers program`
- Line 120: `12` → `{streak}`
- Line 123: `4 økt igjen denne uken` → remove (no real data for this)
- Lines 127-134: ukentlig volum tile → `{workoutsThisWeek} økter` + `{weeklyVolumeT.toFixed(1)} t løftet`

- [ ] **Step 1: Update the component**

Replace the `export default function HomeScreen` signature and the three sections (coach card, streak tile, ukentlig tile):

```tsx
// Replace the function signature at line 53:
export default function HomeScreen({
  firstName,
  streak,
  workoutsThisWeek,
  weeklyVolumeT,
  activeProgram,
}: {
  firstName: string
  streak: number
  workoutsThisWeek: number
  weeklyVolumeT: number
  activeProgram: { name: string; dayCount: number } | null
}) {
```

Replace the coach card section (lines 70-109) with:

```tsx
        {/* Coach card */}
        <div style={{ padding: "14px 20px 0" }}>
          <div style={{
            background: "linear-gradient(180deg, rgba(255,107,53,0.08), rgba(255,107,53,0.02))",
            border: "1px solid rgba(255,107,53,0.18)",
            borderRadius: 24, padding: 18,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 14, right: 14,
              width: 40, height: 40, borderRadius: 999,
              background: "radial-gradient(circle at 32% 32%, #FFC9A8, var(--ai-accent) 55%, #9A2E10)",
              boxShadow: "0 0 22px rgba(255,107,53,0.45), inset 0 0 6px rgba(255,255,255,0.35)",
            }} />
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: 1,
              textTransform: "uppercase", color: "var(--ai-accent)", marginBottom: 8,
            }}>
              Coach · Klar
            </div>
            {activeProgram ? (
              <>
                <div className="title-l" style={{ marginBottom: 4, paddingRight: 52 }}>{activeProgram.name}</div>
                <div style={{ fontSize: 13, color: "var(--fg-2)", fontWeight: 500, marginBottom: 14 }}>
                  {activeProgram.dayCount}-dagers program
                </div>
                <button
                  onClick={() => router.push("/coach")}
                  style={{
                    width: "100%", height: 52, borderRadius: 16,
                    background: "var(--ai-accent)", color: "var(--primary-foreground)",
                    border: "none", cursor: "pointer",
                    fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    boxShadow: "0 10px 30px -10px var(--ai-accent-glow)",
                  }}
                >
                  <MicIcon size={18} />
                  Start voice session
                </button>
              </>
            ) : (
              <>
                <div className="title-l" style={{ marginBottom: 4, paddingRight: 52 }}>Ingen aktivt program</div>
                <div style={{ fontSize: 13, color: "var(--fg-2)", fontWeight: 500 }}>
                  Gå til Program-fanen for å sette opp et program
                </div>
              </>
            )}
          </div>
        </div>
```

Replace the stat tiles section (lines 111-136) with:

```tsx
        {/* Stat tiles */}
        <div style={{ padding: "12px 20px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "var(--warn)" }}><FlameIcon size={13} /></span>
                <span className="caption">Streak</span>
              </div>
              <div className="metric" style={{ marginTop: 8 }}>
                {streak}<span style={{ fontSize: 15, color: "var(--fg-2)", fontWeight: 500, marginLeft: 4 }}>dager</span>
              </div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div className="caption">Ukentlig</div>
              <div className="metric" style={{ marginTop: 8 }}>
                {workoutsThisWeek}<span style={{ fontSize: 15, color: "var(--fg-2)", fontWeight: 500, marginLeft: 4 }}>økter</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 500, marginTop: 4 }}>
                {weeklyVolumeT.toFixed(1)} t løftet
              </div>
            </div>
          </div>
        </div>
```

- [ ] **Step 2: Check TypeScript**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Verify in browser**

Start dev server if not running:
```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run dev
```

Open `http://localhost:3000`. Verify:
- Stat tiles show real numbers (or 0 if no workouts)
- Coach card shows active program name, or placeholder if none
- No TypeScript/runtime errors in console

- [ ] **Step 4: Commit**

```bash
git add "web/src/components/home/HomeScreen.tsx"
git commit -m "feat: render real stats and active program in HomeScreen"
```
