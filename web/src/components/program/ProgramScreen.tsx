"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { getActiveProgram, startWorkout, logSet, completeWorkout, shareWorkout, type Program, type ProgramDay, type ProgramExercise } from "@/lib/api"
import RestTimer from "@/components/program/RestTimer"
import { ShareIcon } from "@/components/ui/icons"

/* ── Types ── */
interface WeekDay {
  d: string
  date: number
  exCount: number
  done: boolean
  today: boolean
  programDay: ProgramDay | null
}

const DAY_LABELS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"]

function buildWeekDays(program: Program): WeekDay[] {
  const now = new Date()
  const jsDay = now.getDay() // 0=Sun … 6=Sat
  const todayDayNumber = jsDay === 0 ? 7 : jsDay // 1=Mon … 7=Sun

  // Monday of this week
  const monday = new Date(now)
  monday.setDate(now.getDate() - (jsDay === 0 ? 6 : jsDay - 1))

  return DAY_LABELS.map((d, i) => {
    const dayNumber = i + 1 // 1=Mon … 7=Sun
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const programDay = program.days?.find(pd => pd.day_number === dayNumber) ?? null
    return {
      d,
      date: date.getDate(),
      exCount: programDay?.exercises.length ?? 0,
      done: false,
      today: dayNumber === todayDayNumber,
      programDay,
    }
  })
}

/* ── ProgressBar (uses program week count placeholder) ── */
function ProgressBar() {
  const TOTAL_WEEKS = 12
  const DONE_WEEKS = 3
  const CURRENT_WEEK = 4
  return (
    <div style={{ padding: "0 20px 20px" }}>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: TOTAL_WEEKS }, (_, i) => {
          const done = i < DONE_WEEKS
          const current = i === DONE_WEEKS
          return (
            <div key={i} style={{
              flex: 1, height: 6, borderRadius: 2,
              background: done ? "var(--ai-accent)" : current ? "rgba(255,107,53,0.35)" : "var(--bg-3)",
              border: current ? "1px solid var(--ai-accent)" : "none",
              boxSizing: "border-box",
            }} />
          )
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--fg-2)", fontWeight: 500 }}>
        <span>{DONE_WEEKS} av {TOTAL_WEEKS} uker</span>
        <span>{TOTAL_WEEKS - CURRENT_WEEK + 1} uker igjen</span>
      </div>
    </div>
  )
}

/* ── WeekStrip ── */
function WeekStrip({ days, selectedIndex, onSelect }: {
  days: WeekDay[]
  selectedIndex: number
  onSelect: (i: number) => void
}) {
  return (
    <div style={{ padding: "0 20px 20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {days.map((d, i) => {
          const selected = i === selectedIndex
          return (
            <button key={d.d} onClick={() => onSelect(i)} style={{
              padding: "10px 0 12px", borderRadius: 14,
              background: selected ? "var(--ai-accent)" : d.done ? "var(--bg-3)" : "var(--bg-2)",
              border: `1px solid ${selected ? "var(--ai-accent)" : "var(--border-1)"}`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              opacity: d.exCount === 0 ? 0.5 : 1,
              cursor: d.exCount === 0 ? "default" : "pointer",
            }}>
              <div style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, color: selected ? "var(--primary-foreground)" : "var(--fg-3)" }}>
                {d.d}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: selected ? "var(--primary-foreground)" : "var(--fg-0)" }} className="tnum">
                {d.date}
              </div>
              <div style={{ width: 4, height: 4, borderRadius: 2, background: d.done ? (selected ? "var(--primary-foreground)" : "var(--ai-accent)") : "transparent" }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── ExerciseProgressRing ── */
function ExerciseProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : done / total
  const r = 9
  const circumference = 2 * Math.PI * r
  return (
    <div style={{ position: "relative", width: 26, height: 26, flexShrink: 0 }}>
      <svg width="26" height="26" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx="13" cy="13" r={r} stroke="var(--border-1)" strokeWidth="2" fill="none" />
        <circle cx="13" cy="13" r={r} stroke="var(--ai-accent)" strokeWidth="2" fill="none"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pct)} strokeLinecap="round"
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "var(--fg-2)", fontWeight: 600 }} className="tnum">
        {done}/{total}
      </div>
    </div>
  )
}

