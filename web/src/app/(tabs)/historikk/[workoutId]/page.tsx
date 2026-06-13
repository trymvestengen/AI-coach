import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase-server"

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

  return (
    <div style={{ padding: 20, background: "var(--brand-canvas)", minHeight: "100%" }}>
      <Link
        href="/historikk"
        style={{
          color: "var(--brand-orange)",
          fontSize: 13,
          textDecoration: "none",
          display: "inline-block",
          marginBottom: 14,
        }}
      >
        ← Historikk
      </Link>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          marginBottom: 2,
        }}
      >
        {workout.day_name ?? "Frittstående økt"}
      </h1>
      <p
        style={{
          fontSize: 12,
          color: "var(--brand-muted)",
          marginBottom: 20,
          textTransform: "capitalize",
        }}
      >
        {fmtDateLong(workout.completed_at)}
      </p>

      {exerciseIds.length === 0 ? (
        <div style={{ color: "var(--brand-muted)", fontSize: 13 }}>
          Ingen sett ble logget for denne økten.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {exerciseIds.map((exId) => {
            const sets = setsByExercise[exId]
            const name = exerciseNames[exId] ?? exId
            return (
              <div key={exId}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 6px" }}>{name}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {sets.map((s) => (
                    <div
                      key={s.set_number}
                      style={{
                        display: "flex",
                        gap: 10,
                        fontSize: 13,
                        padding: "6px 10px",
                        background: "var(--brand-surface)",
                        border: "1px solid var(--brand-border)",
                        borderRadius: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 24,
                          color: "var(--brand-muted)",
                          fontWeight: 600,
                        }}
                      >
                        {s.set_number}
                      </span>
                      <span style={{ flex: 1, fontWeight: 600 }}>
                        {s.weight_kg != null ? `${s.weight_kg} kg` : "—"}
                      </span>
                      <span style={{ flex: 1, fontWeight: 600 }}>{s.reps} reps</span>
                      {s.rpe != null && (
                        <span style={{ color: "var(--brand-muted)" }}>RPE {s.rpe}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
