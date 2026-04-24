"use client"

import { useState } from "react"
import { ChevronIcon, BoltIcon } from "@/components/ui/icons"

/* ── Types ── */
interface SetRow {
  set: number
  kg: number
  reps: number
  rpe: number
}

interface Exercise {
  name: string
  sets: SetRow[]
}

interface Workout {
  id: string
  label: string      // 2-letter abbrev for avatar square
  hue: number        // HSL hue for avatar gradient
  name: string
  day: string
  duration: string
  volume: number     // kg
  totalSets: number
  rpe: number        // 0–10
  prs: number
  exercises: Exercise[]
}

/* ── Mock data ── */
const MOCK_WORKOUTS: Workout[] = [
  {
    id: "w1", label: "PB", hue: 200, name: "Pull B", day: "Torsdag", duration: "48 min",
    volume: 6120, totalSets: 21, rpe: 7.8, prs: 2,
    exercises: [
      { name: "Deadlift",        sets: [{ set:1, kg:140, reps:5, rpe:8 }, { set:2, kg:140, reps:5, rpe:8.5 }, { set:3, kg:140, reps:4, rpe:9 }] },
      { name: "Barbell Row",     sets: [{ set:1, kg:80, reps:8, rpe:7 }, { set:2, kg:80, reps:8, rpe:7.5 }, { set:3, kg:80, reps:7, rpe:8 }] },
      { name: "Pull-up",         sets: [{ set:1, kg:0, reps:10, rpe:7 }, { set:2, kg:0, reps:9, rpe:7.5 }, { set:3, kg:0, reps:8, rpe:8 }] },
      { name: "Face Pull",       sets: [{ set:1, kg:22, reps:15, rpe:6 }, { set:2, kg:22, reps:15, rpe:6.5 }, { set:3, kg:22, reps:14, rpe:7 }] },
      { name: "Hammer Curl",     sets: [{ set:1, kg:18, reps:12, rpe:7 }, { set:2, kg:18, reps:12, rpe:7.5 }, { set:3, kg:18, reps:11, rpe:8 }] },
    ],
  },
  {
    id: "w2", label: "PA", hue: 20, name: "Push A", day: "Tirsdag", duration: "54 min",
    volume: 5840, totalSets: 19, rpe: 8.1, prs: 1,
    exercises: [
      { name: "Bench Press",     sets: [{ set:1, kg:82.5, reps:5, rpe:8 }, { set:2, kg:82.5, reps:5, rpe:8.5 }, { set:3, kg:82.5, reps:4, rpe:9 }, { set:4, kg:82.5, reps:4, rpe:9.5 }] },
      { name: "Overhead Press",  sets: [{ set:1, kg:47.5, reps:8, rpe:7.5 }, { set:2, kg:47.5, reps:8, rpe:8 }, { set:3, kg:47.5, reps:7, rpe:8.5 }] },
      { name: "Incline DB Press",sets: [{ set:1, kg:22.5, reps:10, rpe:7 }, { set:2, kg:22.5, reps:10, rpe:7.5 }, { set:3, kg:22.5, reps:9, rpe:8 }] },
      { name: "Tricep Pushdown", sets: [{ set:1, kg:32, reps:12, rpe:7 }, { set:2, kg:32, reps:12, rpe:7.5 }, { set:3, kg:32, reps:11, rpe:8 }] },
    ],
  },
  {
    id: "w3", label: "Le", hue: 140, name: "Legs", day: "Søndag", duration: "61 min",
    volume: 8210, totalSets: 23, rpe: 8.6, prs: 0,
    exercises: [
      { name: "Back Squat",      sets: [{ set:1, kg:110, reps:5, rpe:8 }, { set:2, kg:110, reps:5, rpe:8.5 }, { set:3, kg:110, reps:4, rpe:9 }, { set:4, kg:110, reps:4, rpe:9.5 }] },
      { name: "Romanian DL",     sets: [{ set:1, kg:90, reps:8, rpe:7.5 }, { set:2, kg:90, reps:8, rpe:8 }, { set:3, kg:90, reps:7, rpe:8.5 }] },
      { name: "Leg Press",       sets: [{ set:1, kg:160, reps:10, rpe:7 }, { set:2, kg:160, reps:10, rpe:7.5 }, { set:3, kg:160, reps:9, rpe:8 }] },
      { name: "Leg Curl",        sets: [{ set:1, kg:50, reps:12, rpe:7 }, { set:2, kg:50, reps:12, rpe:7.5 }, { set:3, kg:50, reps:11, rpe:8 }] },
      { name: "Calf Raise",      sets: [{ set:1, kg:60, reps:15, rpe:6 }, { set:2, kg:60, reps:15, rpe:6.5 }, { set:3, kg:60, reps:14, rpe:7 }] },
    ],
  },
  {
    id: "w4", label: "PA", hue: 20, name: "Pull A", day: "Fredag", duration: "46 min",
    volume: 5420, totalSets: 18, rpe: 7.5, prs: 0,
    exercises: [
      { name: "Deadlift",        sets: [{ set:1, kg:135, reps:5, rpe:7.5 }, { set:2, kg:135, reps:5, rpe:8 }, { set:3, kg:135, reps:5, rpe:8 }] },
      { name: "Barbell Row",     sets: [{ set:1, kg:77.5, reps:8, rpe:7 }, { set:2, kg:77.5, reps:8, rpe:7 }, { set:3, kg:77.5, reps:8, rpe:7.5 }] },
      { name: "Pull-up",         sets: [{ set:1, kg:0, reps:9, rpe:7 }, { set:2, kg:0, reps:9, rpe:7.5 }, { set:3, kg:0, reps:8, rpe:8 }] },
      { name: "Bicep Curl",      sets: [{ set:1, kg:20, reps:12, rpe:7 }, { set:2, kg:20, reps:12, rpe:7 }, { set:3, kg:20, reps:11, rpe:7.5 }] },
    ],
  },
]

