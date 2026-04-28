# Share Workout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Del" share button to ProgramScreen that opens a preview popup and shares the completed workout to the social feed.

**Architecture:** Two small changes — a `shareWorkout` helper added to `api.ts`, then ProgramScreen gets new state variables, a modified completion handler that snapshots exercise data, a conditional share button in the header, and a preview modal built entirely from local state (no extra API call).

**Tech Stack:** Next.js 15, React client component, existing FastAPI `POST /api/workouts/{id}/share` endpoint

---

## File Structure

| File | Change |
|------|--------|
| `web/src/lib/api.ts` | Add `shareWorkout(workoutId)` function |
| `web/src/components/program/ProgramScreen.tsx` | Add state + share button + preview modal |

---

### Task 1: Add `shareWorkout` to api.ts

**Files:**
- Modify: `web/src/lib/api.ts`

- [ ] **Step 1: Find the correct insertion point**

Run: `tail -n 30 web/src/lib/api.ts`
Expected: see the last few exported functions

- [ ] **Step 2: Add `shareWorkout` after `completeWorkout`**

Add this function to `web/src/lib/api.ts`:

```typescript
export async function shareWorkout(workoutId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workouts/${workoutId}/share`, {
    method: "POST",
    headers: await getAuthHeaders(),
  })
  if (!res.ok && res.status !== 409) throw new Error(`API ${res.status}`)
}
```

Note: 409 (already shared) is treated as success per spec — idempotent.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd web && npx tsc --noEmit 2>&1 | head -20`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/api.ts
git commit -m "feat: add shareWorkout API helper"
```

---

### Task 2: Add share state, button, and modal to ProgramScreen

**Files:**
- Modify: `web/src/components/program/ProgramScreen.tsx`

This task adds everything in one go: imports, state, modified completion handler, share button in header, preview data computation, and the modal JSX.

- [ ] **Step 1: Update imports at the top of ProgramScreen.tsx**

Replace the existing api import line:

```typescript
import { getActiveProgram, startWorkout, logSet, completeWorkout, shareWorkout, type Program, type ProgramDay, type ProgramExercise } from "@/lib/api"
```

Add `ShareIcon` import below the existing component imports:

```typescript
import { ShareIcon } from "@/components/ui/icons"
```

- [ ] **Step 2: Add share-related state variables inside ProgramScreen**

After `const [completing, setCompleting] = useState(false)` (the last existing state variable, around line 295), add:

```typescript
const [completedWorkoutId, setCompletedWorkoutId] = useState<string | null>(null)
const [completedSetLog, setCompletedSetLog] = useState<Record<string, { reps: number; weightKg: number | null; done: boolean }[]>>({})
const [completedExercises, setCompletedExercises] = useState<ProgramExercise[]>([])
const [showSharePreview, setShowSharePreview] = useState(false)
const [workoutShared, setWorkoutShared] = useState(false)
const [sharing, setSharing] = useState(false)
const [shareError, setShareError] = useState<string | null>(null)
```

- [ ] **Step 3: Replace `handleCompleteWorkout` to snapshot exercise data**

Replace the entire existing `handleCompleteWorkout` function (currently lines 357–369):

```typescript
async function handleCompleteWorkout() {
  if (!workoutId || completing) return
  setCompleting(true)
  try {
    await completeWorkout(workoutId)
    setCompletedWorkoutId(workoutId)
    setCompletedSetLog(setLog)
    setCompletedExercises(exercises)
    setWorkoutId(null)
    setSetLog({})
  } catch {
    // workout stays open; user can retry
  } finally {
    setCompleting(false)
  }
}
```

- [ ] **Step 4: Add `handleShare` function after `handleCompleteWorkout`**

```typescript
async function handleShare() {
  if (!completedWorkoutId || sharing) return
  setSharing(true)
  setShareError(null)
  try {
    await shareWorkout(completedWorkoutId)
    setWorkoutShared(true)
    setShowSharePreview(false)
  } catch {
    setShareError("Deling feilet. Prøv igjen.")
  } finally {
    setSharing(false)
  }
}
```

- [ ] **Step 5: Replace the "AKTIV" badge in the header with a conditional share button**

Find this block in the header (around line 417):

```tsx
          <div style={{
            fontSize: 11, color: "var(--ai-accent)", fontWeight: 700, letterSpacing: 0.5,
            padding: "6px 10px", borderRadius: 999, background: "var(--ai-accent-soft)",
            border: "1px solid rgba(255,107,53,0.3)", flexShrink: 0, marginTop: 4,
          }}>
            AKTIV
          </div>
```

Replace it with:

```tsx
          {completedWorkoutId && !workoutShared ? (
            <button
              onClick={() => setShowSharePreview(true)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 11, color: "var(--ai-accent)", fontWeight: 700, letterSpacing: 0.5,
                padding: "6px 10px", borderRadius: 999, background: "var(--ai-accent-soft)",
                border: "1px solid rgba(255,107,53,0.3)", flexShrink: 0, marginTop: 4,
                cursor: "pointer",
              }}
            >
              <ShareIcon size={12} />
              Del
            </button>
          ) : (
            <div style={{
              fontSize: 11, color: "var(--ai-accent)", fontWeight: 700, letterSpacing: 0.5,
              padding: "6px 10px", borderRadius: 999, background: "var(--ai-accent-soft)",
              border: "1px solid rgba(255,107,53,0.3)", flexShrink: 0, marginTop: 4,
            }}>
              AKTIV
            </div>
          )}
