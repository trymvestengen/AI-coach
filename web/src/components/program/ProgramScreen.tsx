"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getExercise } from "@/lib/exercises"

/* ── Types ── */
interface SetEntry {
  r: number | null
  w: number | null
}

interface Exercise {
  id: string
  name: string
  sets: number
  targetReps: string
  targetWeight: number
  rpe: number
  setLog: SetEntry[]
}

interface WeekDay {
  d: string
  date: number
  exCount: number
  done: boolean
  today: boolean
}

/* ── Mock data ── */
const WEEK_DAYS: WeekDay[] = [
  { d: "Man", date: 21, exCount: 6, done: true,  today: false },
  { d: "Tir", date: 22, exCount: 5, done: true,  today: false },
  { d: "Ons", date: 23, exCount: 0, done: false, today: false },
  { d: "Tor", date: 24, exCount: 6, done: false, today: true  },
  { d: "Fre", date: 25, exCount: 5, done: false, today: false },
  { d: "Lør", date: 26, exCount: 4, done: false, today: false },
  { d: "Søn", date: 27, exCount: 0, done: false, today: false },
]

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

const TOTAL_WEEKS = 12
const DONE_WEEKS = 3
const CURRENT_WEEK = 4

/* ── ProgressBar ── */
function ProgressBar() {
  return (
    <div style={{ padding: "0 20px 20px" }}>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: TOTAL_WEEKS }, (_, i) => {
          const done = i < DONE_WEEKS
          const current = i === DONE_WEEKS
          return (
            <div key={i} style={{
              flex: 1, height: 6, borderRadius: 2,
              background: done
                ? "var(--ai-accent)"
                : current
                  ? "rgba(255,107,53,0.35)"
                  : "var(--bg-3)",
              border: current ? "1px solid var(--ai-accent)" : "none",
              boxSizing: "border-box",
            }} />
          )
        })}
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between",
        marginTop: 8, fontSize: 11, color: "var(--fg-2)", fontWeight: 500,
      }}>
        <span>{DONE_WEEKS} av {TOTAL_WEEKS} uker</span>
        <span>{TOTAL_WEEKS - CURRENT_WEEK + 1} uker igjen</span>
      </div>
    </div>
  )
}

