# Share Workout Design

**Goal:** Let users share a completed workout to the social feed directly from the program screen.

**Architecture:** A "Del" share button appears in the top-right of `ProgramScreen` when the active workout is completed (`completed_at` is set) and not yet shared (`shared_at` is null). Tapping it opens a preview popup showing how the post will look in the feed. Confirming calls the existing `POST /api/workouts/{id}/share` endpoint.

**Tech Stack:** Next.js 15, React (client component), existing FastAPI endpoint

---

## User Flow

1. User completes a workout (taps "Fullfør økt" in ProgramScreen)
2. A share icon/button appears in the top-right corner of the screen
3. User taps "Del" → a modal/popup appears with a feed card preview
4. Preview shows exactly how the post will look: name, tags, volume/sets/RPE, top exercises, PR badge if applicable
5. User taps "Del nå" → calls `POST /api/workouts/{id}/share` → button disappears (workout is shared)
6. If user taps "Avbryt" → modal closes, button remains (can share later)

---

## UI

### Share button (top-right in ProgramScreen header)
- Only visible when: `completedWorkoutId !== null && !workoutShared`
- Icon: `ShareIcon` with label "Del"
- After sharing: button hidden (state `workoutShared = true`)

### Preview modal (full-screen overlay or bottom sheet)
- Header: "Forhåndsvisning"
- Feed card preview (read-only, matches FeedCard style from SocialScreen):
  - Avatar + user name + "Akkurat nå"
  - Workout name (top muscle groups joined with " · ")
  - Muscle group tag chips
  - Metrics row: volume kg, set count, RPE
  - Top 3 exercises: `{sets}×{reps} @ {weight_kg} kg`
  - PR badge if any set is a personal record
- "Del nå" button → calls share API
- "Avbryt" button → closes modal

---

## Data

The preview is built from data already in ProgramScreen's local state:
- `completedWorkoutId` — the workout ID to share
- The logged sets (from `loggedSets` state) — used to compute volume, set count, top exercises, tags
- The program day exercises (for exercise names and muscle groups)
- The workout RPE (from completion)

No extra API call needed to build the preview — all data is local.

---

## Files Changed

| File | Change |
|------|--------|
| `web/src/components/program/ProgramScreen.tsx` | Add share button to header, add preview modal, add `workoutShared` state |

The backend endpoint `POST /api/workouts/{id}/share` already exists.

---

## Error Handling

- Share API fails → show brief error message in modal, keep modal open, allow retry
- Already shared (409) → treat as success (idempotent), close modal

---

## State

Two new state variables in ProgramScreen:
- `showSharePreview: boolean` — controls modal visibility
- `workoutShared: boolean` — hides the share button after successful share