const FILTER_TABS = ["Alle", "Pull", "Push", "Legs"]

const SPARKLINE_POINTS = [5100, 5600, 5420, 5840, 8210, 6120]

/* ── RpeDots ── */
function RpeDots({ rpe }: { rpe: number }) {
  const filled = Math.round(rpe)
  return (
    <div style={{ display: "flex", gap: 2.5 }}>
      {Array.from({ length: 10 }, (_, i) => {
        const active = i < filled
        let color = "var(--fg-3)"
        if (active) {
          color = rpe >= 9 ? "var(--danger)" : rpe >= 7.5 ? "var(--ai-accent)" : "var(--fg-2)"
        }
        return (
          <div key={i} style={{
            width: 5, height: 5, borderRadius: 999,
            background: active ? color : "var(--bg-4)",
            flexShrink: 0,
          }} />
        )
      })}
    </div>
  )
}

/* ── Sparkline ── */
function Sparkline({ points, width = 64, height = 22, color = "var(--ai-accent)" }: {
  points: number[]; width?: number; height?: number; color?: string
}) {
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const step = width / (points.length - 1)
  const coords = points.map((v, i) => ({
    x: i * step,
    y: height - ((v - min) / range) * height,
  }))
  const d = coords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true">
      <path d={d} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ── WorkoutAvatar ── */
function WorkoutAvatar({ label, hue, size = 44 }: { label: string; hue: number; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 14,
      background: `linear-gradient(135deg, hsl(${hue} 55% 38%), hsl(${(hue + 40) % 360} 50% 22%))`,
      display: "grid", placeItems: "center",
      color: "var(--fg-0)", fontWeight: 700,
      fontSize: Math.round(size * 0.3), letterSpacing: "-0.01em",
      flexShrink: 0,
    }}>
      {label}
    </div>
  )
}

