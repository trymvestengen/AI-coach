"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  type WorkoutDetail,
  type TemplateFolder,
  type PreviousSets,
  getPreviousSets,
  logSet,
  unlogSet,
  completeWorkout,
  discardWorkout,
  removeWorkoutExercise,
  swapWorkoutExercise,
} from "@/lib/api"
import { epley1rm, bestE1rm } from "@/lib/oneRepMax"
import TemplateMenuSheet, {
  type TemplateMenuTarget,
} from "@/components/training/detail/TemplateMenuSheet"
import ExercisePicker from "@/components/exercises/ExercisePicker"

/* ── Types ────────────────────────────────────────────────── */

export interface Props {
  workout: WorkoutDetail
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

interface Toast {
  message: string
  variant: "success" | "error"
}

const DEFAULT_REST_SEC = 90

function fmtRestTimer(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

/* ── Component ────────────────────────────────────────────── */

export default function WorkoutPage({ workout, exerciseNames, folders }: Props) {
  const router = useRouter()
  const tempIdRef = useRef(0)

  /* Set state */
  const [setsByExercise, setSetsByExercise] = useState<Record<string, SetState[]>>(() => {
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

  /* Previous sets */
  const [previous, setPrevious] = useState<PreviousSets>({})
  useEffect(() => {
    let cancelled = false
    getPreviousSets(workout.workout_id)
      .then((d) => {
        if (!cancelled) setPrevious(d)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [workout.workout_id])

  /* Rest timer */
  const [restEnd, setRestEnd] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  /* Toast (PR success + errors) */
  const [toast, setToast] = useState<Toast | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (message: string, variant: Toast["variant"] = "success") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, variant })
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }

  /* Finish sheet */
  const [finishOpen, setFinishOpen] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [rpe, setRpe] = useState<number | null>(null)
  const [finishNotes, setFinishNotes] = useState("")

  /* Menu */
  const [menuOpen, setMenuOpen] = useState(false)

  /* Exercise list state */
  const [activeExercises, setActiveExercises] = useState<WorkoutDetail["exercises"]>(
    () => workout.exercises
  )

  /* Add/swap picker state */
  const [activePickerOpen, setActivePickerOpen] = useState(false)
  const [swapTargetId, setSwapTargetId] = useState<string | null>(null)

  /* Discard confirm state (two-step for sessions with logged sets) */
  const [discardState, setDiscardState] = useState<"idle" | "confirming">("idle")

  /* ── Helpers ──────────────────────────────────────────────── */

  const hasLoggedSets = Object.values(setsByExercise).some((sets) => sets.some((s) => s.done))

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

        /* PR check — include sets already done this session */
        const prevSets = currentPrevious[ex.exercise_id] ?? []
        const currentDone = (setsByExercise[ex.id] ?? [])
          .filter((s) => s.done && s.set_number !== set.set_number)
          .map((s) => ({ reps: s.reps, weight_kg: s.weight_kg }))
        const comparisonSets = [
          ...prevSets.map((p) => ({ reps: p.reps, weight_kg: p.weight_kg })),
          ...currentDone,
        ]
        const historicBest = bestE1rm(comparisonSets)
        const thisBest = epley1rm(set.weight_kg, set.reps)
        if (thisBest > historicBest && thisBest > 0) {
          showToast("Ny PR! 💪", "success")
        }
      } else {
        await unlogSet(workout.workout_id, ex.exercise_id, set.set_number)
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

  const handleRemoveSet = async (ex: WorkoutDetail["exercises"][number], set: SetState) => {
    if (set.done) {
      try {
        await unlogSet(workout.workout_id, ex.exercise_id, set.set_number)
      } catch {
        return // keep the row on failure
      }
    }
    setSetsByExercise((prev) => ({
      ...prev,
      [ex.id]: (prev[ex.id] ?? []).filter((s) => s.set_number !== set.set_number),
    }))
  }

  const handleFinish = async () => {
    setFinishing(true)
    try {
      await completeWorkout(workout.workout_id, {
        rpe: rpe ?? undefined,
        notes: finishNotes.trim() || undefined,
      })
      router.push(`/historikk/${workout.workout_id}`)
    } catch {
      showToast("Kunne ikke fullføre. Prøv igjen.", "error")
      setFinishing(false)
    }
  }

  /* ✕ exit: discard immediately if no sets logged, two-step otherwise */
  const handleDiscardClick = () => {
    if (!hasLoggedSets) {
      handleDiscardConfirm()
      return
    }
    if (discardState === "idle") {
      setDiscardState("confirming")
      return
    }
    handleDiscardConfirm()
  }

  const handleDiscardConfirm = async () => {
    setDiscardState("idle")
    try {
      await discardWorkout(workout.workout_id)
      router.push("/program")
    } catch {
      showToast("Kunne ikke forkaste.", "error")
    }
  }

  const handleDiscardCancel = () => {
    setDiscardState("idle")
  }

  /* ── Derived ──────────────────────────────────────────────── */

  const restRemaining = restEnd ? Math.max(0, Math.ceil((restEnd - now) / 1000)) : 0
  const showRest = restEnd !== null && restEnd > now - 5000

  const menuTarget: TemplateMenuTarget | null =
    menuOpen && workout.template_id
      ? {
          id: workout.template_id,
          name: workout.day_name ?? "",
          folder_id: null,
          scheduled_days: [],
        }
      : null

  const title = workout.day_name ?? "Økt"

  const exercises = activeExercises.map((ex) => ({
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
        padding: "16px 16px 32px",
        position: "relative",
      }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="wkt-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {discardState === "idle" ? (
            <button
              type="button"
              aria-label="Forkast økt"
              onClick={handleDiscardClick}
              className="wkt-icon-btn"
            >
              ✕
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                aria-label="Bekreft forkast"
                onClick={handleDiscardClick}
                style={{
                  height: 40,
                  background: "var(--danger)",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "0 14px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Forkast?
              </button>
              <button
                type="button"
                aria-label="Avbryt forkast"
                onClick={handleDiscardCancel}
                style={{
                  height: 40,
                  background: "var(--brand-subtle)",
                  color: "var(--brand-muted)",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "0 12px",
                  borderRadius: 999,
                  border: "1px solid var(--brand-border)",
                  cursor: "pointer",
                }}
              >
                Avbryt
              </button>
            </div>
          )}
          {workout.template_id && (
            <button
              type="button"
              aria-label="Mal-valg"
              onClick={() => setMenuOpen(true)}
              className="wkt-icon-btn"
            >
              ⋯
            </button>
          )}
        </div>

        <button type="button" onClick={() => setFinishOpen(true)} className="wkt-finish-btn">
          Fullfør
        </button>
      </div>

      {/* ── Title ───────────────────────────────────────────── */}
      <h1 className="wkt-title" style={{ fontSize: 26, margin: "0 0 18px" }}>
        {title}
      </h1>

      {/* ── Empty state ─────────────────────────────────────── */}
      {exercises.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            color: "var(--brand-muted)",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏋️</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Ingen øvelser enda</div>
          <div style={{ fontSize: 13 }}>
            Bruk &quot;+ Legg til øvelse&quot; nedenfor for å legge til en øvelse.
          </div>
        </div>
      )}

      {/* ── Exercise list ───────────────────────────────────── */}
      {exercises.map((ex, exIdx) => {
        const workoutEx = activeExercises.find((e) => e.id === ex.id)!
        const sets = setsByExercise[ex.id] ?? []
        const prev = previous[ex.exercise_id] ?? []
        const exDone = sets.length > 0 && sets.every((s) => s.done)
        const doneSets = sets.filter((s) => s.done).length
        const isFirstIncomplete =
          !exDone &&
          exIdx ===
            exercises.findIndex((e) => {
              const eSets = setsByExercise[e.id] ?? []
              return !(eSets.length > 0 && eSets.every((s) => s.done))
            })

        return (
          <div
            key={ex.id}
            className={`wkt-exercise-card${isFirstIncomplete ? " wkt-active-card" : ""}`}
          >
            {/* Exercise header */}
            <div className="wkt-exercise-header">
              <div className={`wkt-exercise-num${isFirstIncomplete ? "" : " wkt-num-inactive"}`}>
                {exIdx + 1}
              </div>
              <h2 className="wkt-exercise-name">{ex.name}</h2>
              {/* Sets progress badge */}
              <span className={`wkt-sets-badge${doneSets === 0 ? " wkt-badge-inactive" : ""}`}>
                {doneSets}/{sets.length}
              </span>
              <div style={{ display: "flex", gap: 4, marginLeft: 6 }}>
                <button
                  type="button"
                  aria-label={`Bytt ${ex.name}`}
                  onClick={() => setSwapTargetId(ex.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--brand-muted)",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: "0 4px",
                    minHeight: 44,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  Bytt
                </button>
                <button
                  type="button"
                  aria-label={`Fjern ${ex.name}`}
                  onClick={async () => {
                    setActiveExercises((prev) => prev.filter((e) => e.id !== ex.id))
                    try {
                      if (!ex.id.startsWith("tmp-")) {
                        await removeWorkoutExercise(workout.workout_id, ex.exercise_id)
                      }
                    } catch {
                      setActiveExercises((prev) => [...prev, workoutEx])
                    }
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--danger)",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: "0 4px",
                    minHeight: 44,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  Fjern
                </button>
              </div>
            </div>

            {/* Column headers — tight inline table */}
            <div className="wkt-col-header">
              <span className="wkt-col-h" style={{ width: 24 }}>
                SETT
              </span>
              <span className="wkt-col-h" style={{ flex: 1 }}>
                FORRIGE
              </span>
              <span className="wkt-col-h" style={{ width: 110, textAlign: "center" }}>
                KG
              </span>
              <span className="wkt-col-h" style={{ width: 44, textAlign: "center" }}>
                REPS
              </span>
              <span className="wkt-col-h" style={{ width: 44 }} />
              <span className="wkt-col-h" style={{ width: 44 }} />
            </div>

            {sets.map((set) => {
              const prevSet = prev.find((p) => p.set_number === set.set_number)
              const isCurrentSet = !set.done && isFirstIncomplete
              return (
                <div
                  key={set.set_number}
                  className={`wkt-set-row${set.done ? " wkt-set-done" : isCurrentSet ? " wkt-set-current" : ""}`}
                >
                  {/* Set number */}
                  <span
                    className={`wkt-c-set${set.done ? " wkt-num-done" : isCurrentSet ? " wkt-num-current" : ""}`}
                  >
                    {set.set_number}
                  </span>

                  {/* Previous */}
                  <span className={`wkt-c-prev${prevSet ? " wkt-has-data" : ""}`}>
                    {prevSet ? `${prevSet.weight_kg ?? "—"} kg × ${prevSet.reps}` : "—"}
                  </span>

                  {/* kg × reps inputs */}
                  <div className="wkt-c-inputs">
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
                      className="wkt-set-input"
                    />
                    <span className="wkt-x-sep">×</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      aria-label={`Reps for ${ex.name} sett ${set.set_number}`}
                      value={set.reps}
                      onChange={(e) => {
                        const v = Math.max(1, Number(e.target.value) || 1)
                        updateSetLocal(ex.id, set.set_number, { reps: v })
                      }}
                      className="wkt-set-input wkt-reps-input"
                    />
                  </div>

                  {/* ✓ check button — min 44×44 tap target */}
                  <div className="wkt-c-check">
                    <button
                      type="button"
                      aria-label={set.done ? "Fjern fullført" : "Marker som fullført"}
                      onClick={() => toggleDone(workoutEx, set, previous)}
                      className={`wkt-check-btn${set.done ? " wkt-checked" : ""}`}
                    >
                      ✓
                    </button>
                  </div>

                  {/* ✕ remove-set button — min 44×44 tap target */}
                  <button
                    type="button"
                    aria-label={`Fjern sett ${set.set_number}`}
                    onClick={() => handleRemoveSet(workoutEx, set)}
                    className="wkt-remove-set-btn"
                  >
                    ✕
                  </button>
                </div>
              )
            })}

            <button
              type="button"
              onClick={() => handleAddSet(workoutEx)}
              className="wkt-add-set-btn"
            >
              <span className="wkt-add-set-icon">+</span>
              <span className="wkt-add-set-label">+ Legg til sett</span>
            </button>
          </div>
        )
      })}

      {/* ── Add exercise ─────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setActivePickerOpen(true)}
        className="wkt-add-exercise-btn"
      >
        <span className="wkt-add-exercise-icon">+</span>+ Legg til øvelse
      </button>

      {/* ── Exercise picker (add) ─────────────────────────────── */}
      <ExercisePicker
        open={activePickerOpen}
        excludeIds={activeExercises.map((e) => e.exercise_id)}
        onClose={() => setActivePickerOpen(false)}
        onConfirm={(ids) => {
          setActivePickerOpen(false)
          for (const exId of ids) {
            tempIdRef.current += 1
            const tempExId = `tmp-ex-${tempIdRef.current}`
            const newEx: WorkoutDetail["exercises"][number] = {
              id: tempExId,
              exercise_id: exId,
              name: exerciseNames[exId] ?? exId,
              muscle_groups: [],
              order_index: activeExercises.length,
              notes: null,
              image_url: null,
              sets: [],
            }
            setActiveExercises((prev) => [...prev, newEx])
            tempIdRef.current += 1
            const tempSetId = `tmp-set-${tempIdRef.current}`
            setSetsByExercise((prev) => ({
              ...prev,
              [tempExId]: [
                {
                  id: tempSetId,
                  set_number: 1,
                  reps: 10,
                  weight_kg: null,
                  done: false,
                },
              ],
            }))
          }
        }}
      />

      {/* ── Exercise picker (swap) ────────────────────────────── */}
      <ExercisePicker
        open={swapTargetId !== null}
        excludeIds={activeExercises.map((e) => e.exercise_id)}
        onClose={() => setSwapTargetId(null)}
        onConfirm={async (ids) => {
          const newExId = ids[0]
          if (!newExId || !swapTargetId) {
            setSwapTargetId(null)
            return
          }
          const oldEx = activeExercises.find((e) => e.id === swapTargetId)
          if (!oldEx) {
            setSwapTargetId(null)
            return
          }
          setActiveExercises((prev) =>
            prev.map((e) =>
              e.id === swapTargetId
                ? { ...e, exercise_id: newExId, name: exerciseNames[newExId] ?? newExId }
                : e
            )
          )
          setSwapTargetId(null)
          try {
            if (!swapTargetId.startsWith("tmp-")) {
              await swapWorkoutExercise(workout.workout_id, oldEx.exercise_id, newExId)
            }
          } catch {
            setActiveExercises((prev) => prev.map((e) => (e.id === swapTargetId ? oldEx : e)))
          }
        }}
      />

      {/* ── Rest timer pill ──────────────────────────────────── */}
      {showRest && (
        <button
          type="button"
          aria-label="Avbryt hviletimer"
          onClick={() => setRestEnd(null)}
          className={`wkt-rest-pill${restRemaining === 0 ? " wkt-rest-done" : ""}`}
        >
          <span className="wkt-rest-dot" aria-hidden />
          <span className="wkt-mono">
            {restRemaining === 0 ? "Ferdig!" : fmtRestTimer(restRemaining)}
          </span>
          <span style={{ fontSize: 10, opacity: 0.5 }}>skip</span>
        </button>
      )}

      {/* ── Toast (PR success + errors) ──────────────────────── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`wkt-toast${toast.variant === "error" ? " wkt-toast-error" : " wkt-toast-success"}`}
          style={{ position: "fixed" }}
        >
          {toast.variant === "success" && <span aria-hidden>🎉</span>}
          {toast.message}
        </div>
      )}

      {/* ── Finish sheet ─────────────────────────────────────── */}
      {finishOpen && (
        <div onClick={() => setFinishOpen(false)} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} className="wkt-finish-sheet">
            <div className="wkt-sheet-handle" />
            <h2 className="wkt-sheet-title">Fullfør økt</h2>

            {/* RPE */}
            <div style={{ marginBottom: 14 }}>
              <div className="wkt-section-heading">
                RPE{" "}
                <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
                  (valgfri)
                </span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                  const sel = rpe === n
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={sel}
                      onClick={() => setRpe(sel ? null : n)}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        background: sel ? "var(--brand-orange)" : "var(--brand-subtle)",
                        color: sel ? "white" : "var(--brand-muted)",
                        border: sel ? "none" : "1px solid var(--brand-border)",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Notater */}
            <div style={{ marginBottom: 16 }}>
              <div className="wkt-section-heading">
                Notater{" "}
                <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
                  (valgfri)
                </span>
              </div>
              <textarea
                value={finishNotes}
                onChange={(e) => setFinishNotes(e.target.value)}
                maxLength={500}
                placeholder="Hvordan gikk det?"
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: 13,
                  background: "var(--brand-subtle)",
                  border: "1px solid var(--brand-border)",
                  borderRadius: 8,
                  color: "var(--brand-ink)",
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                  minHeight: 70,
                  fontFamily: "inherit",
                }}
              />
            </div>

            <button
              type="button"
              disabled={finishing}
              onClick={handleFinish}
              style={{
                width: "100%",
                marginBottom: 8,
                background: "var(--success)",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "14px 0",
                fontSize: 14,
                fontWeight: 700,
                cursor: finishing ? "not-allowed" : "pointer",
                opacity: finishing ? 0.6 : 1,
              }}
            >
              {finishing ? "Lagrer…" : "Fullfør økt"}
            </button>

            <button
              type="button"
              onClick={() => setFinishOpen(false)}
              style={{
                width: "100%",
                background: "transparent",
                color: "var(--brand-muted)",
                border: "none",
                padding: "8px 0",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* ── Template menu ────────────────────────────────────── */}
      <TemplateMenuSheet
        template={menuTarget}
        folders={folders}
        onClose={() => setMenuOpen(false)}
        onChanged={() => {
          setMenuOpen(false)
          router.refresh()
        }}
        onDeleted={() => {
          setMenuOpen(false)
          router.push("/home")
        }}
      />
    </div>
  )
}

/* ── Styles ───────────────────────────────────────────────── */

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 70,
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
}
