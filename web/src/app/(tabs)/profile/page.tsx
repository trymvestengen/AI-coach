import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import type { FullProfile } from "@/lib/profile"
import ProfileClient from "./ProfileClient"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface Workout {
  workout_id: string
  completed_at: string
  notes: string | null
  rpe: number | null
  set_count: number
  total_volume_kg: number
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

  const [profileRes, workoutsRes] = await Promise.all([
    fetch(`${API_BASE}/api/users/profile`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/workouts`, { headers, cache: "no-store" }),
  ])

  if (profileRes.status === 404) redirect("/onboarding")
  if (!profileRes.ok) throw new Error(`Failed to load profile: ${profileRes.status}`)

  const profile: FullProfile = await profileRes.json()

  const workouts: Workout[] = workoutsRes.ok ? await workoutsRes.json() : []
  const days = new Set(workouts.map((w) => w.completed_at.slice(0, 10)))
  const streak = calcStreak(days)
  const totalVolumeKg = workouts.reduce((sum, w) => sum + (w.total_volume_kg ?? 0), 0)
  const totalWorkouts = workouts.length

  return (
    <ProfileClient
      initialProfile={profile}
      accessToken={accessToken}
      stats={{
        totalWorkouts,
        streak,
        totalVolumeT: totalVolumeKg / 1000,
      }}
    />
  )
}
