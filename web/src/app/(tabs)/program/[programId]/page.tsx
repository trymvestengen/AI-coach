import { notFound, redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import ProgramDetail from "@/components/program/detail/ProgramDetail"
import type { Program, ProgramFolder } from "@/lib/api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface PageProps {
  params: Promise<{ programId: string }>
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const { programId } = await params

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const headers = { Authorization: `Bearer ${session.access_token}` }

  const [progRes, foldersRes] = await Promise.all([
    fetch(`${API_BASE}/api/programs/${programId}`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/folders`, { headers, cache: "no-store" }),
  ])

  if (progRes.status === 404) notFound()
  if (!progRes.ok) throw new Error(`Failed to load program: ${progRes.status}`)

  const program = (await progRes.json()) as Program
  const folders = (foldersRes.ok ? await foldersRes.json() : []) as ProgramFolder[]

  const jsDay = new Date().getDay()
  const todayDayNumber = jsDay === 0 ? 7 : jsDay

  return <ProgramDetail program={program} folders={folders} todayDayNumber={todayDayNumber} />
}
