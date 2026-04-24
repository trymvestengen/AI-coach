import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import HomeScreen from "@/components/home/HomeScreen"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const res = await fetch(`${API_BASE}/api/users/profile`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  })

  if (res.status === 404) {
    redirect("/onboarding")
  }

  return <HomeScreen />
}