```

- [ ] **Step 6: Add preview data computation before the return statement**

Add these computed values just before the `return (` at the bottom of ProgramScreen:

```typescript
// Preview data derived from completed workout snapshot
const previewVolume = completedExercises.reduce((total, ex) => {
  const log = completedSetLog[ex.id] ?? []
  return total + log.reduce((s, set) => s + (set.done ? set.reps * (set.weightKg ?? 0) : 0), 0)
}, 0)

const previewSetCount = completedExercises.reduce((total, ex) => {
  const log = completedSetLog[ex.id] ?? []
  return total + log.filter(s => s.done).length
}, 0)

const previewMuscleGroups = Array.from(
  new Set(completedExercises.flatMap(ex => ex.muscle_groups))
).slice(0, 3)

const previewTopExercises = completedExercises
  .map(ex => {
    const log = completedSetLog[ex.id] ?? []
    const doneSets = log.filter(s => s.done)
    if (doneSets.length === 0) return null
    const bestSet = doneSets.reduce((best, s) =>
      (s.weightKg ?? 0) > (best.weightKg ?? 0) ? s : best
    )
    return { name: ex.name, sets: doneSets.length, reps: bestSet.reps, weightKg: bestSet.weightKg }
  })
  .filter(Boolean)
  .slice(0, 3) as { name: string; sets: number; reps: number; weightKg: number | null }[]
```

- [ ] **Step 7: Add the share preview modal overlay to the JSX**

Add this block just before the final closing `</div>` of `<div className="screen">`:

```tsx
        {/* Share preview modal */}
        {showSharePreview && (
          <div
            onClick={() => setShowSharePreview(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.7)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "var(--bg-1)", borderRadius: "20px 20px 0 0",
                padding: 20, paddingBottom: 36,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--fg-2)", marginBottom: 16 }}>
                Forhåndsvisning
              </div>

              {/* Feed card preview */}
              <div style={{ background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 16, padding: 14, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 999, background: "var(--ai-accent-soft)", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: "var(--ai-accent)" }}>
                    T
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-0)" }}>Deg</div>
                    <div style={{ fontSize: 10, color: "var(--fg-3)" }}>Akkurat nå</div>
                  </div>
                </div>

                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--fg-0)", marginBottom: 6 }}>
                  {previewMuscleGroups.length > 0 ? previewMuscleGroups.join(" · ") : "Økt"}
                </div>

                {previewMuscleGroups.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    {previewMuscleGroups.map(mg => (
                      <span key={mg} style={{ background: "var(--bg-3)", borderRadius: 5, padding: "2px 7px", fontSize: 10, color: "var(--fg-2)" }}>
                        {mg}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--fg-3)", marginBottom: 8 }}>
                  <span>{Math.round(previewVolume).toLocaleString("nb-NO")} kg</span>
                  <span>{previewSetCount} sett</span>
                </div>

                {previewTopExercises.length > 0 && (
                  <div style={{ fontSize: 11, color: "var(--fg-3)", borderTop: "1px solid var(--border-1)", paddingTop: 8 }}>
                    {previewTopExercises.map((ex, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: i < previewTopExercises.length - 1 ? 4 : 0 }}>
                        <span>{ex.name}</span>
                        <span>{ex.sets}×{ex.reps}{ex.weightKg != null ? ` @ ${ex.weightKg} kg` : ""}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {shareError && (
                <div style={{ fontSize: 12, color: "#e55", marginBottom: 10, textAlign: "center" }}>
                  {shareError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  style={{
                    width: "100%", padding: 14, borderRadius: 14,
                    background: "var(--ai-accent)", border: "none",
                    color: "var(--primary-foreground)", fontSize: 14, fontWeight: 700,
                    cursor: sharing ? "default" : "pointer", opacity: sharing ? 0.7 : 1,
                  }}
                >
                  {sharing ? "Deler…" : "Del nå"}
                </button>
                <button
                  onClick={() => setShowSharePreview(false)}
                  style={{
                    width: "100%", padding: 14, borderRadius: 14,
                    background: "transparent", border: "1px solid var(--border-1)",
                    color: "var(--fg-2)", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        )}
```

- [ ] **Step 8: Verify TypeScript compiles**

Run: `cd web && npx tsc --noEmit 2>&1 | head -20`
Expected: no errors

- [ ] **Step 9: Start dev server and test manually**

Run: `cd web && npm run dev`

Manual test checklist:
1. Start a workout, complete all sets, tap "Fullfør økt ✓"
2. Verify "Del" button appears top-right in header (ShareIcon + "Del" text)
3. Tap "Del" → preview bottom sheet slides up
4. Verify preview shows: muscle groups as title, tag chips, volume + set count, top 3 exercises
5. Tap "Avbryt" → modal closes, "Del" button stays visible
6. Tap "Del" again → tap "Del nå" → modal closes, "Del" button disappears (AKTIV returns or nothing)
7. Tap outside modal → modal closes

- [ ] **Step 10: Commit**

```bash
git add web/src/components/program/ProgramScreen.tsx
git commit -m "feat: share workout preview modal in ProgramScreen"
```
