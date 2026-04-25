import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import SocialScreen from "@/components/social/SocialScreen"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export default async function SocialPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const headers = { Authorization: `Bearer ${session.access_token}` }

  const [feedRes, suggestionsRes, leaderboardRes] = await Promise.all([
    fetch(`${API_BASE}/api/social/feed`,        { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/social/suggestions`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/social/leaderboard`, { headers, cache: "no-store" }),
  ])

  const feed        = feedRes.ok        ? await feedRes.json()        : []
  const suggestions = suggestionsRes.ok ? await suggestionsRes.json() : []
  const leaderboard = leaderboardRes.ok ? await leaderboardRes.json() : []

  return (
    <SocialScreen
      accessToken={session.access_token}
      feed={feed}
      suggestions={suggestions}
      leaderboard={leaderboard}
    />
  )
}
