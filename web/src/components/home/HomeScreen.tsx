"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import Icon from "@/components/brand/Icon"

interface RecentWorkout {
  workout_id: string
  completed_at: string | null
  day_name: string | null
  set_count: number
  duration_min: number | null
}

function fmtRelative(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)
  if (diffDays === 0) return "I dag"
  if (diffDays === 1) return "I går"
  if (diffDays < 7) return `${diffDays} dager siden`
  return d.toLocaleDateString("no-NO", { day: "numeric", month: "short" })
}

interface Friend {
  id: string
  name: string
  initials: string
  hue: number
  workout: string
  duration: string
  pr: boolean
}

interface Suggestion {
  id: string
  name: string
  initials: string
  hue: number
}

const MOCK_FRIENDS: Friend[] = [
  {
    id: "1",
    name: "Jonas B.",
    initials: "JB",
    hue: 20,
    workout: "Pull A · back squat @ 110 kg",
    duration: "46 min",
    pr: false,
  },
  {
    id: "2",
    name: "Aida S.",
    initials: "AS",
    hue: 160,
    workout: "Zone 2 ride, 45 min",
    duration: "45 min",
    pr: false,
  },
  {
    id: "3",
    name: "Henrik L.",
    initials: "HL",
    hue: 200,
    workout: "HF PR bench 90 kg",
    duration: "52 min",
    pr: true,
  },
]

const MOCK_SUGGESTIONS: Suggestion[] = [
  { id: "s1", name: "Sofia T.", initials: "ST", hue: 280 },
  { id: "s2", name: "Marius T.", initials: "MT", hue: 40 },
]

function Avatar({
  name,
  initials,
  hue,
  size = 36,
}: {
  name: string
  initials: string
  hue: number
  size?: number
}) {
  return (
    <div
      role="img"
      aria-label={name}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: `linear-gradient(135deg, hsl(${hue} 65% 55%), hsl(${(hue + 40) % 360} 60% 40%))`,
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontWeight: 600,
        fontSize: Math.round(size * 0.36),
        letterSpacing: "-0.01em",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}

function StatCard({
  icon,
  emoji,
  value,
  suffix,
  label,
}: {
  icon?: "chart" | "trend"
  emoji?: string
  value: string
  suffix?: string
  label: string
}) {
  return (
    <div
      style={{
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        borderRadius: 12,
        padding: "14px 12px",
      }}
    >
      <div style={{ height: 22, marginBottom: 10, color: "var(--brand-orange)" }}>
        {emoji ? (
          <span style={{ fontSize: 20, lineHeight: 1 }}>{emoji}</span>
        ) : icon ? (
          <Icon name={icon} size={22} />
        ) : null}
      </div>
      <div
        className="tnum"
        style={{
          fontSize: 24,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: "var(--brand-ink)",
        }}
      >
        {value}
        {suffix && (
          <span
            style={{
              fontSize: 13,
              color: "var(--brand-muted)",
              fontWeight: 500,
              marginLeft: 4,
              letterSpacing: 0,
            }}
          >
            {suffix}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--brand-muted)",
          fontWeight: 500,
          marginTop: 6,
          letterSpacing: 0.05,
        }}
      >
        {label}
      </div>
    </div>
  )
}

interface TodaysWorkout {
  dayId: string
  dayName: string
  programId: string
  completed: boolean
}

interface InProgressLite {
  workout_id: string
  program_id: string | null
  day_name: string | null
  sets_logged: number
  started_at: string | null
}

