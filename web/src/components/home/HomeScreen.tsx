"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Icon from "@/components/brand/Icon"
import { startWorkoutFromTemplate } from "@/lib/api"

interface RecentWorkout {
  workout_id: string
  completed_at: string | null
  day_name: string | null
  set_count: number
  duration_min: number | null
}

interface NextWorkoutLite {
  template_id: string | null
  name: string | null
  reason: string | null
}

interface InProgressLite {
  workout_id: string
  day_name: string | null
  sets_logged: number
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

export default function HomeScreen({
  firstName,
  streak,
  workoutsThisWeek,
  weeklyVolumeT,
  nextWorkout,
  inProgress,
  recentWorkouts,
}: {
  firstName: string
  streak: number
  workoutsThisWeek: number
  weeklyVolumeT: number
  nextWorkout: NextWorkoutLite | null
  inProgress: InProgressLite | null
  recentWorkouts: RecentWorkout[]
}) {
  const router = useRouter()
  const [starting, setStarting] = useState(false)

  const suggestion = nextWorkout?.template_id
    ? {
        templateId: nextWorkout.template_id,
        name: nextWorkout.name ?? "Neste økt",
        reason: nextWorkout.reason,
      }
    : null

  const startSuggested = async () => {
    if (!suggestion || starting) return
    setStarting(true)
    try {
      const { workout_id } = await startWorkoutFromTemplate(suggestion.templateId)
      router.push(`/program/workout/${workout_id}`)
    } catch {
      setStarting(false)
    }
  }

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

        {/* Hero card — coach's next workout, or a nudge to the Trening tab */}
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
              {suggestion ? "Neste økt" : "Kom i gang"}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                marginBottom: 4,
                position: "relative",
              }}
            >
              {suggestion ? suggestion.name : "Klar når du er"}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.85)",
                marginBottom: 16,
                position: "relative",
              }}
            >
              {suggestion
                ? (suggestion.reason ?? "Foreslått av coachen")
                : "Velg en mal eller start en tom økt i Trening"}
            </div>
            <button
              onClick={() => {
                if (suggestion) {
                  startSuggested()
                } else {
                  router.push("/program")
                }
              }}
              disabled={starting}
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
                cursor: starting ? "default" : "pointer",
                opacity: starting ? 0.7 : 1,
              }}
            >
              <Icon name="play" size={12} />
              {suggestion ? "Start økt" : "Til Trening"}
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
      </div>
    </div>
  )
}