/* ── ExerciseRow (read-only) ── */
function ExerciseRow({ ex, isLast, onNavigate, onSwap, doneCount }: {
  ex: ProgramExercise
  isLast: boolean
  onNavigate: () => void
  onSwap: () => void
  doneCount: number
}) {
  const targetReps = ex.sets[0]?.reps ?? "–"
  const targetWeight = ex.sets[0]?.weight_kg != null ? `${ex.sets[0].weight_kg} kg` : "BW"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px 8px 16px", borderBottom: isLast ? "none" : "1px solid var(--border-1)" }}>
      <button onClick={onNavigate} style={{ flex: 1, minWidth: 0, padding: "6px 0", cursor: "pointer", background: "none", border: "none", color: "inherit", textAlign: "left" }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.008em", color: "var(--fg-0)" }}>{ex.name}</div>
        <div className="tnum" style={{ fontSize: 11, color: "var(--fg-2)", fontWeight: 500, marginTop: 2 }}>
          {ex.sets.length}×{targetReps} · {targetWeight}
        </div>
      </button>
      <button onClick={onSwap} aria-label="Swap øvelse" style={{
        flexShrink: 0, padding: "5px 10px", borderRadius: 999,
        fontSize: 11, color: "var(--fg-2)", fontWeight: 600,
        background: "var(--bg-3)", border: "1px solid var(--border-1)",
        display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
      }}>
        <svg width="11" height="11" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" aria-hidden="true">
          <path d="M1 4h8l-2-2M11 8H3l2 2" />
        </svg>
        Swap
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px 6px 4px", flexShrink: 0 }}>
        <ExerciseProgressRing done={doneCount} total={ex.sets.length} />
        <svg width="8" height="12" viewBox="0 0 8 12" stroke="var(--fg-3)" strokeWidth="1.5" fill="none" strokeLinecap="round" aria-hidden="true">
          <path d="M2 1l4 5-4 5" />
        </svg>
      </div>
    </div>
  )
}

/* ── ActiveExerciseRow ── */
function ActiveExerciseRow({ ex, log, isLast, onCheck, onSwap }: {
  ex: ProgramExercise
  log: { reps: number; weightKg: number | null; done: boolean }[]
  isLast: boolean
  onCheck: (setIndex: number, reps: number, weightKg: number | null) => void
  onSwap: () => void
}) {
  const done = log.filter(s => s.done).length
  const [localLog, setLocalLog] = useState(log)

  // TODO(frontend-lint-debt): refactor — same pattern as program/ExerciseDetail.
  // Local edit state synced from props clobbers user input on parent re-render.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setLocalLog(log) }, [log])

  function updateReps(i: number, val: string) {
    const n = parseInt(val, 10)
    if (isNaN(n)) return
    setLocalLog(prev => prev.map((s, idx) => idx === i ? { ...s, reps: n } : s))
  }

  function updateWeight(i: number, val: string) {
    const n = parseFloat(val)
    const kg = isNaN(n) ? null : n
    setLocalLog(prev => prev.map((s, idx) => idx === i ? { ...s, weightKg: kg } : s))
  }

  return (
    <div style={{ borderBottom: isLast ? "none" : "1px solid var(--border-1)" }}>
      {/* Exercise header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 8px 6px 16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-0)" }}>{ex.name}</div>
        </div>
        <button onClick={onSwap} aria-label="Swap øvelse" style={{
          padding: "4px 10px", borderRadius: 999,
          fontSize: 11, color: "var(--fg-2)", fontWeight: 600,
          background: "var(--bg-3)", border: "1px solid var(--border-1)",
          display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
        }}>
          <svg width="11" height="11" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" aria-hidden="true">
            <path d="M1 4h8l-2-2M11 8H3l2 2" />
          </svg>
          Swap
        </button>
        <div style={{ padding: "0 8px" }}>
          <ExerciseProgressRing done={done} total={ex.sets.length} />
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr 40px", gap: 6, padding: "0 16px 4px" }}>
        {["#", "reps", "kg", ""].map((h, i) => (
          <div key={i} style={{ fontSize: 10, color: "var(--fg-3)", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>{h}</div>
        ))}
      </div>

      {/* Set rows */}
      {localLog.map((s, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "28px 1fr 1fr 40px",
          gap: 6, padding: "6px 16px",
          background: s.done ? "rgba(255,107,53,0.06)" : "transparent",
        }}>
          <div className="tnum" style={{ fontSize: 13, color: "var(--fg-3)", display: "flex", alignItems: "center" }}>{i + 1}</div>
          <input
            type="number"
            value={s.reps}
            disabled={s.done}
            onChange={e => updateReps(i, e.target.value)}
            style={{
              background: s.done ? "transparent" : "var(--bg-3)",
              border: s.done ? "none" : "1px solid var(--border-1)",
              borderRadius: 8, padding: "5px 8px",
              color: s.done ? "var(--fg-2)" : "var(--fg-0)",
              fontSize: 13, fontWeight: 600, width: "100%", boxSizing: "border-box",
            }}
          />
          <input
            type="number"
            value={s.weightKg ?? ""}
            disabled={s.done}
            placeholder="BW"
            onChange={e => updateWeight(i, e.target.value)}
            style={{
              background: s.done ? "transparent" : "var(--bg-3)",
              border: s.done ? "none" : "1px solid var(--border-1)",
              borderRadius: 8, padding: "5px 8px",
              color: s.done ? "var(--fg-2)" : "var(--fg-0)",
              fontSize: 13, fontWeight: 600, width: "100%", boxSizing: "border-box",
            }}
          />
          <button
            onClick={() => onCheck(i, localLog[i].reps, localLog[i].weightKg)}
            disabled={s.done}
            aria-label={`Fullfør sett ${i + 1}`}
            style={{
              width: 32, height: 32, borderRadius: 999,
              background: s.done ? "var(--ai-accent)" : "var(--bg-3)",
              border: s.done ? "none" : "1px solid var(--border-1)",
              color: s.done ? "var(--primary-foreground)" : "var(--fg-2)",
              display: "grid", placeItems: "center", cursor: s.done ? "default" : "pointer",
              fontSize: 14,
            }}
          >
            ✓
          </button>
        </div>
      ))}
      <div style={{ height: 8 }} />
    </div>
  )
}

