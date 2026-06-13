import { redirect } from "next/navigation"
import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase-server"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface ProgramDay {
  id: string
  day_number: number
  name: string
  weekdays: number[]
  frequency_per_week: number | null
  exercises: { id: string }[]
}

interface ActiveProgram {
  id: string
  name: string
  days: ProgramDay[]
}

interface WorkoutSummary {
  workout_id: string
  completed_at: string | null
  day_name: string | null
}

const DAY_LABELS = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"]
// Map Mon-first (index 0=Mon) → JS day-of-week (0=Sun)
const MON_FIRST_TO_DOW = [1, 2, 3, 4, 5, 6, 0]

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString("no-NO", { day: "numeric", month: "short" })
}

export default async function CalendarPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const headers = { Authorization: `Bearer ${session.access_token}` }

  const [programRes, workoutsRes] = await Promise.all([
    fetch(`${API_BASE}/api/programs/active`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/workouts`, { headers, cache: "no-store" }),
  ])

  const activeProgram: ActiveProgram | null = programRes.ok ? await programRes.json() : null
  const workouts: WorkoutSummary[] = workoutsRes.ok ? await workoutsRes.json() : []

  const monday = getMonday(new Date())
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })
  const todayKey = new Date().toDateString()

  // Map weekday index (Mon-first 0-6) → list of program days that run that day
  const plannedByDay: ProgramDay[][] = Array.from({ length: 7 }, () => [])
  for (const day of activeProgram?.days ?? []) {
    for (const dow of day.weekdays) {
      const monIdx = MON_FIRST_TO_DOW.indexOf(dow)
      if (monIdx >= 0) plannedByDay[monIdx].push(day)
    }
  }

  // Map week-date → completed workouts that day
  const completedByDay: WorkoutSummary[][] = Array.from({ length: 7 }, () => [])
  for (const w of workouts) {
    if (!w.completed_at) continue
    const d = new Date(w.completed_at)
    for (let i = 0; i < 7; i++) {
      if (d.toDateString() === weekDates[i].toDateString()) {
        completedByDay[i].push(w)
        break
      }
    }
  }

  // Frequency-only days (no specific weekdays) — show as banner above grid
  const frequencyDays = (activeProgram?.days ?? []).filter(
    (d) => (d.weekdays?.length ?? 0) === 0 && d.frequency_per_week
  )

  return (
    <div style={{ padding: 20, background: "var(--brand-canvas)", minHeight: "100%" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
        Kalender
      </h1>
      <p style={{ fontSize: 13, color: "var(--brand-muted)", marginBottom: 18 }}>
        {fmtDay(weekDates[0])} – {fmtDay(weekDates[6])}
      </p>

      {!activeProgram ? (
        <div
          style={{ textAlign: "center", color: "var(--brand-muted)", marginTop: 40, fontSize: 14 }}
        >
          Ingen aktivt program. Aktiver et program for å se planen din her.
        </div>
      ) : (
        <>
          {frequencyDays.length > 0 && (
            <div
              style={{
                background: "var(--brand-surface)",
                border: "1px dashed var(--brand-border)",
                borderRadius: 10,
                padding: "8px 12px",
                marginBottom: 14,
                fontSize: 11,
                color: "var(--brand-muted)",
              }}
            >
              Fleksible:{" "}
              {frequencyDays.map((d, i) => (
                <span key={d.id}>
                  <b style={{ color: "var(--brand-ink)" }}>{d.name}</b> ({d.frequency_per_week}
                  ×/uke)
                  {i < frequencyDays.length - 1 ? " · " : ""}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {weekDates.map((date, i) => {
              const planned = plannedByDay[i]
              const completed = completedByDay[i]
              const isToday = date.toDateString() === todayKey
              return (
                <div
                  key={i}
                  style={{
                    background: "var(--brand-surface)",
                    border: isToday
                      ? "2px solid var(--brand-orange)"
                      : "1px solid var(--brand-border)",
                    borderRadius: 12,
                    padding: 12,
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      flexShrink: 0,
                      textAlign: "center",
                      padding: "6px 4px",
                      background: isToday ? "var(--brand-orange)" : "var(--brand-canvas)",
                      borderRadius: 8,
                      color: isToday ? "white" : "var(--brand-ink)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                        opacity: isToday ? 0.85 : 0.6,
                      }}
                    >
                      {DAY_LABELS[i].slice(0, 3)}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>
                      {date.getDate()}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {planned.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {planned.map((d) => {
                          const completedThis = completed.find((c) => c.day_name === d.name)
                          return (
                            <div
                              key={d.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              {completedThis ? (
                                <Link
                                  href={`/historikk/${completedThis.workout_id}`}
                                  style={{
                                    flex: 1,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "#16a34a",
                                    textDecoration: "none",
                                  }}
                                >
                                  ✓ {d.name}
                                </Link>
                              ) : (
                                <span
                                  style={{
                                    flex: 1,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "var(--brand-ink)",
                                  }}
                                >
                                  {d.name}
                                </span>
                              )}
                              <span
                                style={{
                                  fontSize: 10,
                                  color: "var(--brand-muted)",
                                  fontWeight: 600,
                                }}
                              >
                                {d.exercises?.length ?? 0} øvelser
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : completed.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {completed.map((c) => (
                          <Link
                            key={c.workout_id}
                            href={`/historikk/${c.workout_id}`}
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#16a34a",
                              textDecoration: "none",
                            }}
                          >
                            ✓ {c.day_name ?? "Økt"}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--brand-muted)" }}>Hviledag</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
