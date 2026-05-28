import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import CoachClient from "./CoachClient"
import type { Message } from "./ChatBody"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export default async function CoachPage() {
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

  const sessionRes = await fetch(`${API_BASE}/api/chat/sessions/current`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })

  let sessionId: string | null = null
  let messages: Message[] = []

  if (sessionRes.ok) {
    const body = await sessionRes.json()
    sessionId = body.id as string
    const msgRes = await fetch(`${API_BASE}/api/chat/sessions/${sessionId}/messages`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
    if (msgRes.ok) {
      const rows = (await msgRes.json()) as Array<{
        id: string
        role: string
        content: { text?: string; tool_name?: string }
      }>
      messages = rows
        .filter((r) => r.role === "user" || r.role === "assistant" || r.role === "tool_use")
        .map((r) => ({
          id: r.id,
          role: r.role as Message["role"],
          content: r.content,
          state: r.role === "tool_use" ? ("done" as const) : undefined,
        }))
    }
  }

  return (
    <CoachClient
      initialSessionId={sessionId}
      initialMessages={messages}
      accessToken={accessToken}
    />
  )
}
