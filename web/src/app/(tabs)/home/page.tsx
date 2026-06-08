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

  const [profileRes, workoutsRes, programRes, inProgressRes] = await Promise.all([
    fetch(`${API_BASE}/api/users/profile`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/workouts`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/programs/active`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/workouts/in-progress`, { headers, cache: "no-store" }),
  ])

  if (profileRes.status === 404) redirect("/onboarding")
  if (!profileRes.ok) throw new Error(`Failed to load profile: ${profileRes.status}`)

  const profile = await profileRes.json()

  const workouts: Workout[] = workoutsRes.ok ? await workoutsRes.json() : []
  const streak = calcStreak(workouts)
  const { count: workoutsThisWeek, volumeT: weeklyVolumeT } = calcWeeklyStats(workouts)

  interface ProgramDayLite {
    id: string
    name: string
    weekdays: number[]
    frequency_per_week: number | null
  }
  interface ActiveProgramFull {
    id: string
    name: string
    days: ProgramDayLite[]
  }

  const fullProgram: ActiveProgramFull | null = programRes.ok ? await programRes.json() : null

  // Find today's planned workout based on weekday match
  const todayDow = new Date().getDay() // 0=Sun..6=Sat
  const todayKey = new Date().toISOString().slice(0, 10)
  const completedTodayDayNames = new Set(
    workouts
      .filter((w) => w.completed_at?.slice(0, 10) === todayKey)
      .map((w) => w.day_name)
      .filter((n): n is string => n !== null)
  )

  const todaysDay = fullProgram?.days.find((d) => d.weekdays.includes(todayDow)) ?? null
  const todaysWorkout = todaysDay
    ? {
        dayId: todaysDay.id,
        dayName: todaysDay.name,
        programId: fullProgram!.id,
        completed: completedTodayDayNames.has(todaysDay.name),
      }
    : null

  const activeProgram = fullProgram
    ? { name: fullProgram.name, dayCount: fullProgram.days.length }
    : null

  interface InProgressLite {
    workout_id: string
    program_id: string | null
    day_name: string | null
    sets_logged: number
    started_at: string | null
  }
  const inProgressRaw = inProgressRes.ok ? await inProgressRes.json() : null
  const inProgress: InProgressLite | null = inProgressRaw
    ? {
        workout_id: inProgressRaw.workout_id,
        program_id: inProgressRaw.program_id,
        day_name: inProgressRaw.day_name,
        sets_logged: inProgressRaw.sets_logged,
        started_at: inProgressRaw.started_at,
      }
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
      todaysWorkout={todaysWorkout}
      inProgress={inProgress}
      recentWorkouts={recentWorkouts}
    />
  )
}
