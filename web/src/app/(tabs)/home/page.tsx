// web/src/app/(tabs)/home/page.tsx
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import HomeScreen from "@/components/home/HomeScreen"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface WorkoutSet {
  reps: number | null
  weight_kg: number | null
}

interface Workout {
  completed_at: string
  sets: WorkoutSet[]
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
  const volumeKg = weekWorkouts
    .flatMap((w) => w.sets)
    .reduce((sum, s) => {
      if (s.weight_kg && s.reps) return sum + s.weight_kg * s.reps
      return sum
    }, 0)
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

  // Backend (/api/workouts) returnerer fullføringsdatoen som `date`, ikke
  // `completed_at`, og kan utelate `sets`. Normaliser her så streak/ukestats
  // ikke krasjer på undefined (TypeError: ...reading 'slice').
  type RawWorkout = { date?: string | null; sets?: WorkoutSet[] }
  const rawWorkouts: RawWorkout[] = workoutsRes.ok ? await workoutsRes.json() : []
  const workouts: Workout[] = rawWorkouts
    .filter((w) => Boolean(w.date))
    .map((w) => ({ completed_at: w.date as string, sets: w.sets ?? [] }))
  const streak = calcStreak(workouts)
  const { count: workoutsThisWeek, volumeT: weeklyVolumeT } = calcWeeklyStats(workouts)

  const activeProgram = programRes.ok
    ? await programRes.json().then((p: { name: string; days: unknown[] }) => ({
        name: p.name,
        dayCount: p.days.length,
      }))
    : null

  return (
    <HomeScreen
      firstName={profile.first_name}
      streak={streak}
      workoutsThisWeek={workoutsThisWeek}
      weeklyVolumeT={weeklyVolumeT}
      activeProgram={activeProgram}
    />
  )
}
