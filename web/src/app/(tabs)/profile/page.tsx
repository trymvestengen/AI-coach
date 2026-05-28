import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import type { FullProfile } from "@/lib/profile"
import ProfileClient from "./ProfileClient"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export default async function ProfilePage() {
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

  const profile: FullProfile = await res.json()
  return <ProfileClient initialProfile={profile} accessToken={accessToken} />
}
