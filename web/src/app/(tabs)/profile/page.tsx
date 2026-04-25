import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import LogoutButton from "@/components/profile/LogoutButton"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface UserProfile {
  id: string
  first_name: string
  last_name: string
  goals: string[] | null
  experience_level: string
  training_days_per_week: number
  gender: string
  birth_date: string | null
  height_cm: number
  weight_kg: number
  avatar_url: string | null
}

const GOAL_LABELS: Record<string, string> = {
  build_muscle: "Bygg muskler",
  lose_weight: "Gå ned i vekt",
  get_stronger: "Bli sterkere",
  improve_endurance: "Bedre kondis",
  maintain: "Holde formen",
}

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "Nybegynner",
  intermediate: "Middels",
  advanced: "Erfaren",
}

const FREQUENCY_LABELS: Record<number, string> = {
  2: "1–2 dager/uke",
  4: "3–4 dager/uke",
  6: "5–6 dager/uke",
  7: "7 dager/uke",
}

function calcAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const accessToken = session.access_token

  const res = await fetch(`${API_BASE}/api/users/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })

  if (res.status === 404) {
    redirect("/onboarding")
  }

  if (!res.ok) {
    throw new Error(`Failed to load profile: ${res.status}`)
  }

  const profile: UserProfile = await res.json()
  const goals = profile.goals ?? []
  const age = profile.birth_date ? calcAge(profile.birth_date) : null

  return (
    <div style={{ padding: "20px", maxWidth: "480px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
        <div style={{
          width: "56px", height: "56px", borderRadius: "50%",
          background: "#2a2a2a", border: "2px solid #333",
          overflow: "hidden", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "24px",
        }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" as const }} />
            : "👤"}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "#fff", fontSize: "17px" }}>
            {profile.first_name} {profile.last_name}
          </div>
          <div style={{ color: "#666", fontSize: "13px" }}>{user.email}</div>
        </div>
      </div>

      {/* Goals */}
      {goals.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ color: "#555", fontSize: "11px", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: "8px" }}>
            Mål
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {goals.map((g: string) => (
              <span key={g} style={{
                background: "#1a1a1a", border: "1px solid #2a2a2a",
                borderRadius: "20px", padding: "4px 12px",
                fontSize: "13px", color: "#ccc",
              }}>
                {GOAL_LABELS[g] ?? g}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "24px" }}>
        {[
          { label: "Erfaring", value: EXPERIENCE_LABELS[profile.experience_level] ?? profile.experience_level },
          { label: "Frekvens", value: FREQUENCY_LABELS[profile.training_days_per_week] ?? `${profile.training_days_per_week} dager/uke` },
          { label: "Høyde · Vekt", value: `${profile.height_cm} cm · ${profile.weight_kg} kg` },
          ...(age !== null ? [{ label: "Alder", value: `${age} år` }] : []),
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: "#111", border: "1px solid #1e1e1e",
            borderRadius: "10px", padding: "12px",
          }}>
            <div style={{ color: "#555", fontSize: "10px", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "4px" }}>
              {label}
            </div>
            <div style={{ color: "#fff", fontSize: "14px", fontWeight: 500 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Log out */}
      <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "16px" }}>
        <LogoutButton />
      </div>
    </div>
  )
}
