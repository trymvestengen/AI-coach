const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export interface UserInjury {
  id: string
  body_part: string
  description: string | null
  severity: string | null
  started_at: string | null
  is_active: boolean
}

export interface UserPreference {
  id: string
  category: string
  preference: string
}

export interface UserConstraint {
  id: string
  type: string
  description: string
}

export interface FullProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  goals: string[] | null
  experience_level: string
  training_days_per_week: number
  gender: string
  birth_date: string | null
  height_cm: number
  weight_kg: number
  avatar_url: string | null
  activity_level: string | null
  years_training: number | null
  preferred_training_time: string | null
  max_session_duration_min: number | null
  injuries: UserInjury[]
  preferences: UserPreference[]
  equipment: string[]
  constraints: UserConstraint[]
}

function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return (await res.json()) as T
}

export async function updateProfile(
  token: string,
  patch: Partial<FullProfile>
): Promise<FullProfile> {
  const res = await fetch(`${API_BASE}/api/users/profile`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(patch),
  })
  return handle<FullProfile>(res)
}

export async function addInjury(token: string, body: Partial<UserInjury>): Promise<UserInjury> {
  const res = await fetch(`${API_BASE}/api/users/injuries`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return handle<UserInjury>(res)
}

export async function updateInjury(
  token: string,
  id: string,
  body: Partial<UserInjury>
): Promise<UserInjury> {
  const res = await fetch(`${API_BASE}/api/users/injuries/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return handle<UserInjury>(res)
}

export async function deleteInjury(token: string, id: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/users/injuries/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  })
  return handle<{ status: string }>(res)
}

export async function addPreference(
  token: string,
  body: Partial<UserPreference>
): Promise<UserPreference> {
  const res = await fetch(`${API_BASE}/api/users/preferences`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return handle<UserPreference>(res)
}

export async function updatePreference(
  token: string,
  id: string,
  body: Partial<UserPreference>
): Promise<UserPreference> {
  const res = await fetch(`${API_BASE}/api/users/preferences/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return handle<UserPreference>(res)
}

export async function deletePreference(token: string, id: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/users/preferences/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  })
  return handle<{ status: string }>(res)
}

export async function addEquipment(
  token: string,
  equipment: string
): Promise<{ equipment: string }> {
  const res = await fetch(`${API_BASE}/api/users/equipment`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ equipment }),
  })
  return handle<{ equipment: string }>(res)
}

export async function deleteEquipment(
  token: string,
  equipment: string
): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/users/equipment/${encodeURIComponent(equipment)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  })
  return handle<{ status: string }>(res)
}

export async function addConstraint(
  token: string,
  body: Partial<UserConstraint>
): Promise<UserConstraint> {
  const res = await fetch(`${API_BASE}/api/users/constraints`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return handle<UserConstraint>(res)
}

export async function updateConstraint(
  token: string,
  id: string,
  body: Partial<UserConstraint>
): Promise<UserConstraint> {
  const res = await fetch(`${API_BASE}/api/users/constraints/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return handle<UserConstraint>(res)
}

export async function deleteConstraint(token: string, id: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/users/constraints/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  })
  return handle<{ status: string }>(res)
}