/* ── WeekStrip ── */
function WeekStrip({ days }: { days: WeekDay[] }) {
  return (
    <div style={{ padding: "0 20px 20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {days.map((d) => (
          <div key={d.d} style={{
            padding: "10px 0 12px", borderRadius: 14,
            background: d.today
              ? "var(--ai-accent)"
              : d.done
                ? "var(--bg-3)"
                : "var(--bg-2)",
            border: `1px solid ${d.today ? "var(--ai-accent)" : "var(--border-1)"}`,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            opacity: d.exCount === 0 ? 0.5 : 1,
          }}>
            <div style={{
              fontSize: 9, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600,
              color: d.today ? "var(--primary-foreground)" : "var(--fg-3)",
            }}>
              {d.d}
            </div>
            <div style={{
              fontSize: 15, fontWeight: 700,
              color: d.today ? "var(--primary-foreground)" : "var(--fg-0)",
            }} className="tnum">
              {d.date}
            </div>
            <div style={{
              width: 4, height: 4, borderRadius: 2,
              background: d.done
                ? (d.today ? "var(--primary-foreground)" : "var(--ai-accent)")
                : "transparent",
            }} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── ExerciseProgressRing ── */
function ExerciseProgressRing({ ex }: { ex: Exercise }) {
  const done = ex.setLog.filter(s => s.r !== null).length
  const pct = done / ex.sets
  const r = 9
  const circumference = 2 * Math.PI * r
  return (
    <div style={{ position: "relative", width: 26, height: 26, flexShrink: 0 }}>
      <svg width="26" height="26" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx="13" cy="13" r={r} stroke="var(--border-1)" strokeWidth="2" fill="none" />
        <circle cx="13" cy="13" r={r} stroke="var(--ai-accent)" strokeWidth="2" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 9, color: "var(--fg-2)", fontWeight: 600,
      }} className="tnum">
        {done}/{ex.sets}
      </div>
    </div>
  )
}

/* ── ExerciseRow ── */
function ExerciseRow({ ex, isLast, onClick, onSwap }: { ex: Exercise; isLast: boolean; onClick: () => void; onSwap: () => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 8px 8px 16px",
      borderBottom: isLast ? "none" : "1px solid var(--border-1)",
    }}>
      <button onClick={onClick} style={{ flex: 1, minWidth: 0, padding: "6px 0", cursor: "pointer", background: "none", border: "none", color: "inherit", textAlign: "left" }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.008em", color: "var(--fg-0)" }}>
          {ex.name}
        </div>
        <div className="tnum" style={{ fontSize: 11, color: "var(--fg-2)", fontWeight: 500, marginTop: 2 }}>
          {ex.sets}×{ex.targetReps} · {ex.targetWeight} kg · @{ex.rpe}
        </div>
      </button>
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
        <svg width="11" height="11" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" aria-hidden="true">
          <path d="M1 4h8l-2-2M11 8H3l2 2" />
        </svg>
        Swap
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px 6px 4px", flexShrink: 0 }}>
        <ExerciseProgressRing ex={ex} />
        <svg width="8" height="12" viewBox="0 0 8 12" stroke="var(--fg-3)" strokeWidth="1.5" fill="none" strokeLinecap="round" aria-hidden="true">
          <path d="M2 1l4 5-4 5" />
        </svg>
      </div>
    </div>
  )
}

/* ── ProgramScreen (main export) ── */
export default function ProgramScreen() {
  const router = useRouter()
  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES)

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
      // ignore corrupt data
    }
  }, [])

  return (
    <div className="screen">
      <div style={{ height: 54 }} />

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>

        {/* Header */}
        <div style={{ padding: "14px 20px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div className="caption" style={{ marginBottom: 6 }}>Uke {CURRENT_WEEK} av {TOTAL_WEEKS}</div>
            <div className="display-l">Hypertrophy 4×</div>
          </div>
          <div style={{
            fontSize: 11, color: "var(--ai-accent)", fontWeight: 700, letterSpacing: 0.5,
            padding: "6px 10px", borderRadius: 999,
            background: "var(--ai-accent-soft)",
            border: "1px solid rgba(255,107,53,0.3)",
            flexShrink: 0, marginTop: 4,
          }}>
            AKTIV
          </div>
        </div>

        {/* 12-week progress bar */}
        <ProgressBar />

        {/* Week strip */}
        <div style={{ padding: "0 20px 8px" }}>
          <div className="caption" style={{ marginBottom: 10 }}>Denne uken</div>
        </div>
        <WeekStrip days={WEEK_DAYS} />

        {/* Today's session header */}
        <div style={{ padding: "0 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="caption">Torsdag · Upper B</span>
          <span style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500 }}>{exercises.length} øvelser</span>
        </div>

        {/* Exercise list */}
        <div style={{ padding: "0 20px" }}>
          <div className="card" style={{ overflow: "hidden" }}>
            {exercises.map((ex, i) => (
              <ExerciseRow
                key={ex.id}
                ex={ex}
                isLast={i === exercises.length - 1}
                onClick={() => router.push(`/exercises/${ex.id}`)}
                onSwap={() => router.push(`/exercises?swap=${i}`)}
              />
            ))}
            <button style={{
              width: "100%", boxSizing: "border-box",
              padding: "14px 16px",
              borderTop: "1px solid var(--border-1)",
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 13, color: "var(--ai-accent)", fontWeight: 600, letterSpacing: "-0.005em",
              background: "none", cursor: "pointer",
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M7 2v10M2 7h10" />
              </svg>
              Legg til øvelse
            </button>
          </div>

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
        </div>

      </div>
    </div>
  )
}
