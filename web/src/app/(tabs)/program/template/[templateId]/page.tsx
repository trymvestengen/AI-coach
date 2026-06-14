import { notFound, redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import WorkoutPage from "@/components/training/workout/WorkoutPage"
import type { TemplateDetail as TemplateDetailType, Exercise, TemplateFolder } from "@/lib/api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface PageProps {
  params: Promise<{ templateId: string }>
}

async function safeFetch(path: string, token: string): Promise<unknown> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { templateId } = await params

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const token = session.access_token

  const headers = { Authorization: `Bearer ${token}` }
  const templateRes = await fetch(`${API_BASE}/api/templates/${templateId}`, {
    headers,
    cache: "no-store",
  })
  if (templateRes.status === 404) notFound()
  if (!templateRes.ok) throw new Error(`Failed to load template: ${templateRes.status}`)
  const template = (await templateRes.json()) as TemplateDetailType

  const [exercises, folders] = await Promise.all([
    safeFetch("/api/exercises", token),
    safeFetch("/api/template-folders", token),
  ])

  const exerciseNames = Object.fromEntries(
    ((exercises as Exercise[] | null) ?? []).map((e) => [e.id, e.name])
  )

  return (
    <WorkoutPage
      mode="planning"
      template={template}
      exerciseNames={exerciseNames}
      folders={(folders as TemplateFolder[] | null) ?? []}
    />
  )
}
