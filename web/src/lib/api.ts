import { createClient } from "./supabase"

export type Message = {
  role: "user" | "assistant"
  content: string
}

export type Persona = "friend" | "sergeant" | "analyst"

export type WorkoutSet = {
  exercise_id: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  rpe: number | null
}

export type Workout = {
  workout_id: string
  date: string
  notes: string | null
  rpe: number | null
  started_at: string | null
  sets: WorkoutSet[]
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

export async function sendMessage(
  messages: Message[],
  persona: Persona = "sergeant"
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ messages, persona }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const data = await res.json()
  return data.message as string
}

export async function getWorkouts(): Promise<Workout[]> {
  const res = await fetch(`${API_BASE}/api/workouts`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Workout[]>
}

export interface ProgramExercise {
  id: string
  exercise_id: string
  name: string
  muscle_groups: string[]
  order_index: number
  notes: string | null
  image_url: string | null
  sets: {
    id: string
    set_number: number
    reps: number
    weight_kg: number | null
    notes: string | null
  }[]
}

export type Exercise = {
  id: string
  name: string
  muscle_groups: string[]
  equipment: string[]
  difficulty: string
  primary_muscles: string[]
  secondary_muscles: string[]
  image_urls: string[]
  is_custom?: boolean
  is_favorite?: boolean
  last_used?: string | null
}

export type ExerciseDetail = Exercise & {
  force: string | null
  mechanic: string | null
  category: string | null
  instructions: string
}

export async function getExercises(muscleGroup?: string): Promise<Exercise[]> {
  const base = `${API_BASE}/api/exercises`
  const url = muscleGroup ? `${base}?muscle_group=${encodeURIComponent(muscleGroup)}` : base
  const res = await fetch(url, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Exercise[]>
}

export async function createCustomExercise(body: {
  name: string
  primary_muscles?: string[]
  equipment?: string[]
}): Promise<{ id: string; name: string; is_custom: boolean }> {
  const res = await fetch(`${API_BASE}/api/exercises`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export async function deleteCustomExercise(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/exercises/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function setExerciseFavorite(id: string, fav: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/api/exercises/${id}/favorite`, {
    method: fav ? "POST" : "DELETE",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function getExerciseDetail(id: string): Promise<ExerciseDetail> {
  const res = await fetch(`${API_BASE}/api/exercises/${encodeURIComponent(id)}`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ExerciseDetail>
}

export async function logSet(
  workoutId: string,
  body: {
    exercise_id: string
    set_number: number
    reps: number
    weight_kg?: number | null
    rpe?: number | null
  }
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workouts/${workoutId}/sets`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function completeWorkout(
  workoutId: string,
  body?: { rpe?: number; notes?: string }
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workouts/${workoutId}/complete`, {
    method: "PATCH",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function shareWorkout(workoutId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workouts/${workoutId}/share`, {
    method: "POST",
    headers: await getAuthHeaders(),
  })
  if (!res.ok && res.status !== 409) throw new Error(`API ${res.status}`)
}

/* ── In-progress workout ────────────────────────────────── */

export type InProgressWorkout = {
  workout_id: string
  started_at: string | null
  program_day_id: string | null
  day_name: string | null
  program_id: string | null
  logged_sets: {
    exercise_id: string
    set_number: number
    reps: number
    weight_kg: number | null
  }[]
  sets_logged: number
}

export async function getInProgressWorkout(): Promise<InProgressWorkout | null> {
  const res = await fetch(`${API_BASE}/api/workouts/in-progress`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<InProgressWorkout | null>
}

export type ProgressionDataPoint = {
  completed_at: string | null
  best_weight_kg: number
  best_reps: number
  total_volume_kg: number
  set_count: number
  estimated_1rm_kg: number | null
}

export type ExerciseProgression = {
  exercise_id: string
  exercise_name: string
  data_points: ProgressionDataPoint[]
}

export async function getExerciseProgression(exerciseId: string): Promise<ExerciseProgression> {
  const res = await fetch(
    `${API_BASE}/api/exercises/${encodeURIComponent(exerciseId)}/progression`,
    { headers: await getAuthHeaders() }
  )
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ExerciseProgression>
}

export type UserStats = {
  total_workouts: number
  current_streak_days: number
  longest_streak_days: number
  this_week_count: number
  all_time_volume_kg: number
  most_trained_muscles: { muscle: string; set_count: number }[]
}

export async function getUserStats(): Promise<UserStats> {
  const res = await fetch(`${API_BASE}/api/users/me/stats`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<UserStats>
}

export type BodyMetric = {
  id: string
  recorded_at: string | null
  weight_kg: number | null
  body_fat_pct: number | null
  notes: string | null
}

export async function getBodyMetrics(): Promise<BodyMetric[]> {
  const res = await fetch(`${API_BASE}/api/users/me/body-metrics`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<BodyMetric[]>
}

export async function createBodyMetric(body: {
  weight_kg?: number | null
  body_fat_pct?: number | null
  notes?: string | null
  recorded_at?: string | null
}): Promise<BodyMetric> {
  const res = await fetch(`${API_BASE}/api/users/me/body-metrics`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<BodyMetric>
}

export async function deleteBodyMetric(metricId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/users/me/body-metrics/${metricId}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export type WorkoutSummary = {
  workout_id: string
  completed_at: string | null
  started_at: string | null
  notes: string | null
  rpe: number | null
  day_name: string | null
  program_name: string | null
  exercise_count: number
  set_count: number
  total_volume_kg: number
  duration_min: number | null
}

export async function getWorkoutHistory(): Promise<WorkoutSummary[]> {
  const res = await fetch(`${API_BASE}/api/workouts`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<WorkoutSummary[]>
}

export async function unlogSet(
  workoutId: string,
  exerciseId: string,
  setNumber: number
): Promise<void> {
  const params = new URLSearchParams({
    exercise_id: exerciseId,
    set_number: String(setNumber),
  })
  const res = await fetch(`${API_BASE}/api/workouts/${workoutId}/sets?${params}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function discardWorkout(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workouts/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function removeWorkoutExercise(workoutId: string, exerciseId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workouts/${workoutId}/exercises/${exerciseId}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function swapWorkoutExercise(
  workoutId: string,
  exerciseId: string,
  newExerciseId: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workouts/${workoutId}/exercises/${exerciseId}`, {
    method: "PATCH",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ new_exercise_id: newExerciseId }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export type WorkoutDetail = {
  workout_id: string
  template_id?: string | null
  started_at: string | null
  completed_at: string | null
  day_name: string | null
  exercises: ProgramExercise[]
  logged_sets: {
    exercise_id: string
    set_number: number
    reps: number
    weight_kg: number | null
    rpe: number | null
  }[]
}

export type PreviousSets = Record<
  string,
  { set_number: number; reps: number; weight_kg: number | null }[]
>

export async function getPreviousSets(workoutId: string): Promise<PreviousSets> {
  const res = await fetch(`${API_BASE}/api/workouts/${workoutId}/previous-sets`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<PreviousSets>
}

export async function getWorkout(id: string): Promise<WorkoutDetail> {
  const res = await fetch(`${API_BASE}/api/workouts/${id}`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<WorkoutDetail>
}

/* ── Templates ──────────────────────────────────────────── */

export type TemplateSetPlan = {
  id: string
  set_number: number
  reps: number | null
  weight_kg: number | null
}
export type TemplateExercise = {
  id: string
  exercise_id: string
  position: number
  sets: TemplateSetPlan[]
}
export type Template = {
  id: string
  name: string
  folder_id: string | null
  exercise_count?: number
  scheduled_days?: number[]
}
export type TemplateDetail = {
  id: string
  name: string
  folder_id: string | null
  exercises: TemplateExercise[]
  scheduled_days?: number[]
}
export type TemplateFolder = { id: string; name: string; template_count: number }
export type NextWorkout = { template_id: string | null; name: string | null; reason: string | null }

export async function getTemplates(): Promise<Template[]> {
  const res = await fetch(`${API_BASE}/api/templates`, {
    headers: await getAuthHeaders(),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Template[]>
}

export async function getTemplate(id: string): Promise<TemplateDetail> {
  const res = await fetch(`${API_BASE}/api/templates/${id}`, {
    headers: await getAuthHeaders(),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<TemplateDetail>
}

export async function createTemplate(name: string, folderId?: string): Promise<Template> {
  const res = await fetch(`${API_BASE}/api/templates`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ name, folder_id: folderId ?? null }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Template>
}

export async function getTemplateFolders(): Promise<TemplateFolder[]> {
  const res = await fetch(`${API_BASE}/api/template-folders`, {
    headers: await getAuthHeaders(),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<TemplateFolder[]>
}

export async function getNextWorkout(): Promise<NextWorkout> {
  const res = await fetch(`${API_BASE}/api/coach/next-workout`, {
    headers: await getAuthHeaders(),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<NextWorkout>
}

export async function startWorkoutFromTemplate(
  templateId?: string
): Promise<{ workout_id: string; template_id: string | null }> {
  const res = await fetch(`${API_BASE}/api/workouts`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ template_id: templateId ?? null }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export async function createTemplateFolder(name: string): Promise<TemplateFolder> {
  const res = await fetch(`${API_BASE}/api/template-folders`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<TemplateFolder>
}

export async function updateTemplate(
  id: string,
  body: { name?: string; folder_id?: string | null; scheduled_days?: number[] }
): Promise<{ id: string; status: string }> {
  const res = await fetch(`${API_BASE}/api/templates/${id}`, {
    method: "PATCH",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export async function deleteTemplate(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/templates/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function addExerciseToTemplate(
  templateId: string,
  body: { exercise_id: string; sets?: number; reps?: number; weight_kg?: number | null }
): Promise<{ template_exercise_id: string; exercise_id: string }> {
  const res = await fetch(`${API_BASE}/api/templates/${templateId}/exercises`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export async function removeExerciseFromTemplate(
  templateId: string,
  exerciseId: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/templates/${templateId}/exercises/${exerciseId}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function updateTemplateExercise(
  templateId: string,
  exerciseId: string,
  body: { sets?: number; reps?: number; weight_kg?: number | null }
): Promise<{ id: string; status: string }> {
  const res = await fetch(`${API_BASE}/api/templates/${templateId}/exercises/${exerciseId}`, {
    method: "PATCH",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export async function createTemplateFromWorkout(body: {
  workout_id: string
  name: string
  folder_id?: string | null
}): Promise<{ id: string; name: string }> {
  const res = await fetch(`${API_BASE}/api/templates/from-workout`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ folder_id: null, ...body }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}
