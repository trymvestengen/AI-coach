import { redirect } from "next/navigation"
import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase-server"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface WorkoutSummary {
  workout_id: string
  completed_at: string | null
  day_name: string | null
  program_name: string | null
  exercise_count: number
  set_count: number
  total_volume_kg: number
  duration_min: number | null
  rpe: number | null
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
  if (diffDays === 0) return "i dag"
  if (diffDays === 1) return "i går"
  if (diffDays < 7) return `${diffDays} dager siden`
  if (diffDays < 14) return "1 uke siden"
  if (diffDays < 31) return `${Math.floor(diffDays / 7)} uker siden`
  return d.toLocaleDateString("no-NO", { day: "numeric", month: "short" })
}

export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const res = await fetch(`${API_BASE}/api/workouts`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  })
  const workouts: WorkoutSummary[] = res.ok ? await res.json() : []

  const now = new Date()
  const thisMonth = workouts.filter((w) => {
    if (!w.completed_at) return false
    const d = new Date(w.completed_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
  const monthName = now.toLocaleDateString("no-NO", { month: "long" })

  return (
    <div
      className="screen forge"
      style={{ background: "var(--brand-canvas)", color: "var(--brand-ink)" }}
    >
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 24px" }}>
        <div className="eyebrow" style={{ marginTop: 6 }}>
          <span className="tick" />
          Treningslogg
        </div>
        <h1 className="display-title" style={{ fontSize: 34, marginTop: 12 }}>
          Historikk
        </h1>

        <div
          className="panel"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 18,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em" }}>
              Denne måneden
            </div>
            <div style={{ fontSize: 11.5, color: "var(--brand-muted)", marginTop: 3 }}>
              Fullførte økter i {monthName}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              className="tnum"
              style={{
                fontWeight: 700,
                fontSize: 30,
                lineHeight: 1,
                color: "var(--brand-orange-deep)",
              }}
            >
              {thisMonth}
            </div>
            <div style={{ fontSize: 10.5, color: "var(--brand-muted)", marginTop: 4 }}>økter</div>
          </div>
        </div>

        <div className="section-head">
          <div className="section-label">
            Siste økter <span className="meta">· kronologisk</span>
          </div>
        </div>

        {workouts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--brand-muted)",
              marginTop: 40,
              fontSize: 14,
            }}
          >
            Ingen fullførte økter enda.
            <br />
            Start din første økt fra Trening.
          </div>
        ) : (
          <div className="panel-list">
            {workouts.map((w) => (
              <Link key={w.workout_id} href={`/historikk/${w.workout_id}`} className="list-row">
                <div className="plate-icon">✓</div>
                <div className="row-main">
                  <div className="row-name">{w.day_name ?? "Frittstående økt"}</div>
                  <div className="row-meta">
                    {fmtRelative(w.completed_at)} · <span className="tnum">{w.set_count}</span> sett
                    {w.duration_min ? (
                      <>
                        {" "}
                        · <span className="tnum">{w.duration_min}</span> min
                      </>
                    ) : null}
                    {w.rpe !== null ? (
                      <>
                        {" "}
                        · RPE <span className="tnum">{w.rpe}</span>
                      </>
                    ) : null}
                  </div>
                </div>
                <span className="row-trail">›</span>
              </Link>
            ))}
          </div>
        )}

        <div className="footnote">Slutt på logg</div>
      </div>
    </div>
  )
}
