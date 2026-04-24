"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getActiveProgram, type Program, type ProgramDay, type ProgramExercise } from "@/lib/api"

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

/* ── ProgramScreen ── */
export default function ProgramScreen() {
  const router = useRouter()
  const [program, setProgram] = useState<Program | null>(null)
  const [error, setError] = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [weekDays, setWeekDays] = useState<WeekDay[]>([])

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

  const selectedDay = weekDays[selectedDayIndex]?.programDay ?? null
  const exercises = selectedDay?.exercises ?? []
  const todayLabel = selectedDay
    ? `${DAY_LABELS[selectedDayIndex]} · ${selectedDay.name}`
    : weekDays[selectedDayIndex]?.today ? "Hviledag" : DAY_LABELS[selectedDayIndex]

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
          <div style={{
            fontSize: 11, color: "var(--ai-accent)", fontWeight: 700, letterSpacing: 0.5,
            padding: "6px 10px", borderRadius: 999, background: "var(--ai-accent-soft)",
            border: "1px solid rgba(255,107,53,0.3)", flexShrink: 0, marginTop: 4,
          }}>
            AKTIV
          </div>
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
            <div className="card" style={{ overflow: "hidden" }}>
              {exercises.map((ex, i) => (
                <ExerciseRow
                  key={i}
                  ex={ex}
                  isLast={i === exercises.length - 1}
                  doneCount={0}
                  onNavigate={() => router.push(`/exercises/${ex.exercise_id}`)}
                  onSwap={() => router.push(`/exercises?swap=${i}`)}
                />
              ))}
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
            </div>
          )}

          <div style={{ padding: "12px 0 0" }}>
            <button
              onClick={() => router.push("/exercises")}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 16,
                background: "var(--bg-2)", border: "1px solid var(--border-1)",
                color: "var(--fg-2)", fontSize: 13, fontWeight: 600,
                cursor: "pointer",
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
