import { notFound, redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import WorkoutPage from "@/components/training/workout/WorkoutPage"
import type { WorkoutDetail, Exercise } from "@/lib/api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface PageProps {
  params: Promise<{ workoutId: string }>
}

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

export default async function WorkoutRunPage({ params }: PageProps) {
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
  const token = session.access_token

  const res = await fetch(`${API_BASE}/api/workouts/${workoutId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (res.status === 404) notFound()
  if (!res.ok) throw new Error(`Failed to load workout: ${res.status}`)
  const workout = (await res.json()) as WorkoutDetail

  const exercises = await safeFetch("/api/exercises", token)

  const exerciseNames = Object.fromEntries(
    ((exercises as Exercise[] | null) ?? []).map((e) => [e.id, e.name])
  )

  return <WorkoutPage workout={workout} exerciseNames={exerciseNames} />
}
