import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import ThemeToggle from "@/components/theme/ThemeToggle"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface LoggedSet {
  exercise_id: string
  set_number: number
  reps: number
  weight_kg: number | null
  rpe: number | null
}

interface ExerciseDetail {
  id: string
  exercise_id: string
  name: string
}

interface WorkoutDetail {
  workout_id: string
  started_at: string | null
  completed_at: string | null
  day_name: string | null
  exercises: ExerciseDetail[]
  logged_sets: LoggedSet[]
}

function fmtDateLong(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString("no-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ workoutId: string }>
}) {
  const { workoutId } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const res = await fetch(`${API_BASE}/api/workouts/${workoutId}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  })
  if (res.status === 404) notFound()
  if (!res.ok) throw new Error(`Failed to load workout: ${res.status}`)
  const workout: WorkoutDetail = await res.json()

  const exerciseNames: Record<string, string> = {}
  for (const ex of workout.exercises ?? []) {
    exerciseNames[ex.exercise_id] = ex.name
  }

  const setsByExercise: Record<string, LoggedSet[]> = {}
  for (const s of workout.logged_sets ?? []) {
    if (!setsByExercise[s.exercise_id]) setsByExercise[s.exercise_id] = []
    setsByExercise[s.exercise_id].push(s)
  }
  const exerciseIds = Object.keys(setsByExercise)

  const totalSets = workout.logged_sets?.length ?? 0
  const totalVolume = (workout.logged_sets ?? []).reduce(
    (sum, s) => sum + s.reps * (s.weight_kg ?? 0),
    0
  )

  return (
    <div
      className="screen forge"
      style={{ background: "var(--brand-canvas)", color: "var(--brand-ink)" }}
    >
      <div className="app-topbar" style={{ padding: "16px 20px 4px" }}>
        <Link href="/historikk" className="section-link" style={{ fontSize: 13 }}>
          ‹ Historikk
        </Link>
        <div className="datebar">
          <span className="tick" />
          Økt
        </div>
        <ThemeToggle />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 24px" }}>
        <div className="eyebrow" style={{ marginTop: 8 }}>
          Fullført økt
        </div>
        <h1 className="display-title" style={{ fontSize: 30, marginTop: 10 }}>
          {workout.day_name ?? "Frittstående økt"}
        </h1>
        <p
          style={{
            fontSize: 12.5,
            color: "var(--brand-muted)",
            marginTop: 8,
            textTransform: "capitalize",
          }}
        >
          {fmtDateLong(workout.completed_at)} · <span className="tnum">{totalSets}</span> sett
          {totalVolume > 0 ? (
            <>
              {" "}
              · <span className="tnum">{Math.round(totalVolume).toLocaleString("no-NO")}</span> kg
            </>
          ) : null}
        </p>

        {exerciseIds.length === 0 ? (
          <div style={{ color: "var(--brand-muted)", fontSize: 13, marginTop: 20 }}>
            Ingen sett ble logget for denne økten.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
            {exerciseIds.map((exId) => {
              const sets = setsByExercise[exId]
              const name = exerciseNames[exId] ?? exId
              return (
                <div key={exId} className="panel">
                  <div
                    className="row-name"
                    style={{ fontSize: 15, marginBottom: 10, color: "var(--brand-orange)" }}
                  >
                    {name}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {sets.map((s) => (
                      <div key={s.set_number} className="exercise-row">
                        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span
                            className="tnum"
                            style={{
                              width: 22,
                              color: "var(--brand-orange-deep)",
                              fontWeight: 800,
                              fontSize: 13,
                            }}
                          >
                            {s.set_number}
                          </span>
                          <span className="ex-name tnum">
                            {s.weight_kg != null ? `${s.weight_kg} kg` : "—"} × {s.reps}
                          </span>
                        </span>
                        {s.rpe != null && <span className="ex-spec tnum">RPE {s.rpe}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="footnote">AI Coach · treningslogg</div>
      </div>
    </div>
  )
}
