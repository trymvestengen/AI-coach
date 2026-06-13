import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

// Authenticated users on these paths are redirected to /home.
const REDIRECT_WHEN_AUTHED = ["/login", "/register"]

// Paths reachable without auth, OR (for /onboarding) reachable mid-flow.
const PUBLIC_PATHS = [...REDIRECT_WHEN_AUTHED, "/onboarding"]

// Don't run onboarding-status check for these (they're already public or the onboarding page itself).
const SKIP_ONBOARDING_CHECK = ["/onboarding", "/login", "/register"]

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const isRedirectWhenAuthed = REDIRECT_WHEN_AUTHED.some((p) => pathname.startsWith(p))
  const skipOnboardingCheck = SKIP_ONBOARDING_CHECK.some((p) => pathname.startsWith(p))

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && isRedirectWhenAuthed) {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  if (user && !skipOnboardingCheck) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) {
      try {
        const res = await fetch(`${API_BASE}/api/users/profile`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        })
        if (res.ok) {
          const body = await res.json()
          if (body.onboarding_status && body.onboarding_status !== "complete") {
            return NextResponse.redirect(new URL("/onboarding", request.url))
          }
        } else if (res.status === 404) {
          // Profile row doesn't exist yet — send them to onboarding.
          return NextResponse.redirect(new URL("/onboarding", request.url))
        }
      } catch {
        // If the API is down, don't block — let the page handle it.
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
