import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import CoachClient, { type PromptContext } from "./CoachClient"
import type { Message } from "./ChatBody"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface ProfileShape {
  first_name?: string | null
  goals?: string[] | null
  experience_level?: string | null
  training_days_per_week?: number | null
  injuries?: Array<{ body_part: string }> | null
}

interface WorkoutSet {
  exercise_id: string
}
interface WorkoutShape {
  completed_at: string
  sets: WorkoutSet[]
}

export default async function CoachPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const accessToken = session.access_token
  const headers = { Authorization: `Bearer ${accessToken}` }

  const [sessionRes, profileRes, workoutsRes] = await Promise.all([
    fetch(`${API_BASE}/api/chat/sessions/current`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/users/profile`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/workouts`, { headers, cache: "no-store" }),
  ])

  let sessionId: string | null = null
  let messages: Message[] = []

  if (sessionRes.ok) {
    const body = await sessionRes.json()
    sessionId = body.id as string
    const msgRes = await fetch(`${API_BASE}/api/chat/sessions/${sessionId}/messages`, {
      headers,
      cache: "no-store",
    })
    if (msgRes.ok) {
      const rows = (await msgRes.json()) as Array<{
        id: string
        role: string
        content: { text?: string; tool_name?: string }
      }>
      messages = rows
        .filter((r) => r.role === "user" || r.role === "assistant" || r.role === "tool_use")
        .map((r) => ({
          id: r.id,
          role: r.role as Message["role"],
          content: r.content,
          state: r.role === "tool_use" ? ("done" as const) : undefined,
        }))
    }
  }

  let promptContext: PromptContext = {}
  if (profileRes.ok) {
    const p = (await profileRes.json()) as ProfileShape
    promptContext = {
      firstName: p.first_name ?? null,
      goals: p.goals ?? [],
      experienceLevel: p.experience_level ?? null,
      trainingDaysPerWeek: p.training_days_per_week ?? null,
      activeInjury: p.injuries?.[0]?.body_part ?? null,
    }
  }

  if (workoutsRes.ok) {
    const workouts = (await workoutsRes.json()) as WorkoutShape[]
    if (workouts.length > 0) {
      const latest = workouts[0]
      const exerciseCounts: Record<string, number> = {}
      for (const set of latest.sets) {
        exerciseCounts[set.exercise_id] = (exerciseCounts[set.exercise_id] ?? 0) + 1
      }
      const topExercise = Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
      promptContext.recentExercise = topExercise ?? null
    }
  }

  return (
    <CoachClient
      initialSessionId={sessionId}
      initialMessages={messages}
      accessToken={accessToken}
      promptContext={promptContext}
    />
  )
}
