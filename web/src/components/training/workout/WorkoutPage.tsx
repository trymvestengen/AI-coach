"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  type WorkoutDetail,
  type TemplateDetail,
  type TemplateFolder,
  type PreviousSets,
  getPreviousSets,
  logSet,
  startWorkoutFromTemplate,
  updateTemplateExercise,
  addExerciseToTemplate,
  removeExerciseFromTemplate,
} from "@/lib/api"
import { epley1rm, bestE1rm } from "@/lib/oneRepMax"
import ExercisePicker from "@/components/exercises/ExercisePicker"

/* ── Types ────────────────────────────────────────────────── */

export interface Props {
  mode: "planning" | "active"
  template?: TemplateDetail
  workout?: WorkoutDetail
  exerciseNames: Record<string, string>
  folders: TemplateFolder[]
}

interface SetState {
  id: string
  set_number: number
  reps: number
  weight_kg: number | null
  done: boolean
}

const DEFAULT_REST_SEC = 90

function fmtRestTimer(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

/* ── Component ────────────────────────────────────────────── */

export default function WorkoutPage({ mode, template, workout, exerciseNames }: Props) {
  const router = useRouter()
  const tempIdRef = useRef(0)

  /* Active-mode set state */
  const [setsByExercise, setSetsByExercise] = useState<Record<string, SetState[]>>(() => {
    if (mode !== "active" || !workout) return {}
    const initial: Record<string, SetState[]> = {}
    for (const ex of workout.exercises) {
      initial[ex.id] = (ex.sets ?? []).map((s) => {
        const logged = workout.logged_sets.find(
          (ls) => ls.exercise_id === ex.exercise_id && ls.set_number === s.set_number
        )
        return {
          id: s.id,
          set_number: s.set_number,
          reps: logged?.reps ?? s.reps,
          weight_kg: logged?.weight_kg ?? s.weight_kg,
          done: !!logged,
        }
      })
    }
    return initial
  })

  /* Previous sets (active mode) */
  const [previous, setPrevious] = useState<PreviousSets>({})
  useEffect(() => {
    if (mode !== "active" || !workout) return
    let cancelled = false
    getPreviousSets(workout.workout_id)
      .then((d) => {
        if (!cancelled) setPrevious(d)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, workout?.workout_id])

  /* Rest timer */
  const [restEnd, setRestEnd] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  /* PR toast */
  const [prToast, setPrToast] = useState<string | null>(null)

  /* Busy lock for planning mutations */
  const [busy, setBusy] = useState(false)

  /* Exercise picker */
  const [pickerOpen, setPickerOpen] = useState(false)

  /* ── Active helpers ──────────────────────────────────────── */

  const updateSetLocal = (exId: string, setNumber: number, patch: Partial<SetState>) => {
    setSetsByExercise((prev) => ({
      ...prev,
      [exId]: prev[exId].map((s) => (s.set_number === setNumber ? { ...s, ...patch } : s)),
    }))
  }

  const toggleDone = async (
    ex: WorkoutDetail["exercises"][number],
    set: SetState,
    currentPrevious: PreviousSets
  ) => {
    if (!workout) return
    const newDone = !set.done
    updateSetLocal(ex.id, set.set_number, { done: newDone })
    try {
      if (newDone) {
        await logSet(workout.workout_id, {
          exercise_id: ex.exercise_id,
          set_number: set.set_number,
          reps: set.reps,
          weight_kg: set.weight_kg,
        })
        // eslint-disable-next-line react-hooks/purity
        const nowMs = Date.now()
        setRestEnd(nowMs + DEFAULT_REST_SEC * 1000)

        /* PR check */
        const prevSets = currentPrevious[ex.exercise_id] ?? []
        const historicBest = bestE1rm(
          prevSets.map((p) => ({ reps: p.reps, weight_kg: p.weight_kg }))
        )
        const thisBest = epley1rm(set.weight_kg, set.reps)
        if (thisBest > historicBest && thisBest > 0) {
          setPrToast("Ny PR! 💪")
          setTimeout(() => setPrToast(null), 3000)
        }
      }
    } catch {
      updateSetLocal(ex.id, set.set_number, { done: !newDone })
    }
  }

  const handleAddSet = (ex: WorkoutDetail["exercises"][number]) => {
    const currentSets = setsByExercise[ex.id] ?? []
    const last = currentSets[currentSets.length - 1]
    tempIdRef.current += 1
    const tempId = `tmp-${ex.id}-${tempIdRef.current}`
    setSetsByExercise((prev) => ({
      ...prev,
      [ex.id]: [
        ...(prev[ex.id] ?? []),
        {
          id: tempId,
          set_number: (last?.set_number ?? 0) + 1,
          reps: last?.reps ?? 10,
          weight_kg: last?.weight_kg ?? null,
          done: false,
        },
      ],
    }))
  }

  /* ── Planning helpers ────────────────────────────────────── */

  const run = async (fn: () => Promise<void>) => {
    if (busy) return
    setBusy(true)
    try {
      await fn()
      router.refresh()
    } catch {
      alert("Noe gikk galt. Prøv igjen.")
    } finally {
      setBusy(false)
    }
  }

  const handleStart = async () => {
    if (!template) return
    try {
      const res = await startWorkoutFromTemplate(template.id)
      router.push(`/program/workout/${res.workout_id}`)
    } catch {
      alert("Kunne ikke starte økt.")
    }
  }

  /* ── Derived ──────────────────────────────────────────────── */

  const restRemaining = restEnd ? Math.max(0, Math.ceil((restEnd - now) / 1000)) : 0
  const showRest = restEnd !== null && restEnd > now - 5000

  const isPlanning = mode === "planning"
  const title = isPlanning ? (template?.name ?? "Mal") : (workout?.day_name ?? "Økt")

  const exercises = isPlanning
    ? (template?.exercises ?? []).map((ex) => ({
        id: ex.id,
        exercise_id: ex.exercise_id,
        name: exerciseNames[ex.exercise_id] ?? ex.exercise_id,
      }))
    : (workout?.exercises ?? []).map((ex) => ({
        id: ex.id,
        exercise_id: ex.exercise_id,
        name: exerciseNames[ex.exercise_id] ?? ex.name,
      }))

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div
      className="forge"
      style={{
        background: "var(--brand-canvas)",
        minHeight: "100%",
        color: "var(--brand-ink)",
        padding: "16px 18px 32px",
        position: "relative",
      }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isPlanning && (
            <button type="button" aria-label="Forkast økt" style={iconBtnStyle}>
              ✕
            </button>
          )}
        </div>

        {isPlanning ? (
          <button type="button" onClick={handleStart} style={primaryBtnStyle}>
            Start økt
          </button>
        ) : (
          <button type="button" style={primaryBtnStyle}>
            Fullfør
          </button>
        )}
      </div>

      {/* ── Title ───────────────────────────────────────────── */}
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 20px" }}>
        {title}
      </h1>

      {/* ── Exercise list ───────────────────────────────────── */}
      {exercises.map((ex) => {
        if (isPlanning) {
          const templateEx = (template?.exercises ?? []).find((e) => e.id === ex.id)
          const sets = templateEx?.sets ?? []
          const firstReps = sets[0]?.reps ?? null
          const firstWeight = sets[0]?.weight_kg ?? null

          return (
            <div key={ex.id} style={{ marginBottom: 28 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--brand-orange)",
                    margin: 0,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {ex.name}
                </h2>
                <button
                  type="button"
                  aria-label={`Fjern ${ex.name}`}
                  disabled={busy}
                  onClick={() =>
                    run(() => removeExerciseFromTemplate(template!.id, ex.exercise_id))
                  }
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--danger)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: busy ? "default" : "pointer",
                    padding: "4px 0",
                  }}
                >
                  Fjern
                </button>
              </div>

              {/* Column headers — no ✓ in planning */}
              <div style={gridStyle(false)}>
                <div>SETT</div>
                <div>FORRIGE</div>
                <div style={{ textAlign: "center" }}>KG</div>
                <div style={{ textAlign: "center" }}>REPS</div>
              </div>

              {sets.map((set) => (
                <div key={set.id} style={rowStyle(false)}>
                  <div style={setBadge}>{set.set_number}</div>
                  <span style={{ fontSize: 12, color: "var(--brand-muted)" }}>—</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step={0.5}
                    min={0}
                    aria-label={`Vekt for ${ex.name} sett ${set.set_number}`}
                    defaultValue={firstWeight ?? ""}
                    onBlur={(e) => {
                      const raw = e.target.value.trim()
                      const v = raw === "" ? null : parseFloat(raw)
                      if (v !== firstWeight)
                        run(() =>
                          updateTemplateExercise(template!.id, ex.exercise_id, {
                            weight_kg: v,
                          }).then(() => undefined)
                        )
                    }}
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    aria-label={`Reps for ${ex.name} sett ${set.set_number}`}
                    defaultValue={firstReps ?? ""}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value, 10)
                      if (!Number.isNaN(v) && v !== firstReps)
                        run(() =>
                          updateTemplateExercise(template!.id, ex.exercise_id, {
                            reps: v,
                          }).then(() => undefined)
                        )
                    }}
                    style={inputStyle}
                  />
                </div>
              ))}

              {/* +/- sett */}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  aria-label="Færre sett"
                  disabled={busy || sets.length <= 1}
                  onClick={() =>
                    run(() =>
                      updateTemplateExercise(template!.id, ex.exercise_id, {
                        sets: Math.max(1, sets.length - 1),
                      }).then(() => undefined)
                    )
                  }
                  style={stepBtnStyle}
                >
                  −
                </button>
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--brand-muted)",
                    alignSelf: "center",
                    minWidth: 52,
                    textAlign: "center",
                  }}
                >
                  {sets.length} sett
                </span>
                <button
                  type="button"
                  aria-label="Flere sett"
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      updateTemplateExercise(template!.id, ex.exercise_id, {
                        sets: sets.length + 1,
                      }).then(() => undefined)
                    )
                  }
                  style={stepBtnStyle}
                >
                  +
                </button>
              </div>
            </div>
          )
        } else {
          const workoutEx = (workout?.exercises ?? []).find((e) => e.id === ex.id)!
          const sets = setsByExercise[ex.id] ?? []
          const prev = previous[ex.exercise_id] ?? []
          const exDone = sets.length > 0 && sets.every((s) => s.done)

          return (
            <div key={ex.id} style={{ marginBottom: 28 }}>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: exDone ? "var(--success)" : "var(--brand-orange)",
                  margin: "0 0 10px",
                  letterSpacing: "-0.01em",
                }}
              >
                {ex.name}
              </h2>

              {/* Column headers — with ✓ in active */}
              <div style={gridStyle(true)}>
                <div>SETT</div>
                <div>FORRIGE</div>
                <div style={{ textAlign: "center" }}>KG</div>
                <div style={{ textAlign: "center" }}>REPS</div>
                <div />
              </div>

              {sets.map((set) => {
                const prevSet = prev.find((p) => p.set_number === set.set_number)
                return (
                  <div
                    key={set.set_number}
                    style={{
                      ...rowStyle(true),
                      background: set.done
                        ? "color-mix(in srgb, var(--success) 16%, transparent)"
                        : "transparent",
                    }}
                  >
                    <div style={setBadge}>{set.set_number}</div>
                    <span style={{ fontSize: 12, color: "var(--brand-muted)" }}>
                      {prevSet ? `${prevSet.weight_kg ?? "—"} kg × ${prevSet.reps}` : "—"}
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step={0.5}
                      aria-label={`Vekt for ${ex.name} sett ${set.set_number}`}
                      value={set.weight_kg ?? ""}
                      placeholder="—"
                      onChange={(e) => {
                        const v = e.target.value === "" ? null : Number(e.target.value)
                        updateSetLocal(ex.id, set.set_number, { weight_kg: v })
                      }}
                      style={inputStyle}
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      aria-label={`Reps for ${ex.name} sett ${set.set_number}`}
                      value={set.reps}
                      onChange={(e) => {
                        const v = Math.max(1, Number(e.target.value) || 1)
                        updateSetLocal(ex.id, set.set_number, { reps: v })
                      }}
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      aria-label={set.done ? "Fjern fullført" : "Marker som fullført"}
                      onClick={() => toggleDone(workoutEx, set, previous)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: set.done ? "var(--success)" : "var(--brand-subtle)",
                        color: set.done ? "white" : "var(--brand-muted)",
                        border: set.done ? "none" : "1px solid var(--brand-border)",
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      ✓
                    </button>
                  </div>
                )
              })}

              <button type="button" onClick={() => handleAddSet(workoutEx)} style={addSetBtnStyle}>
                + Legg til sett
              </button>
            </div>
          )
        }
      })}

      {/* ── Add exercise (planning) ──────────────────────────── */}
      {isPlanning && (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          style={{
            width: "100%",
            background: "none",
            border: "1px dashed var(--brand-border)",
            borderRadius: 12,
            padding: 14,
            fontSize: 13,
            fontWeight: 700,
            color: "var(--brand-orange)",
            cursor: "pointer",
            marginBottom: 20,
            letterSpacing: 0.5,
          }}
        >
          + Legg til øvelse
        </button>
      )}

      {/* ── Exercise picker (planning) ────────────────────────── */}
      <ExercisePicker
        open={pickerOpen}
        excludeIds={template?.exercises.map((e) => e.exercise_id) ?? []}
        onClose={() => setPickerOpen(false)}
        onConfirm={(ids) => {
          setPickerOpen(false)
          run(async () => {
            for (const id of ids) {
              await addExerciseToTemplate(template!.id, { exercise_id: id })
            }
          })
        }}
      />

      {/* ── Rest timer pill ──────────────────────────────────── */}
      {showRest && (
        <button
          type="button"
          aria-label="Avbryt hviletimer"
          onClick={() => setRestEnd(null)}
          style={{
            position: "absolute",
            left: "50%",
            bottom: 88,
            transform: "translateX(-50%)",
            background: restRemaining === 0 ? "var(--success)" : "rgba(0,0,0,0.85)",
            color: "white",
            border: "1px solid var(--brand-border)",
            borderRadius: 999,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
            zIndex: 50,
          }}
        >
          <span aria-hidden>⏱</span>
          <span className="tnum">
            {restRemaining === 0 ? "Ferdig!" : fmtRestTimer(restRemaining)}
          </span>
          <span style={{ fontSize: 10, opacity: 0.6 }}>skip</span>
        </button>
      )}

      {/* ── PR toast ────────────────────────────────────────── */}
      {prToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--brand-orange)",
            color: "white",
            borderRadius: 999,
            padding: "8px 18px",
            fontWeight: 700,
            fontSize: 14,
            zIndex: 60,
            whiteSpace: "nowrap",
          }}
        >
          {prToast}
        </div>
      )}
    </div>
  )
}