/* ── WorkoutCard ── */
function WorkoutCard({ workout }: { workout: Workout }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: "100%", textAlign: "left", background: "none",
          border: "none", cursor: "pointer", color: "inherit",
          padding: 16, display: "flex", alignItems: "center", gap: 14,
        }}
      >
        <WorkoutAvatar label={workout.label} hue={workout.hue} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>{workout.name}</span>
            {workout.prs > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                fontSize: 10, color: "var(--ai-accent)", fontWeight: 700,
                padding: "2px 7px", background: "var(--ai-accent-soft)",
                borderRadius: 999,
              }}>
                <BoltIcon size={9} /> {workout.prs} PR
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, marginTop: 2 }}>
            {workout.day} · {workout.duration}
          </div>
          <div style={{ marginTop: 8 }}>
            <RpeDots rpe={workout.rpe} />
          </div>
        </div>

        {/* Stat column */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div className="metric-s tnum">{(workout.volume / 1000).toFixed(1)}
            <span style={{ fontSize: 11, color: "var(--fg-2)", fontWeight: 500, marginLeft: 2 }}>t</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--fg-2)", fontWeight: 500, marginTop: 2 }}>
            {workout.totalSets} sett
          </div>
          <div style={{ marginTop: 8, color: expanded ? "var(--ai-accent)" : "var(--fg-3)" }}>
            <ChevronIcon size={14} dir={expanded ? "down" : "right"} />
          </div>
        </div>
      </button>

      {/* Expanded exercise detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border-1)", padding: "8px 16px 14px" }}>
          {workout.exercises.map((ex, ei) => (
            <div key={ei} style={{ marginTop: ei === 0 ? 8 : 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-1)", letterSpacing: "-0.005em", marginBottom: 6 }}>
                {ex.name}
              </div>
              {/* Set header */}
              <div style={{
                display: "grid", gridTemplateColumns: "28px 1fr 1fr 1fr",
                gap: 4, marginBottom: 4,
              }}>
                {["#", "kg", "reps", "RPE"].map(h => (
                  <div key={h} style={{ fontSize: 10, color: "var(--fg-3)", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>{h}</div>
                ))}
              </div>
              {/* Set rows */}
              {ex.sets.map(s => (
                <div key={s.set} style={{
                  display: "grid", gridTemplateColumns: "28px 1fr 1fr 1fr",
                  gap: 4, padding: "4px 0",
                  borderTop: s.set === 1 ? "none" : "1px solid var(--border-1)",
                }}>
                  <div className="tnum" style={{ fontSize: 12, color: "var(--fg-3)" }}>{s.set}</div>
                  <div className="tnum" style={{ fontSize: 12, fontWeight: 600 }}>{s.kg === 0 ? "BW" : `${s.kg}`}</div>
                  <div className="tnum" style={{ fontSize: 12, fontWeight: 600 }}>{s.reps}</div>
                  <div className="tnum" style={{
                    fontSize: 12, fontWeight: 600,
                    color: s.rpe >= 9 ? "var(--danger)" : s.rpe >= 7.5 ? "var(--ai-accent)" : "var(--fg-2)",
                  }}>@{s.rpe}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── WorkoutLog (main export) ── */
export default function WorkoutLog() {
  const [activeFilter, setActiveFilter] = useState("Alle")

  const totalVolume = MOCK_WORKOUTS.reduce((sum, w) => sum + w.volume, 0)

  const filtered = activeFilter === "Alle"
    ? MOCK_WORKOUTS
    : MOCK_WORKOUTS.filter(w => w.name.toLowerCase().startsWith(activeFilter.toLowerCase()))

  return (
    <div className="screen">
      <div style={{ height: 54 }} />

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>

        {/* Header */}
        <div style={{ padding: "8px 20px 4px" }}>
          <div style={{ fontSize: 13, color: "var(--fg-2)", fontWeight: 500, letterSpacing: "-0.005em" }}>
            {new Date().toLocaleDateString("no-NO", { month: "long", year: "numeric" })}
          </div>
          <div className="display-l" style={{ marginTop: 2 }}>Treningslogg</div>
        </div>

        {/* Monthly summary band */}
        <div style={{ padding: "14px 20px 0" }}>
          <div className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="caption" style={{ marginBottom: 6 }}>Aprilvolum</div>
              <div className="metric tnum">
                {(totalVolume / 1000).toFixed(1)}
                <span style={{ fontSize: 15, color: "var(--fg-2)", fontWeight: 500, marginLeft: 3 }}>t</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--success)", fontWeight: 600, marginTop: 4 }}>↑ 12% vs mars</div>
            </div>
            <Sparkline points={SPARKLINE_POINTS} width={72} height={28} />
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ padding: "14px 20px 0" }}>
          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {FILTER_TABS.map(tab => {
              const active = activeFilter === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  style={{
                    flexShrink: 0,
                    height: 32, padding: "0 14px",
                    borderRadius: 999,
                    background: active ? "var(--ai-accent-soft)" : "var(--bg-2)",
                    border: active ? "1px solid rgba(255,107,53,0.3)" : "1px solid var(--border-1)",
                    color: active ? "var(--ai-accent)" : "var(--fg-2)",
                    fontSize: 13, fontWeight: 600, letterSpacing: "-0.005em",
                    cursor: "pointer",
                  }}
                >
                  {tab}
                </button>
              )
            })}
          </div>
        </div>

        {/* Workout list */}
        <div style={{ padding: "12px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--fg-3)", fontSize: 14 }}>
              Ingen øktер for dette filteret
            </div>
          ) : (
            filtered.map(w => <WorkoutCard key={w.id} workout={w} />)
          )}
        </div>

      </div>
    </div>
  )
}
