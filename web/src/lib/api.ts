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

export interface ProgramExerciseSet {
  id: string
  set_number: number
  reps: number
  weight_kg: number | null
  notes: string | null
}

export interface ProgramExercise {
  id: string
  exercise_id: string
  name: string
  muscle_groups: string[]
  order_index: number
  notes: string | null
  image_url: string | null
  sets: ProgramExerciseSet[]
}

export type ProgramDay = {
  id: string
  day_number: number
  name: string
  weekdays: number[]
  frequency_per_week: number | null
  exercises: ProgramExercise[]
}

export type WorkoutTemplate = "custom" | "push" | "pull" | "legs" | "full-body" | "upper-body"

export type DaySchedule =
  | { kind: "weekdays"; weekdays: number[] }
  | { kind: "frequency"; frequency_per_week: number }

export type Program = {
  id: string
  name: string
  is_active: boolean
  days_count?: number
  days?: ProgramDay[]
  folder_id?: string | null
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
}

export type ExerciseDetail = Exercise & {
  force: string | null
  mechanic: string | null
  category: string | null
  instructions: string
}

export async function getPrograms(): Promise<Program[]> {
  const res = await fetch(`${API_BASE}/api/programs`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Program[]>
}

export async function getProgram(id: string): Promise<Program> {
  const res = await fetch(`${API_BASE}/api/programs/${id}`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Program>
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

export async function addExerciseToDay(
  programId: string,
  dayId: string,
  body: { exercise_id: string }
): Promise<ProgramExercise> {
  const res = await fetch(`${API_BASE}/api/programs/${programId}/days/${dayId}/exercises`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramExercise>
}

export async function getExerciseDetail(id: string): Promise<ExerciseDetail> {
  const res = await fetch(`${API_BASE}/api/exercises/${encodeURIComponent(id)}`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ExerciseDetail>
}

export async function addSet(
  programId: string,
  dayId: string,
  exerciseId: string,
  body: { reps: number; weight_kg?: number | null; notes?: string | null }
): Promise<ProgramExerciseSet> {
  const res = await fetch(
    `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}/sets`,
    {
      method: "POST",
      headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramExerciseSet>
}

export async function updateSet(
  programId: string,
  dayId: string,
  exerciseId: string,
  setId: string,
  body: { reps: number; weight_kg: number | null; notes?: string | null }
): Promise<ProgramExerciseSet> {
  const res = await fetch(
    `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}/sets/${setId}`,
    {
      method: "PATCH",
      headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramExerciseSet>
}

export async function deleteSet(
  programId: string,
  dayId: string,
  exerciseId: string,
  setId: string
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}/sets/${setId}`,
    {
      method: "DELETE",
      headers: await getAuthHeaders(),
    }
  )
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function deleteExercise(
  programId: string,
  dayId: string,
  exerciseId: string
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}`,
    {
      method: "DELETE",
      headers: await getAuthHeaders(),
    }
  )
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function deleteProgram(programId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/programs/${programId}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function getActiveProgram(): Promise<Program> {
  const res = await fetch(`${API_BASE}/api/programs/active`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Program>
}

export async function startWorkout(
  programDayId?: string
): Promise<{ workout_id: string; started_at: string }> {
  const res = await fetch(`${API_BASE}/api/workouts`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ program_day_id: programDayId ?? null }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
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

/* ── Folders ────────────────────────────────────────────── */

export type ProgramFolder = {
  id: string
  name: string
  program_count: number
}

export async function getFolders(): Promise<ProgramFolder[]> {
  const res = await fetch(`${API_BASE}/api/folders`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramFolder[]>
}

export async function createFolder(name: string): Promise<ProgramFolder> {
  const res = await fetch(`${API_BASE}/api/folders`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramFolder>
}

export async function renameFolder(id: string, name: string): Promise<ProgramFolder> {
  const res = await fetch(`${API_BASE}/api/folders/${id}`, {
    method: "PATCH",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramFolder>
}

export async function deleteFolder(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/folders/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

/* ── Program patch ──────────────────────────────────────── */

export async function patchProgram(
  id: string,
  body: { is_active?: boolean; folder_id?: string | null; name?: string }
): Promise<Program> {
  const res = await fetch(`${API_BASE}/api/programs/${id}`, {
    method: "PATCH",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Program>
}

/* ── In-progress workout ────────────────────────────────── */

export type InProgressWorkout = {
  workout_id: string
  started_at: string | null
  program_day_id: string | null
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

export type WorkoutDetail = {
  workout_id: string
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

export async function getWorkout(id: string): Promise<WorkoutDetail> {
  const res = await fetch(`${API_BASE}/api/workouts/${id}`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<WorkoutDetail>
}

/* ── Program from workout ───────────────────────────────── */

export async function createProgramFromWorkout(body: {
  workout_id: string
  name: string
  folder_id: string | null
}): Promise<Program> {
  const res = await fetch(`${API_BASE}/api/programs/from-workout`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Program>
}

/* ── Start empty (ad-hoc) workout ───────────────────────── */

export async function startEmptyWorkout(): Promise<{ workout_id: string; started_at: string }> {
  // Reuse existing /api/workouts with no program_day_id.
  return startWorkout(undefined)
}

/* ── Build-from-scratch program creation ────────────────── */

export async function createProgram(body: {
  name: string
  first_day?: {
    name: string
    weekdays?: number[]
    frequency_per_week?: number | null
  }
}): Promise<Program> {
  const res = await fetch(`${API_BASE}/api/programs`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Program>
}

export async function addProgramDay(
  programId: string,
  body: { name: string; weekdays?: number[]; frequency_per_week?: number | null }
): Promise<ProgramDay> {
  const res = await fetch(`${API_BASE}/api/programs/${programId}/days`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramDay>
}

export async function updateProgramDay(
  programId: string,
  dayId: string,
  body: { name?: string; weekdays?: number[]; frequency_per_week?: number | null }
): Promise<ProgramDay> {
  const res = await fetch(`${API_BASE}/api/programs/${programId}/days/${dayId}`, {
    method: "PATCH",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramDay>
}

export async function deleteProgramDay(programId: string, dayId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/programs/${programId}/days/${dayId}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function updateProgramExercise(
  programId: string,
  dayId: string,
  exerciseId: string,
  body: {
    sets?: number
    reps?: number
    weight_kg?: number | null
    notes?: string | null
  }
): Promise<{
  id: string
  sets: number
  reps: number
  weight_kg: number | null
  notes: string | null
}> {
  const res = await fetch(
    `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}`,
    {
      method: "PATCH",
      headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export type LastLoggedSet = {
  reps: number
  weight_kg: number | null
  completed_at: string | null
}

export async function getLastLoggedSets(programId: string): Promise<Record<string, LastLoggedSet>> {
  const res = await fetch(`${API_BASE}/api/programs/${programId}/last-logged`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}