/* ── Styles ───────────────────────────────────────────────── */

function gridStyle(withCheck: boolean): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: withCheck ? "32px 1fr 70px 70px 32px" : "32px 1fr 70px 70px",
    gap: 8,
    fontSize: 10,
    fontWeight: 700,
    color: "var(--brand-muted)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
    padding: "0 2px",
  }
}

function rowStyle(withCheck: boolean): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: withCheck ? "32px 1fr 70px 70px 32px" : "32px 1fr 70px 70px",
    gap: 8,
    alignItems: "center",
    padding: "6px 2px",
    borderRadius: 8,
    marginBottom: 2,
  }
}

const setBadge: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  background: "var(--brand-subtle)",
  color: "var(--brand-orange)",
  fontSize: 13,
  fontWeight: 800,
  display: "grid",
  placeItems: "center",
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--brand-subtle)",
  border: "1px solid var(--brand-border)",
  borderRadius: 8,
  color: "var(--brand-ink)",
  fontSize: 15,
  fontWeight: 700,
  textAlign: "center",
  padding: "8px 4px",
  outline: "none",
  boxSizing: "border-box",
}

const iconBtnStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 999,
  background: "var(--brand-subtle)",
  border: "none",
  color: "var(--brand-muted)",
  cursor: "pointer",
  fontSize: 18,
  display: "grid",
  placeItems: "center",
}

const primaryBtnStyle: React.CSSProperties = {
  background: "var(--brand-orange)",
  color: "white",
  border: "none",
  borderRadius: 999,
  padding: "10px 22px",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
}

const stepBtnStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: "1px solid var(--brand-border)",
  background: "var(--brand-subtle)",
  color: "var(--brand-ink)",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
}

const addSetBtnStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 8,
  background: "var(--brand-subtle)",
  border: "1px solid var(--brand-border)",
  color: "var(--brand-muted)",
  fontSize: 13,
  fontWeight: 600,
  padding: "10px 0",
  borderRadius: 10,
  cursor: "pointer",
}