/* ── ProgramScreen ── */
export default function ProgramScreen() {
  const router = useRouter()
  const [program, setProgram] = useState<Program | null>(null)
  const [error, setError] = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [weekDays, setWeekDays] = useState<WeekDay[]>([])
  const [workoutId, setWorkoutId] = useState<string | null>(null)
  const [setLog, setSetLog] = useState<Record<string, { reps: number; weightKg: number | null; done: boolean }[]>>({})
  const [restTimer, setRestTimer] = useState<boolean>(false)
  const [restSeconds, setRestSeconds] = useState<number>(() => {
    if (typeof window === "undefined") return 90
    return parseInt(localStorage.getItem("restTimerSeconds") ?? "90", 10)
  })
  const [starting, setStarting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [completedWorkoutId, setCompletedWorkoutId] = useState<string | null>(null)
  const [completedSetLog, setCompletedSetLog] = useState<Record<string, { reps: number; weightKg: number | null; done: boolean }[]>>({})
  const [completedExercises, setCompletedExercises] = useState<ProgramExercise[]>([])
  const [showSharePreview, setShowSharePreview] = useState(false)
  const [workoutShared, setWorkoutShared] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [workoutExercises, setWorkoutExercises] = useState<ProgramExercise[]>([])

  useEffect(() => {
    getActiveProgram()
      .then(p => {
        const days = buildWeekDays(p)
        setProgram(p)
        setWeekDays(days)
        // default selected: today if it has exercises, else first day with exercises
        const todayIdx = days.findIndex(d => d.today && d.exCount > 0)
        const firstIdx = days.findIndex(d => d.exCount > 0)
        setSelectedDayIndex(todayIdx >= 0 ? todayIdx : firstIdx >= 0 ? firstIdx : 0)
      })
      .catch(() => setError(true))
  }, [])

  // Handle swap result from ExerciseLibrary
  useEffect(() => {
    const raw = sessionStorage.getItem("pendingSwap")
    if (!raw) return
    sessionStorage.removeItem("pendingSwap")
    // Swap is cosmetic-only in read-only mode; full swap persistence is out of scope here
  }, [])

  function handleStartWorkout() {
    if (!selectedDay || starting) return
    setStarting(true)
    startWorkout(selectedDay.id)
      .then(({ workout_id }) => {
        setWorkoutId(workout_id)
        setWorkoutExercises(exercises)
        const log: typeof setLog = {}
        for (const ex of exercises) {
          log[ex.id] = ex.sets.map(s => ({
            reps: s.reps,
            weightKg: s.weight_kg ?? null,
            done: false,
          }))
        }
        setSetLog(log)
      })
      .catch(() => {})
      .finally(() => setStarting(false))
  }

  function handleCheckSet(ex: ProgramExercise, setIndex: number, reps: number, weightKg: number | null) {
    if (!workoutId) return
    const entry = setLog[ex.id]?.[setIndex]
    if (!entry || entry.done) return
    logSet(workoutId, {
      exercise_id: ex.exercise_id,
      set_number: setIndex + 1,
      reps,
      weight_kg: weightKg,
    }).catch(() => {})
    setSetLog(prev => {
      const copy = { ...prev }
      copy[ex.id] = copy[ex.id].map((s, i) => i === setIndex ? { ...s, done: true } : s)
      return copy
    })
    setRestTimer(true)
  }

  async function handleCompleteWorkout() {
    if (!workoutId || completing) return
    setCompleting(true)
    try {
      await completeWorkout(workoutId)
      setCompletedWorkoutId(workoutId)
      setCompletedSetLog(setLog)
      setCompletedExercises(workoutExercises)
      setWorkoutShared(false)
      setWorkoutId(null)
      setSetLog({})
      setWorkoutExercises([])
    } catch {
      // workout stays open; user can retry
    } finally {
      setCompleting(false)
    }
  }

  async function handleShare() {
    if (!completedWorkoutId || sharing) return
    setSharing(true)
    setShareError(null)
    try {
      await shareWorkout(completedWorkoutId)
      setWorkoutShared(true)
      setShowSharePreview(false)
      setCompletedWorkoutId(null)
      setCompletedExercises([])
      setCompletedSetLog({})
    } catch {
      setShareError("Deling feilet. Prøv igjen.")
    } finally {
      setSharing(false)
    }
  }

  function handleChangeRestDefault(s: number) {
    setRestSeconds(s)
    localStorage.setItem("restTimerSeconds", String(s))
  }

  const selectedDay = weekDays[selectedDayIndex]?.programDay ?? null
  const exercises = selectedDay?.exercises ?? []
  const todayLabel = selectedDay
    ? `${DAY_LABELS[selectedDayIndex]} · ${selectedDay.name}`
    : weekDays[selectedDayIndex]?.today ? "Hviledag" : DAY_LABELS[selectedDayIndex]

  // Preview data derived from completed workout snapshot
  // MUST be called before early returns (rules of hooks)
  const { previewVolume, previewSetCount, previewMuscleGroups, previewTopExercises } = useMemo(() => {
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

    return { previewVolume, previewSetCount, previewMuscleGroups, previewTopExercises }
  }, [completedExercises, completedSetLog])

  if (error) {
    return (
      <div className="screen">
        <div style={{ height: 54 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "0 32px" }}>
          <div style={{ fontSize: 32 }}>🏋️</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fg-0)", textAlign: "center" }}>Ingen aktiv plan</div>
          <div style={{ fontSize: 14, color: "var(--fg-2)", textAlign: "center" }}>Start backend-serveren og sørg for at det finnes et aktivt program.</div>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="screen">
        <div style={{ height: 54 }} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 14, color: "var(--fg-3)" }}>Laster program…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div style={{ height: 54 }} />
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>

        {/* Header */}
        <div style={{ padding: "14px 20px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div className="caption" style={{ marginBottom: 6 }}>Aktiv plan</div>
            <div className="display-l">{program.name}</div>
          </div>
          {completedWorkoutId && !workoutShared ? (
            <button
              onClick={() => { setShowSharePreview(true); setShareError(null) }}
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
        </div>

        <ProgressBar />

        <div style={{ padding: "0 20px 8px" }}>
          <div className="caption" style={{ marginBottom: 10 }}>Denne uken</div>
        </div>
        <WeekStrip days={weekDays} selectedIndex={selectedDayIndex} onSelect={setSelectedDayIndex} />

        <div style={{ padding: "0 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="caption">{todayLabel}</span>
          <span style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500 }}>{exercises.length} øvelser</span>
        </div>

        <div style={{ padding: "0 20px" }}>
          {exercises.length === 0 ? (
            <div className="card" style={{ padding: "32px 16px", textAlign: "center", color: "var(--fg-3)", fontSize: 14 }}>
              Hviledag 💤
            </div>
          ) : (
            <>
              <div className="card" style={{ overflow: "hidden" }}>
                {workoutId
                  ? exercises.map((ex, i) => (
                      <ActiveExerciseRow
                        key={ex.id}
                        ex={ex}
                        log={setLog[ex.id] ?? ex.sets.map(s => ({ reps: s.reps, weightKg: s.weight_kg ?? null, done: false }))}
                        isLast={i === exercises.length - 1}
                        onCheck={(setIndex, reps, weightKg) => handleCheckSet(ex, setIndex, reps, weightKg)}
                        onSwap={() => router.push(`/exercises?swap=${i}`)}
                      />
                    ))
                  : exercises.map((ex, i) => (
                      <ExerciseRow
                        key={ex.id}
                        ex={ex}
                        isLast={i === exercises.length - 1}
                        doneCount={0}
                        onNavigate={() => router.push(`/exercises/${ex.exercise_id}`)}
                        onSwap={() => router.push(`/exercises?swap=${i}`)}
                      />
                    ))
                }
                {!workoutId && (
                  <button style={{
                    width: "100%", boxSizing: "border-box", padding: "14px 16px",
                    borderTop: "1px solid var(--border-1)",
                    display: "flex", alignItems: "center", gap: 8,
                    fontSize: 13, color: "var(--ai-accent)", fontWeight: 600,
                    background: "none", cursor: "pointer",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                      <path d="M7 2v10M2 7h10" />
                    </svg>
                    Legg til øvelse
                  </button>
                )}
              </div>

              {/* Start / Complete workout */}
              {!workoutId ? (
                <button
                  onClick={handleStartWorkout}
                  disabled={starting}
                  style={{
                    width: "100%", marginTop: 12, padding: "16px 0", borderRadius: 16,
                    background: "var(--ai-accent)", border: "none",
                    color: "var(--primary-foreground)", fontSize: 15, fontWeight: 700,
                    cursor: starting ? "default" : "pointer", opacity: starting ? 0.7 : 1,
                  }}
                >
                  {starting ? "Starter…" : "Start økt"}
                </button>
              ) : (() => {
                const allDone = exercises.every(ex =>
                  (setLog[ex.id] ?? []).every(s => s.done)
                )
                return allDone ? (
                  <button
                    onClick={handleCompleteWorkout}
                    disabled={completing}
                    style={{
                      width: "100%", marginTop: 12, padding: "16px 0", borderRadius: 16,
                      background: "var(--ai-accent)", border: "none",
                      color: "var(--primary-foreground)", fontSize: 15, fontWeight: 700,
                      cursor: completing ? "default" : "pointer", opacity: completing ? 0.7 : 1,
                    }}
                  >
                    {completing ? "Fullfører…" : "Fullfør økt ✓"}
                  </button>
                ) : (
                  <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 16, background: "var(--bg-2)", border: "1px solid var(--border-1)", textAlign: "center", fontSize: 13, color: "var(--fg-2)" }}>
                    Økt pågår…
                  </div>
                )
              })()}

              <div style={{ padding: "12px 0 0" }}>
                <button
                  onClick={() => router.push("/exercises")}
                  style={{
                    width: "100%", padding: "14px 0", borderRadius: 16,
                    background: "var(--bg-2)", border: "1px solid var(--border-1)",
                    color: "var(--fg-2)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Se øvelsebiblioteket →
                </button>
              </div>
            </>
          )}

          {/* Rest timer overlay */}
          {restTimer && (
            <RestTimer
              seconds={restSeconds}
              onDone={() => setRestTimer(false)}
              onChangeDefault={handleChangeRestDefault}
            />
          )}
        </div>
      </div>

        {/* Share preview modal */}
        {showSharePreview && (
          <div
            onClick={() => { if (!sharing) { setShowSharePreview(false); setShareError(null) } }}
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
                  onClick={() => { if (!sharing) { setShowSharePreview(false); setShareError(null) } }}
                  disabled={sharing}
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
    </div>
  )
}
