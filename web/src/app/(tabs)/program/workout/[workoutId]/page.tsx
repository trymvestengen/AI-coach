import { redirect, notFound } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import WorkoutRun from "@/components/program/workout/WorkoutRun"
import type { WorkoutDetail, ProgramFolder } from "@/lib/api"

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
  const headers = { Authorization: `Bearer ${session.access_token}` }

  const [workoutRes, foldersRes] = await Promise.all([
    fetch(`${API_BASE}/api/workouts/${workoutId}`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/folders`, { headers, cache: "no-store" }),
  ])

  if (workoutRes.status === 404) notFound()
  if (!workoutRes.ok) throw new Error(`Failed to load workout: ${workoutRes.status}`)

  const workout = (await workoutRes.json()) as WorkoutDetail
  const folders = (foldersRes.ok ? await foldersRes.json() : []) as ProgramFolder[]

  return <WorkoutRun workout={workout} folders={folders} />
}
