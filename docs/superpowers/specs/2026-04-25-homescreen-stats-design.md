# HomeScreen Real Data Design

**Goal:** Replace hardcoded stats and coach card in HomeScreen with real data from the API.

**Architecture:** `home/page.tsx` (server component) fetches workouts and active program in parallel alongside the existing profile fetch. Stats are computed server-side and passed as props to the `HomeScreen` client component. No new backend endpoints needed.

**Tech Stack:** Next.js 15 App Router, FastAPI (existing endpoints)

---

## Data Sources

| Data | Source | Endpoint |
|------|--------|----------|
| First name | Already fetched | `GET /api/users/profile` |
| Streak | Computed from workouts | `GET /api/workouts` |
| Workouts this week | Computed from workouts | `GET /api/workouts` |
| Weekly volume (tonnes) | Computed from workouts | `GET /api/workouts` |
| Active program | Direct fetch | `GET /api/programs/active` |

---

## Computed Stats

### Streak
Count consecutive calendar days backwards from today where at least one workout was completed. If today has no completed workout, start counting from yesterday (common fitness app behaviour).

```ts
function calcStreak(workouts: { completed_at: string }[]): number {
  const days = new Set(
    workouts.map(w => w.completed_at.slice(0, 10))
  )
  let streak = 0
  const today = new Date()
  // check from yesterday if today has no workout
  const startOffset = days.has(today.toISOString().slice(0, 10)) ? 0 : 1
  for (let i = startOffset; ; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (days.has(d.toISOString().slice(0, 10))) {
      streak++
    } else {
      break
    }
  }
  return streak
}
```

### Workouts This Week
Count completed workouts where `completed_at` falls within the current ISO week (Monday–Sunday).

### Weekly Volume (tonnes)
Sum of `weight_kg × reps` for all sets belonging to workouts completed this week, divided by 1000.

---

## HomeScreen Props

```ts
interface HomeScreenProps {
  firstName: string
  streak: number
  workoutsThisWeek: number
  weeklyVolumeT: number          // in tonnes, e.g. 8.2
  activeProgram: {
    name: string
    dayCount: number
  } | null
}
```

---

## UI Changes

### Stat tiles (2 tiles, 2 columns)

**Tile 1 — Streak:**
- Label: "Streak"
- Value: `{streak} dager` (or "0 dager" if no workouts)
- Sub: unchanged (currently "4 økt igjen denne uken" — keep as-is for now)

**Tile 2 — Ukentlig:**
- Label: "Ukentlig"
- Value: `{workoutsThisWeek} økter`
- Sub: `{weeklyVolumeT.toFixed(1)} t løftet` (e.g. "8.2 t løftet")

### Coach card

**If active program:**
- Title: `{activeProgram.name}`
- Subtitle: `{activeProgram.dayCount}-dagers program`
- "Start voice session" button — unchanged

**If no active program:**
- Title: "Ingen aktivt program"
- Subtitle: "Gå til Program-fanen for å sette opp et program"
- Button: hidden

---

## Files Changed

| File | Change |
|------|--------|
| `web/src/app/(tabs)/home/page.tsx` | Add parallel fetches for workouts + active program, compute stats, pass as props |
| `web/src/components/home/HomeScreen.tsx` | Accept new props, render real data |

---

## Error Handling

- `GET /api/workouts` fails → pass empty workouts array, stats default to 0
- `GET /api/programs/active` returns 404 → `activeProgram: null`
- `GET /api/programs/active` fails with non-404 → `activeProgram: null` (fail silently, don't crash home page)

---

## Testing (manual)

- User with completed workouts → streak and weekly stats show real numbers
- User with no workouts → streak = 0, workoutsThisWeek = 0, weeklyVolumeT = 0
- User with active program → coach card shows program name and day count
- User with no active program → coach card shows placeholder message, no button
