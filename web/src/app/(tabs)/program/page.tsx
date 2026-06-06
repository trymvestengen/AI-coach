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

interface ActiveProgramShape {
  id: string
  days: { id: string; day_number: number; name: string; exercises: { name: string }[] }[]
}

function computeTodaysWorkout(active: ActiveProgramShape | null): TodaysWorkoutInfo | null {
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

async function fetchProgramPreviews(
  programIds: string[],
  token: string
): Promise<Record<string, string[]>> {
  // Fetch each program in parallel and grab the first 3 exercise names from day 1.
  // For programs with many days, day 1's exercise list is a good summary.
  const previews = await Promise.all(
    programIds.map(async (id) => {
      const data = (await safeFetch(`/api/programs/${id}`, token)) as {
        days?: { exercises?: { name?: string }[] }[]
      } | null
      const firstDayExercises = data?.days?.[0]?.exercises ?? []
      const names = firstDayExercises
        .map((e) => e.name)
        .filter((n): n is string => typeof n === "string")
        .slice(0, 3)
      return [id, names] as const
    })
  )
  return Object.fromEntries(previews)
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

  const programList = (programs as Parameters<typeof ProgramLibrary>[0]["programs"]) ?? []
  const folderList = (folders as Parameters<typeof ProgramLibrary>[0]["folders"]) ?? []
  const todays = computeTodaysWorkout(active as ActiveProgramShape | null)
  const hasActive = active !== null

  const previews = await fetchProgramPreviews(
    programList.map((p) => p.id),
    token
  )

  return (
    <ProgramLibrary
      programs={programList}
      folders={folderList}
      todaysWorkout={todays}
      hasActiveProgram={hasActive}
      inProgress={(inProgress as Parameters<typeof ProgramLibrary>[0]["inProgress"]) ?? null}
      programPreviews={previews}
    />
  )
}
