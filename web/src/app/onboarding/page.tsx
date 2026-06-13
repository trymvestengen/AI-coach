import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import OnboardingWizard, { type InitialProfile } from "./OnboardingWizard"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Unauthenticated users see steps 1-3 (signup happens there).
  if (!user) {
    return <OnboardingWizard initialProfile={null} firstNameFallback="" />
  }

  // Authenticated: load profile to determine resume point.
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const accessToken = session.access_token

  let initialProfile: InitialProfile | null = null
  let firstName = ""
  try {
    const res = await fetch(`${API_BASE}/api/users/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
    if (res.ok) {
      const body = await res.json()
      if (body.onboarding_status === "complete") redirect("/home")
      initialProfile = {
        first_name: body.first_name,
        last_name: body.last_name,
        goals: body.goals,
        experience_level: body.experience_level,
        training_days_per_week: body.training_days_per_week,
        gender: body.gender,
        birth_date: body.birth_date,
        height_cm: body.height_cm,
        weight_kg: body.weight_kg,
        equipment: body.equipment ?? [],
        injury_notes: body.injury_notes,
        preference_notes: body.preference_notes,
        onboarding_status: body.onboarding_status,
      }
      firstName = body.first_name ?? ""
    }
  } catch {
    firstName = (user.user_metadata?.first_name as string) ?? ""
  }

  return <OnboardingWizard initialProfile={initialProfile} firstNameFallback={firstName} />
}
