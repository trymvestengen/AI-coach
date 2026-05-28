import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import OnboardingClient from "./OnboardingClient"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export default async function OnboardingPage() {
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

  // Fetch first_name from backend for greeting personalisation.
  let firstName = ""
  try {
    const res = await fetch(`${API_BASE}/api/users/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
    if (res.ok) {
      const body = await res.json()
      if (body.onboarding_status === "complete") redirect("/home")
      firstName = body.first_name ?? ""
    }
  } catch {
    // If profile fetch fails (e.g. row doesn't exist yet), fall back to user metadata.
    firstName = (user.user_metadata?.first_name as string) ?? ""
  }

  return <OnboardingClient accessToken={accessToken} firstName={firstName || "der"} />
}
