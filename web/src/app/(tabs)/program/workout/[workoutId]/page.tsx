import { notFound, redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import WorkoutRun from "@/components/program/workout/WorkoutRun"
import type { WorkoutDetail } from "@/lib/api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface PageProps {
  params: Promise<{ workoutId: string }>
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

  const res = await fetch(`${API_BASE}/api/workouts/${workoutId}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  })
  if (res.status === 404) notFound()
  if (!res.ok) throw new Error(`Failed to load workout: ${res.status}`)
  const workout = (await res.json()) as WorkoutDetail

  return <WorkoutRun workout={workout} />
}
