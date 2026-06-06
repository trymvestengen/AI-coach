import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import type { FullProfile } from "@/lib/profile"
import ProfileClient, { type WorkoutSummary, type ActiveProgram } from "./ProfileClient"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface WorkoutSet {
  reps: number | null
  weight_kg: number | null
}

interface Workout {
  id: string
  completed_at: string
  notes: string | null
  rpe: number | null
  sets: WorkoutSet[]
}

function calcStreak(days: Set<string>): number {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const start = days.has(todayStr) ? 0 : 1
  let streak = 0
  for (let i = start; ; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (days.has(d.toISOString().slice(0, 10))) streak++
    else break
  }
  return streak
}

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const accessToken = session.access_token
  const headers = { Authorization: `Bearer ${accessToken}` }

  const [profileRes, workoutsRes, programRes] = await Promise.all([
    fetch(`${API_BASE}/api/users/profile`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/workouts`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/programs/active`, { headers, cache: "no-store" }),
  ])

  if (profileRes.status === 404) redirect("/onboarding")
  if (!profileRes.ok) throw new Error(`Failed to load profile: ${profileRes.status}`)

  const profile: FullProfile = await profileRes.json()

  const workouts: Workout[] = workoutsRes.ok ? await workoutsRes.json() : []
  const days = new Set(workouts.map((w) => w.completed_at.slice(0, 10)))
  const streak = calcStreak(days)
  const totalVolumeKg = workouts
    .flatMap((w) => w.sets)
    .reduce((sum, s) => sum + (s.reps && s.weight_kg ? s.reps * s.weight_kg : 0), 0)
  const totalWorkouts = workouts.length

  const recent: WorkoutSummary[] = workouts.slice(0, 5).map((w) => ({
    id: w.id,
    completed_at: w.completed_at,
    set_count: w.sets.length,
    rpe: w.rpe,
  }))

  let activeProgram: ActiveProgram | null = null
  if (programRes.ok) {
    const p = (await programRes.json()) as { name: string; days: unknown[] }
    activeProgram = { name: p.name, dayCount: p.days.length }
  }

  return (
    <ProfileClient
      initialProfile={profile}
      accessToken={accessToken}
      stats={{
        totalWorkouts,
        streak,
        totalVolumeT: totalVolumeKg / 1000,
      }}
      recentWorkouts={recent}
      activeProgram={activeProgram}
    />
  )
}
