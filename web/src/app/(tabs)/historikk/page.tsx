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

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString("no-NO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
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

  return (
    <div style={{ padding: 20, background: "var(--brand-canvas)", minHeight: "100%" }}>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          marginBottom: 4,
        }}
      >
        Treningshistorikk
      </h1>
      <p style={{ fontSize: 13, color: "var(--brand-muted)", marginBottom: 22 }}>
        {workouts.length} {workouts.length === 1 ? "fullført økt" : "fullførte økter"}
      </p>

      {workouts.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "var(--brand-muted)",
            marginTop: 60,
            fontSize: 14,
          }}
        >
          Ingen fullførte økter enda.
          <br />
          Start din første økt fra et program.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {workouts.map((w) => (
            <Link
              key={w.workout_id}
              href={`/historikk/${w.workout_id}`}
              style={{
                display: "block",
                background: "var(--brand-surface)",
                border: "1px solid var(--brand-border)",
                borderRadius: 12,
                padding: 14,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 2,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {w.day_name ?? "Frittstående økt"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--brand-muted)",
                    textTransform: "capitalize",
                  }}
                >
                  {fmtDate(w.completed_at)}
                </div>
              </div>
              {w.program_name && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--brand-muted)",
                    marginBottom: 8,
                  }}
                >
                  {w.program_name}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  fontSize: 11,
                  color: "var(--brand-muted)",
                  flexWrap: "wrap",
                }}
              >
                <span>
                  <b style={{ color: "var(--brand-ink)" }}>{w.set_count}</b> sett
                </span>
                <span>
                  <b style={{ color: "var(--brand-ink)" }}>{w.exercise_count}</b> øvelser
                </span>
                {w.total_volume_kg > 0 && (
                  <span>
                    <b style={{ color: "var(--brand-ink)" }}>
                      {Math.round(w.total_volume_kg).toLocaleString("no-NO")}
                    </b>{" "}
                    kg
                  </span>
                )}
                {w.duration_min !== null && w.duration_min > 0 && (
                  <span>
                    <b style={{ color: "var(--brand-ink)" }}>{w.duration_min}</b> min
                  </span>
                )}
                {w.rpe !== null && (
                  <span style={{ marginLeft: "auto" }}>
                    RPE <b style={{ color: "var(--brand-ink)" }}>{w.rpe}</b>
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
