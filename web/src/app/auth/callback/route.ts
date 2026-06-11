import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const origin = url.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_no_code`)
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  // Check if user has a profile row. First-time OAuth users won't.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=oauth_no_user`)
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.redirect(`${origin}/onboarding`)
  }
  return NextResponse.redirect(`${origin}/home`)
}
