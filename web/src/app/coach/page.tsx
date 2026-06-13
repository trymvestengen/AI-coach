import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import CoachClient, { type PromptContext, type RecentSession } from "./CoachClient"
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

  const [profileRes, workoutsRes, recentRes] = await Promise.all([
    fetch(`${API_BASE}/api/users/profile`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/workouts`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/chat/sessions/recent`, { headers, cache: "no-store" }),
  ])

  let recentSessions: RecentSession[] = []
  if (recentRes.ok) {
    recentSessions = (await recentRes.json()) as RecentSession[]
  }

  // Always land on the empty-state. User picks from the "Tidligere samtaler"
  // list to resume an old chat, or starts a fresh one.
  const sessionId: string | null = null
  const messages: Message[] = []

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
      recentSessions={recentSessions}
    />
  )
}