export default function HomeScreen({
  firstName,
  streak,
  workoutsThisWeek,
  weeklyVolumeT,
  activeProgram,
  todaysWorkout,
  inProgress,
  recentWorkouts,
}: {
  firstName: string
  streak: number
  workoutsThisWeek: number
  weeklyVolumeT: number
  activeProgram: { name: string; dayCount: number } | null
  todaysWorkout: TodaysWorkout | null
  inProgress: InProgressLite | null
  recentWorkouts: RecentWorkout[]
}) {
  const router = useRouter()

  return (
    <div
      className="screen"
      style={{ background: "var(--brand-canvas)", color: "var(--brand-ink)" }}
    >
      <div style={{ height: 54 }} />

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 24 }}>
        {/* Header */}
        <div
          style={{
            padding: "8px 20px 4px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                color: "var(--brand-muted)",
                fontWeight: 500,
                textTransform: "capitalize",
              }}
            >
              {new Date().toLocaleDateString("no-NO", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                marginTop: 4,
                color: "var(--brand-ink)",
              }}
            >
              Hei, {firstName}.
            </h1>
          </div>
          {streak > 0 && (
            <div
              style={{
                background: "var(--brand-ink)",
                color: "var(--brand-canvas)",
                padding: "6px 10px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginTop: 8,
              }}
            >
              <span style={{ fontSize: 14 }}>🔥</span>
              <span className="tnum">{streak}</span>
            </div>
          )}
        </div>

        {/* In-progress workout banner (highest priority) */}
        {inProgress && (
          <div style={{ padding: "14px 20px 0" }}>
            <button
              onClick={() => router.push(`/program/workout/${inProgress.workout_id}`)}
              style={{
                width: "100%",
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                textAlign: "left",
                boxShadow: "0 4px 14px rgba(22,163,74,0.25)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.2)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                ▶
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    opacity: 0.9,
                  }}
                >
                  Pågående økt
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                  Fortsett {inProgress.day_name ?? "økt"}
                </div>
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 1 }}>
                  {inProgress.sets_logged} sett logget
                </div>
              </div>
              <span style={{ fontSize: 18 }}>›</span>
            </button>
          </div>
        )}

        {/* Hero card */}
        <div style={{ padding: "14px 20px 0" }}>
          <div
            style={{
              background: "var(--brand-orange)",
              color: "#fff",
              borderRadius: 18,
              padding: 20,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                right: -40,
                bottom: -40,
                width: 160,
                height: 160,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 999,
              }}
            />
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.85)",
                fontWeight: 600,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                marginBottom: 8,
                position: "relative",
              }}
            >
              {todaysWorkout
                ? todaysWorkout.completed
                  ? "I dag · Fullført"
                  : "I dag"
                : activeProgram
                  ? "Aktivt program"
                  : "Coach"}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                marginBottom: activeProgram || todaysWorkout ? 4 : 8,
                position: "relative",
              }}
            >
              {todaysWorkout
                ? todaysWorkout.dayName
                : activeProgram
                  ? activeProgram.name
                  : "Klar når du er"}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.85)",
                marginBottom: 16,
                position: "relative",
              }}
            >
              {todaysWorkout
                ? todaysWorkout.completed
                  ? "Bra jobba — hviledag i morgen?"
                  : activeProgram?.name
                : activeProgram
                  ? `${activeProgram.dayCount}-dagers program · Hviledag i dag`
                  : "Sett opp et program for å komme i gang"}
            </div>
            <button
              onClick={() => {
                if (todaysWorkout) {
                  router.push(`/program/${todaysWorkout.programId}`)
                } else if (activeProgram) {
                  router.push("/kalender")
                } else {
                  router.push("/program")
                }
              }}
              style={{
                position: "relative",
                background: "#fff",
                color: "var(--brand-ink)",
                border: "none",
                borderRadius: 10,
                padding: "11px 18px",
                fontSize: 14,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <Icon name="play" size={12} />
              {todaysWorkout
                ? todaysWorkout.completed
                  ? "Se økt"
                  : "Start økt"
                : activeProgram
                  ? "Se uka"
                  : "Sett opp program"}
            </button>
          </div>
        </div>

        {/* Stat tiles */}
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <StatCard emoji="💪" value={workoutsThisWeek.toString()} label="Økter denne uka" />
            <StatCard icon="chart" value={weeklyVolumeT.toFixed(1)} suffix="t" label="Tonnage" />
            <StatCard icon="trend" value={streak > 0 ? `+${streak}` : "—"} label="Streak-dager" />
          </div>
        </div>

        {/* Recent workouts */}
        {recentWorkouts.length > 0 && (
          <div style={{ padding: "20px 20px 0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: "var(--brand-muted)",
                  fontWeight: 600,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                }}
              >
                Siste økter
              </span>
              <Link
                href="/historikk"
                style={{
                  fontSize: 12,
                  color: "var(--brand-orange)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Se alle →
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentWorkouts.map((w) => (
                <Link
                  key={w.workout_id}
                  href={`/historikk/${w.workout_id}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "var(--brand-surface)",
                    border: "1px solid var(--brand-border)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                      {w.day_name ?? "Frittstående"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--brand-muted)" }}>
                      {fmtRelative(w.completed_at)} · {w.set_count} sett
                      {w.duration_min ? ` · ${w.duration_min} min` : ""}
                    </div>
                  </div>
                  <span style={{ color: "var(--brand-muted)", fontSize: 16 }}>›</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Friends active today */}
        <div style={{ padding: "20px 20px 0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: "var(--brand-muted)",
                fontWeight: 600,
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              Venner · Aktive i dag
            </span>
            <button
              onClick={() => router.push("/social")}
              style={{
                fontSize: 12,
                color: "var(--brand-orange)",
                fontWeight: 600,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Se alle →
            </button>
          </div>
          <div
            style={{
              background: "var(--brand-surface)",
              border: "1px solid var(--brand-border)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {MOCK_FRIENDS.map((f, i) => (
              <div
                key={f.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderTop: i === 0 ? "none" : "1px solid var(--brand-border)",
                }}
              >
                <Avatar name={f.name} initials={f.initials} hue={f.hue} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      letterSpacing: "-0.008em",
                      color: "var(--brand-ink)",
                    }}
                  >
                    {f.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--brand-muted)",
                      marginTop: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.workout}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {f.pr && (
                    <div
                      style={{
                        fontSize: 10,
                        color: "#fff",
                        background: "var(--brand-orange)",
                        fontWeight: 700,
                        letterSpacing: 0.4,
                        textTransform: "uppercase",
                        padding: "3px 7px",
                        borderRadius: 5,
                        marginBottom: 3,
                        display: "inline-block",
                      }}
                    >
                      PR
                    </div>
                  )}
                  <div
                    className="tnum"
                    style={{ fontSize: 12, color: "var(--brand-muted)", fontWeight: 500 }}
                  >
                    {f.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* People to follow */}
        <div style={{ padding: "20px 20px 0" }}>
          <div
            style={{
              fontSize: 12,
              color: "var(--brand-muted)",
              fontWeight: 600,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Folk du kanskje vil følge
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {MOCK_SUGGESTIONS.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Avatar name={s.name} initials={s.initials} hue={s.hue} size={48} />
                <div style={{ fontSize: 12, color: "var(--brand-ink)", fontWeight: 500 }}>
                  {s.name}
                </div>
                <button
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--brand-orange)",
                    background: "var(--brand-subtle)",
                    border: "none",
                    borderRadius: 999,
                    padding: "5px 13px",
                    cursor: "pointer",
                  }}
                >
                  Følg
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
