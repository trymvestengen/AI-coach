import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import ProgramLibrary, { type TodaysWorkoutInfo } from "@/components/program/library/ProgramLibrary"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function safeFetch(path: string, token: string): Promise<unknown> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function computeTodaysWorkout(
  active: {
    id: string
    days: { id: string; day_number: number; name: string; exercises: unknown[] }[]
  } | null
): TodaysWorkoutInfo | null {
  if (!active) return null
  const jsDay = new Date().getDay()
  const todayDayNumber = jsDay === 0 ? 7 : jsDay
  const day = active.days.find((d) => d.day_number === todayDayNumber)
  if (!day || day.exercises.length === 0) return null
  return {
    programId: active.id,
    dayId: day.id,
    dayName: day.name,
    exerciseCount: day.exercises.length,
    nextDayName: null,
  }
}

export default async function ProgramPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const token = session.access_token

  const [programs, folders, active, inProgress] = await Promise.all([
    safeFetch("/api/programs", token),
    safeFetch("/api/folders", token),
    safeFetch("/api/programs/active", token),
    safeFetch("/api/workouts/in-progress", token),
  ])

  type Active = {
    id: string
    days: { id: string; day_number: number; name: string; exercises: unknown[] }[]
  } | null
  const todays = computeTodaysWorkout(active as Active)
  const hasActive = active !== null

  return (
    <ProgramLibrary
      programs={(programs as Parameters<typeof ProgramLibrary>[0]["programs"]) ?? []}
      folders={(folders as Parameters<typeof ProgramLibrary>[0]["folders"]) ?? []}
      todaysWorkout={todays}
      hasActiveProgram={hasActive}
      inProgress={(inProgress as Parameters<typeof ProgramLibrary>[0]["inProgress"]) ?? null}
    />
  )
}
