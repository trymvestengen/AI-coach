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
  sets: WorkoutSet[]
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export async function sendMessage(messages: Message[], persona: Persona = "friend"): Promise<string> {
  const url = `${API_BASE}/api/chat`

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, persona }),
  })

  if (!res.ok) {
    throw new Error(`API ${res.status}`)
  }

  const data = await res.json()
  return data.message as string
}

export async function getWorkouts(): Promise<Workout[]> {
  const url = `${API_BASE}/api/workouts`

  const res = await fetch(url, { method: "GET" })

  if (!res.ok) {
    throw new Error(`API ${res.status}`)
  }

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
}

export type Exercise = {
  id: string
  name: string
  muscle_groups: string[]
  equipment: string[]
  difficulty: string
}

export async function getPrograms(): Promise<Program[]> {
  const url = `${API_BASE}/api/programs`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Program[]>
}

export async function getProgram(id: string): Promise<Program> {
  const url = `${API_BASE}/api/programs/${id}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Program>
}

export async function getExercises(muscleGroup?: string): Promise<Exercise[]> {
  const base = `${API_BASE}/api/exercises`
  const url = muscleGroup ? `${base}?muscle_group=${encodeURIComponent(muscleGroup)}` : base
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Exercise[]>
}

export async function addExerciseToDay(
  programId: string,
  dayId: string,
  body: { exercise_id: string }
): Promise<ProgramExercise> {
  const url = `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const url = `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramExercise>
}

export async function addSet(
  programId: string,
  dayId: string,
  exerciseId: string,
  body: { reps: number; weight_kg?: number | null }
): Promise<ProgramExerciseSet> {
  const url = `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}/sets`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
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
  const url = `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}/sets/${setId}`
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramExerciseSet>
}

export async function deleteSet(
  programId: string,
  dayId: string,
  exerciseId: string,
  setId: string
): Promise<void> {
  const url = `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}/sets/${setId}`
  const res = await fetch(url, { method: "DELETE" })
  if (!res.ok) throw new Error(`API ${res.status}`)
}
