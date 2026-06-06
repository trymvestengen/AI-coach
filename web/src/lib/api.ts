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
  persona: Persona = "friend"
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
}

export interface ProgramExercise {
  id: string
  exercise_id: string
  name: string
  muscle_groups: string[]
  order_index: number
  sets: ProgramExerciseSet[]
}

export type ProgramDay = {
  id: string
  day_number: number
  name: string
  exercises: ProgramExercise[]
}

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

export async function getExerciseDetail(
  programId: string,
  dayId: string,
  exerciseId: string
): Promise<ProgramExercise> {
  const res = await fetch(
    `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}`,
    {
      headers: await getAuthHeaders(),
    }
  )
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramExercise>
}

export async function addSet(
  programId: string,
  dayId: string,
  exerciseId: string,
  body: { reps: number; weight_kg?: number | null }
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
  body: { reps: number; weight_kg: number | null }
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
  sets_logged: number
}

export async function getInProgressWorkout(): Promise<InProgressWorkout | null> {
  const res = await fetch(`${API_BASE}/api/workouts/in-progress`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<InProgressWorkout | null>
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
