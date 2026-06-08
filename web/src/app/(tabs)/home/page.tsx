// web/src/app/(tabs)/home/page.tsx
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import HomeScreen from "@/components/home/HomeScreen"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface Workout {
  workout_id: string
  completed_at: string
  day_name: string | null
  set_count: number
  total_volume_kg: number
  duration_min: number | null
}

function calcStreak(workouts: Workout[]): number {
  const days = new Set(workouts.map((w) => w.completed_at.slice(0, 10)))
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const startOffset = days.has(todayStr) ? 0 : 1
  let streak = 0
  for (let i = startOffset; ; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const s = d.toISOString().slice(0, 10)
    if (days.has(s)) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function calcWeeklyStats(workouts: Workout[]): { count: number; volumeT: number } {
  const monday = getMonday(new Date())
  const weekWorkouts = workouts.filter((w) => new Date(w.completed_at) >= monday)
  const count = weekWorkouts.length
  const volumeKg = weekWorkouts.reduce((sum, w) => sum + (w.total_volume_kg ?? 0), 0)
  return { count, volumeT: volumeKg / 1000 }
}

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const headers = { Authorization: `Bearer ${session.access_token}` }

  const [profileRes, workoutsRes, programRes] = await Promise.all([
    fetch(`${API_BASE}/api/users/profile`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/workouts`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/programs/active`, { headers, cache: "no-store" }),
  ])

  if (profileRes.status === 404) redirect("/onboarding")
  if (!profileRes.ok) throw new Error(`Failed to load profile: ${profileRes.status}`)

  const profile = await profileRes.json()

  const workouts: Workout[] = workoutsRes.ok ? await workoutsRes.json() : []
  const streak = calcStreak(workouts)
  const { count: workoutsThisWeek, volumeT: weeklyVolumeT } = calcWeeklyStats(workouts)

  const activeProgram = programRes.ok
    ? await programRes.json().then((p: { name: string; days: unknown[] }) => ({
        name: p.name,
        dayCount: p.days.length,
      }))
    : null

  const recentWorkouts = workouts.slice(0, 3).map((w) => ({
    workout_id: w.workout_id,
    completed_at: w.completed_at,
    day_name: w.day_name,
    set_count: w.set_count,
    duration_min: w.duration_min,
  }))

  return (
    <HomeScreen
      firstName={profile.first_name}
      streak={streak}
      workoutsThisWeek={workoutsThisWeek}
      weeklyVolumeT={weeklyVolumeT}
      activeProgram={activeProgram}
      recentWorkouts={recentWorkouts}
    />
  )
}
