"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  type WorkoutDetail,
  type PreviousSets,
  type ProgramFolder,
  logSet,
  unlogSet,
  addSet,
  deleteSet,
  updateSet,
  completeWorkout,
  discardWorkout,
  getPreviousSets,
} from "@/lib/api"

interface Props {
  workout: WorkoutDetail
  folders: ProgramFolder[]
  /** Called after the workout is finished or discarded, so the parent can swap views. */
  onExit?: () => void
}

interface SetState {
  id: string
  set_number: number
  reps: number
  weight_kg: number | null
  done: boolean
}

const DEFAULT_REST_SEC = 90

function fmtDate(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("no-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function elapsedString(startedIso: string | null, now: number): string {
  if (!startedIso) return "0:00"
  const start = new Date(startedIso).getTime()
  const sec = Math.max(0, Math.floor((now - start) / 1000))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function WorkoutRun({ workout, onExit }: Props) {
  const router = useRouter()
  const [previous, setPrevious] = useState<PreviousSets>({})
  const [now, setNow] = useState(() => Date.now())
  const [finishOpen, setFinishOpen] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [done, setDone] = useState(false)
  const [rpe, setRpe] = useState<number | null>(null)
  const [finishNotes, setFinishNotes] = useState("")
  const [restEnd, setRestEnd] = useState<number | null>(null)

  // Build initial per-exercise set state from program template + already-logged sets
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

  useEffect(() => {
    getPreviousSets(workout.workout_id)
      .then(setPrevious)
      .catch(() => setPrevious({}))
  }, [workout.workout_id])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const updateSetLocal = (exId: string, setNumber: number, patch: Partial<SetState>) => {
    setSetsByExercise((prev) => ({
      ...prev,
      [exId]: prev[exId].map((s) => (s.set_number === setNumber ? { ...s, ...patch } : s)),
    }))
  }

  const toggleDone = async (ex: WorkoutDetail["exercises"][number], set: SetState) => {
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
        const t = Date.now()
        setRestEnd(t + DEFAULT_REST_SEC * 1000)
      } else {
        await unlogSet(workout.workout_id, ex.exercise_id, set.set_number)
      }
    } catch {
      updateSetLocal(ex.id, set.set_number, { done: !newDone })
    }
  }

  // We persist edits to program_exercise_sets so reload restores them.
  // updateSet signature takes (programId, dayId, exerciseId, setId, body) — but
  // the live workout doesn't know programId. We rely on the fact that the
  // PATCH /programs/{pid}/days/{did}/exercises/{exid}/sets/{sid} endpoint
  // validates ownership by user; passing empty strings would fail the URL.
  // So we use a separate per-workout update that just stages reps/weight via logSet.
  // For now skip planned-set updates; the user can edit values in program detail.

  const handleAddSet = async (ex: WorkoutDetail["exercises"][number]) => {
    const currentSets = setsByExercise[ex.id] ?? []
    const last = currentSets[currentSets.length - 1]
    // Optimistic: append a temp set, then refresh via reload on next user action.
    // eslint-disable-next-line react-hooks/purity
    const tempId = `tmp-${ex.id}-${Date.now()}`
    setSetsByExercise((prev) => ({
      ...prev,
      [ex.id]: [
        ...prev[ex.id],
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

  const handleFinish = async () => {
    setFinishing(true)
    try {
      await completeWorkout(workout.workout_id, {
        rpe: rpe ?? undefined,
        notes: finishNotes.trim() || undefined,
      })
      setDone(true)
    } catch {
      alert("Kunne ikke fullføre. Prøv igjen.")
      setFinishing(false)
    }
  }

  const handleDiscard = async () => {
    if (!confirm("Forkast denne økten? Loggede sett blir slettet.")) return
    try {
      await discardWorkout(workout.workout_id)
      if (onExit) onExit()
      else router.push("/home")
    } catch {
      alert("Kunne ikke forkaste.")
    }
  }

  // Suppress unused-warning for imports kept for future use
  void unlogSet
  void addSet
  void deleteSet
  void updateSet

  // Stats for finish sheet
  const allLogged = Object.values(setsByExercise)
    .flat()
    .filter((s) => s.done)
  const totalSets = allLogged.length
  const totalVolume = allLogged.reduce((sum, s) => sum + s.reps * (s.weight_kg ?? 0), 0)
  const uniqueEx = new Set(
    workout.exercises
      .filter((ex) => (setsByExercise[ex.id] ?? []).some((s) => s.done))
      .map((ex) => ex.exercise_id)
  ).size
  const durationMin = workout.started_at
    ? Math.max(1, Math.round((now - new Date(workout.started_at).getTime()) / 60000))
    : 0

  const restRemaining = restEnd ? Math.max(0, Math.ceil((restEnd - now) / 1000)) : 0
  const showRest = restEnd !== null && restEnd > now - 5000
  const restMm = Math.floor(restRemaining / 60)
  const restSs = restRemaining % 60

  return (
    <div
      style={{
        background: "#1a1a1a",
        minHeight: "100%",
        color: "white",
        padding: "16px 18px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 22,
        }}
      >
        <button
          type="button"
          onClick={handleDiscard}
          aria-label="Forkast økt"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: "rgba(255,255,255,0.08)",
            border: "none",
            color: "rgba(255,255,255,0.7)",
            cursor: "pointer",
            fontSize: 18,
          }}
        >
          ✕
        </button>
        <button
          type="button"
          onClick={() => setFinishOpen(true)}
          style={{
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: 999,
            padding: "10px 22px",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Finish
        </button>
      </div>

      <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", margin: "8px 0 12px" }}>
        {workout.day_name ?? "Økt"}
      </h1>
      <div
        style={{
          display: "flex",
          gap: 14,
          fontSize: 13,
          color: "rgba(255,255,255,0.55)",
          marginBottom: 26,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span aria-hidden>📅</span>
          <span>{fmtDate(workout.started_at)}</span>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span aria-hidden>⏱</span>
          <span className="tnum">{elapsedString(workout.started_at, now)}</span>
        </span>
      </div>

      {workout.exercises.length === 0 && (
        <div
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.5)",
            marginTop: 40,
            fontSize: 14,
          }}
        >
          Denne dagen har ingen øvelser ennå.
        </div>
      )}
      {workout.exercises.map((ex) => {
        const sets = setsByExercise[ex.id] ?? []
        const prev = previous[ex.exercise_id] ?? []
        const exDone = sets.length > 0 && sets.every((s) => s.done)
        return (
          <div key={ex.id} style={{ marginBottom: 30 }}>
            <h2
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: exDone ? "#16a34a" : "var(--brand-orange)",
                margin: "0 0 12px",
                letterSpacing: "-0.01em",
              }}
            >
              {ex.name}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr 70px 70px 32px",
                gap: 8,
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(255,255,255,0.45)",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 8,
                padding: "0 2px",
              }}
            >
              <div>Set</div>
              <div>Previous</div>
              <div style={{ textAlign: "center" }}>kg</div>
              <div style={{ textAlign: "center" }}>Reps</div>
              <div />
            </div>

            {sets.map((set) => {
              const prevSet = prev.find((p) => p.set_number === set.set_number)
              return (
                <div
                  key={set.set_number}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1fr 70px 70px 32px",
                    gap: 8,
                    alignItems: "center",
                    padding: "6px 2px",
                    background: set.done ? "rgba(22,163,74,0.18)" : "transparent",
                    borderRadius: 8,
                    marginBottom: 2,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.08)",
                      color: "var(--brand-orange)",
                      fontSize: 14,
                      fontWeight: 800,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {set.set_number}
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                    {prevSet ? `${prevSet.weight_kg ?? "—"} kg × ${prevSet.reps}` : "—"}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step={0.5}
                    value={set.weight_kg ?? ""}
                    placeholder="—"
                    onChange={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value)
                      updateSetLocal(ex.id, set.set_number, { weight_kg: v })
                    }}
                    style={inputDarkStyle}
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={set.reps}
                    onChange={(e) => {
                      const v = Math.max(1, Number(e.target.value) || 1)
                      updateSetLocal(ex.id, set.set_number, { reps: v })
                    }}
                    style={inputDarkStyle}
                  />
                  <button
                    type="button"
                    onClick={() => toggleDone(ex, set)}
                    aria-label={set.done ? "Fjern fullført" : "Marker som fullført"}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: set.done ? "#16a34a" : "rgba(255,255,255,0.08)",
                      color: "white",
                      border: "none",
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    ✓
                  </button>
                </div>
              )
            })}

            <button
              type="button"
              onClick={() => handleAddSet(ex)}
              style={{
                width: "100%",
                marginTop: 8,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.85)",
                fontSize: 13,
                fontWeight: 600,
                padding: "10px 0",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              + Add Set ({Math.floor(DEFAULT_REST_SEC / 60)}:
              {(DEFAULT_REST_SEC % 60).toString().padStart(2, "0")})
            </button>
          </div>
        )
      })}

      {showRest && (
        <button
          type="button"
          onClick={() => setRestEnd(null)}
          style={{
            position: "fixed",
            left: "50%",
            bottom: 80,
            transform: "translateX(-50%)",
            background: restRemaining === 0 ? "#16a34a" : "rgba(0,0,0,0.85)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 999,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
            animation: restRemaining === 0 ? "restPulse 0.9s ease-in-out infinite" : undefined,
            zIndex: 50,
          }}
        >
          <span aria-hidden>⏱</span>
          <span className="tnum">
            {restRemaining === 0 ? "Ferdig!" : `${restMm}:${restSs.toString().padStart(2, "0")}`}
          </span>
          <span style={{ fontSize: 10, opacity: 0.6 }}>skip</span>
        </button>
      )}

      {finishOpen && (
        <div
          onClick={
            done
              ? () => router.push(`/historikk/${workout.workout_id}`)
              : () => setFinishOpen(false)
          }
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 480,
              background: "#1a1a1a",
              borderRadius: "20px 20px 0 0",
              padding: "14px 20px 28px",
              color: "white",
            }}
          >
            <div
              style={{
                width: 32,
                height: 4,
                background: "rgba(255,255,255,0.2)",
                borderRadius: 99,
                margin: "0 auto 14px",
              }}
            />
            {done ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48 }}>🔥</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: "6px 0" }}>Godt jobba!</h2>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>
                  {workout.day_name ?? "Økten"} fullført
                </p>
                <StatsRow
                  totalSets={totalSets}
                  uniqueEx={uniqueEx}
                  totalVolume={totalVolume}
                  durationMin={durationMin}
                />
                <button
                  type="button"
                  onClick={() => router.push(`/historikk/${workout.workout_id}`)}
                  style={{
                    width: "100%",
                    marginTop: 20,
                    background: "var(--brand-orange)",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    padding: "14px 0",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Se sammendrag
                </button>
              </div>
            ) : (
              <>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    margin: "2px 0 6px",
                    textAlign: "center",
                  }}
                >
                  Fullfør økt
                </h2>
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.55)",
                    textAlign: "center",
                    marginBottom: 14,
                  }}
                >
                  {workout.day_name ?? ""}
                </p>
                <StatsRow
                  totalSets={totalSets}
                  uniqueEx={uniqueEx}
                  totalVolume={totalVolume}
                  durationMin={durationMin}
                />
                <div style={{ marginTop: 18 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.55)",
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
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
                          onClick={() => setRpe(sel ? null : n)}
                          style={{
                            flex: 1,
                            padding: "8px 0",
                            background: sel ? "var(--brand-orange)" : "rgba(255,255,255,0.08)",
                            color: "white",
                            border: "none",
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
                <div style={{ marginTop: 14 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.55)",
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
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
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      color: "white",
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
                    marginTop: 16,
                    background: "#16a34a",
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
                  {finishing ? "Lagrer…" : "✓ Fullfør økt"}
                </button>
                <button
                  type="button"
                  onClick={() => setFinishOpen(false)}
                  style={{
                    width: "100%",
                    marginTop: 8,
                    background: "transparent",
                    color: "rgba(255,255,255,0.6)",
                    border: "none",
                    padding: "8px 0",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Avbryt
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatsRow({
  totalSets,
  uniqueEx,
  totalVolume,
  durationMin,
}: {
  totalSets: number
  uniqueEx: number
  totalVolume: number
  durationMin: number
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 8,
        padding: "14px 0",
        borderTop: "1px solid rgba(255,255,255,0.12)",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <Stat label="Sett" value={String(totalSets)} />
      <Stat label="Øvelser" value={String(uniqueEx)} />
      <Stat
        label="Kg løftet"
        value={totalVolume > 0 ? Math.round(totalVolume).toLocaleString("no-NO") : "—"}
      />
      <Stat label="Min" value={String(durationMin)} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        className="tnum"
        style={{ fontSize: 20, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: 0.5,
          textTransform: "uppercase",
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  )
}

const inputDarkStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  color: "white",
  fontSize: 15,
  fontWeight: 700,
  textAlign: "center",
  padding: "8px 4px",
  outline: "none",
  boxSizing: "border-box",
}
