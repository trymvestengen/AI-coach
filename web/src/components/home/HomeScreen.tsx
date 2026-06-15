"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ThemeToggle from "@/components/theme/ThemeToggle"
import { startWorkoutFromTemplate } from "@/lib/api"
import WeekPlanSheet from "./WeekPlanSheet"

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

interface WeekTemplate {
  id: string
  name: string
  scheduled_days?: number[]
}

function fmtRelative(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
  if (diffDays === 0) return "I dag"
  if (diffDays === 1) return "I går"
  if (diffDays < 7) return `${diffDays} dager siden`
  return d.toLocaleDateString("no-NO", { day: "numeric", month: "short" })
}

export default function HomeScreen({
  firstName,
  streak,
  workoutsThisWeek,
  weeklyVolumeT,
  nextWorkout,
  inProgress,
  recentWorkouts,
  templates = [],
}: {
  firstName: string
  streak: number
  workoutsThisWeek: number
  weeklyVolumeT: number
  nextWorkout: NextWorkoutLite | null
  inProgress: InProgressLite | null
  recentWorkouts: RecentWorkout[]
  templates?: WeekTemplate[]
}) {
  const router = useRouter()
  const [starting, setStarting] = useState(false)
  const [weekOpen, setWeekOpen] = useState(false)

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

  const today = new Date().toLocaleDateString("no-NO", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const DAY_SHORT: Record<number, string> = {
    1: "Ma",
    2: "Ti",
    3: "On",
    4: "To",
    5: "Fr",
    6: "Lø",
    7: "Sø",
  }
  const plannedIsoDays = Array.from(new Set(templates.flatMap((t) => t.scheduled_days ?? []))).sort(
    (a, b) => a - b
  )
  const plannedSummary =
    plannedIsoDays.length > 0 ? plannedIsoDays.map((d) => DAY_SHORT[d]).join(" · ") : null

  return (
    <div
      className="screen forge"
      style={{ background: "var(--brand-canvas)", color: "var(--brand-ink)" }}
    >
      {/* top bar: date + theme toggle */}
      <div className="app-topbar" style={{ padding: "16px 20px 4px" }}>
        <div className="datebar">
          <span className="tick" />
          {today}
        </div>
        <ThemeToggle />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 24px" }}>
        {/* greeting + streak */}
        <div className="greet-row">
          <h1 className="greet">
            Hei, {firstName}
            <span className="dot">.</span>
          </h1>
          {streak > 0 && (
            <div className="streak">
              <span className="flame">🔥</span>
              <span className="num tnum">{streak}</span>
            </div>
          )}
        </div>

        {/* in-progress workout (highest priority) */}
        {inProgress && (
          <button
            type="button"
            onClick={() => router.push(`/program/workout/${inProgress.workout_id}`)}
            className="panel"
            style={{
              width: "100%",
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
              textAlign: "left",
              cursor: "pointer",
              borderColor: "color-mix(in srgb, var(--success) 40%, transparent)",
            }}
          >
            <span
              className="plate-icon"
              style={{ color: "var(--success)", borderColor: "var(--success)" }}
            >
              ▶
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                className="eyebrow"
                style={{ color: "var(--success)", letterSpacing: "0.12em" }}
              >
                Pågående økt
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--brand-ink)",
                  marginTop: 4,
                }}
              >
                Fortsett {inProgress.day_name ?? "økt"}
              </span>
              <span style={{ fontSize: 11.5, color: "var(--brand-muted)" }}>
                {inProgress.sets_logged} sett logget
              </span>
            </span>
            <span style={{ color: "var(--brand-muted)", fontSize: 18 }}>›</span>
          </button>
        )}

        {/* hero — coach's next workout, or a nudge to Trening */}
        <section className="hero" style={{ marginTop: 18 }}>
          <div className="eyebrow">{suggestion ? "Neste økt" : "Kom i gang"}</div>
          <h2 className="hero-title">{suggestion ? suggestion.name : "Klar når du er"}</h2>
          <p className="hero-sub">
            {suggestion
              ? (suggestion.reason ?? "Foreslått av coachen")
              : "Velg en mal eller start en tom økt i Trening"}
          </p>
          <div className="gauge" aria-hidden>
            <i className="on" />
            <i className="on" />
            <i className={suggestion ? "on" : ""} />
            <i />
          </div>
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={starting}
            onClick={() => (suggestion ? startSuggested() : router.push("/program"))}
            style={{ opacity: starting ? 0.7 : 1 }}
          >
            {suggestion ? "Start økt" : "Til Trening"} <span className="arrow">→</span>
          </button>
        </section>

        {/* stat tiles */}
        <div className="stat-grid" style={{ marginTop: 14 }}>
          <div className="stat-tile">
            <div className="v tnum">{workoutsThisWeek}</div>
            <div className="l">Økter denne uka</div>
            <div
              className="tick"
              style={{ "--w": `${Math.min(100, workoutsThisWeek * 25)}%` } as React.CSSProperties}
            />
          </div>
          <div className="stat-tile accent">
            <div className="v tnum">{weeklyVolumeT.toFixed(1)}&thinsp;t</div>
            <div className="l">Tonnage</div>
            <div className="tick" style={{ "--w": "60%" } as React.CSSProperties} />
          </div>
          <div className="stat-tile">
            <div className="v tnum">{streak > 0 ? `+${streak}` : "—"}</div>
            <div className="l">Streak-dager</div>
            <div
              className="tick"
              style={{ "--w": `${Math.min(100, streak * 14)}%` } as React.CSSProperties}
            />
          </div>
        </div>

        {/* denne uka widget */}
        <button
          type="button"
          onClick={() => setWeekOpen(true)}
          className="panel"
          style={{
            width: "100%",
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 12,
            textAlign: "left",
            cursor: "pointer",
          }}
          aria-label="Åpne ukesplan"
        >
          <span className="plate-icon" style={{ color: "var(--brand-orange)" }}>
            📅
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span
              className="eyebrow"
              style={{ color: "var(--brand-orange)", letterSpacing: "0.12em" }}
            >
              Denne uka
            </span>
            <span
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--brand-ink)",
                marginTop: 4,
              }}
            >
              {plannedSummary ?? "Ingen planlagte dager enda"}
            </span>
            {!plannedSummary && (
              <span style={{ fontSize: 11.5, color: "var(--brand-muted)" }}>
                Sett dager via ⋯ på en mal
              </span>
            )}
          </span>
          <span style={{ color: "var(--brand-muted)", fontSize: 18 }}>›</span>
        </button>

        {/* recent workouts */}
        {recentWorkouts.length > 0 && (
          <section>
            <div className="section-head">
              <div className="section-label">Siste økter</div>
              <Link className="section-link" href="/historikk">
                Se alle →
              </Link>
            </div>
            <div className="panel-list">
              {recentWorkouts.map((w) => (
                <Link key={w.workout_id} href={`/historikk/${w.workout_id}`} className="list-row">
                  <div className="plate-icon">✓</div>
                  <div className="row-main">
                    <div className="row-name">{w.day_name ?? "Frittstående"}</div>
                    <div className="row-meta">
                      <span className="tnum">
                        {fmtRelative(w.completed_at)} · {w.set_count} sett
                        {w.duration_min ? ` · ${w.duration_min} min` : ""}
                      </span>
                    </div>
                  </div>
                  <span className="row-trail">›</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="footnote">AI Coach · forged daily</div>
      </div>

      <WeekPlanSheet open={weekOpen} templates={templates} onClose={() => setWeekOpen(false)} />
    </div>
  )
}
