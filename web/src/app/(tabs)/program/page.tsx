import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import TrainingLibrary from "@/components/training/library/TrainingLibrary"
import type { Template, TemplateFolder, NextWorkout, InProgressWorkout } from "@/lib/api"

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

  const [templates, folders, nextWorkout, inProgress] = await Promise.all([
    safeFetch("/api/templates", token),
    safeFetch("/api/template-folders", token),
    safeFetch("/api/coach/next-workout", token),
    safeFetch("/api/workouts/in-progress", token),
  ])

  return (
    <TrainingLibrary
      templates={(templates as Template[] | null) ?? []}
      folders={(folders as TemplateFolder[] | null) ?? []}
      nextWorkout={nextWorkout as NextWorkout | null}
      inProgress={inProgress as InProgressWorkout | null}
    />
  )
}
