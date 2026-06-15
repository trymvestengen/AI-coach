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

  const [profileRes, workoutsRes, nextWorkoutRes, inProgressRes, templatesRes] = await Promise.all([
    fetch(`${API_BASE}/api/users/profile`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/workouts`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/coach/next-workout`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/workouts/in-progress`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/templates`, { headers, cache: "no-store" }),
  ])

  if (profileRes.status === 404) redirect("/onboarding")
  if (!profileRes.ok) throw new Error(`Failed to load profile: ${profileRes.status}`)

  const profile = await profileRes.json()

  const workouts: Workout[] = workoutsRes.ok ? await workoutsRes.json() : []
  const streak = calcStreak(workouts)
  const { count: workoutsThisWeek, volumeT: weeklyVolumeT } = calcWeeklyStats(workouts)

  interface NextWorkoutLite {
    template_id: string | null
    name: string | null
    reason: string | null
  }
  const nextWorkout: NextWorkoutLite | null = nextWorkoutRes.ok ? await nextWorkoutRes.json() : null

  interface InProgressLite {
    workout_id: string
    day_name: string | null
    sets_logged: number
  }
  const inProgressRaw = inProgressRes.ok ? await inProgressRes.json() : null
  const inProgress: InProgressLite | null = inProgressRaw
    ? {
        workout_id: inProgressRaw.workout_id,
        day_name: inProgressRaw.day_name,
        sets_logged: inProgressRaw.sets_logged,
      }
    : null

  const recentWorkouts = workouts.slice(0, 3).map((w) => ({
    workout_id: w.workout_id,
    completed_at: w.completed_at,
    day_name: w.day_name,
    set_count: w.set_count,
    duration_min: w.duration_min,
  }))

  interface TemplateRaw {
    id: string
    name: string
    scheduled_days?: number[]
  }
  const templatesRaw: TemplateRaw[] = templatesRes.ok ? await templatesRes.json() : []
  const templates = templatesRaw.map((t) => ({
    id: t.id,
    name: t.name,
    scheduled_days: t.scheduled_days,
  }))

  return (
    <HomeScreen
      firstName={profile.first_name}
      streak={streak}
      workoutsThisWeek={workoutsThisWeek}
      weeklyVolumeT={weeklyVolumeT}
      nextWorkout={nextWorkout}
      inProgress={inProgress}
      recentWorkouts={recentWorkouts}
      templates={templates}
    />
  )
}
