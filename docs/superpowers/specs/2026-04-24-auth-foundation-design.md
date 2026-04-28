# Auth Foundation — Implementation Design

**Goal:** Add real authentication to the app so users log in with email + password (password reset via magic link), sessions are protected by Next.js middleware, and the FastAPI backend validates Supabase JWTs instead of using the hardcoded TEST_USER_ID.

**Architecture:** Supabase Auth handles identity. `@supabase/ssr` manages sessions in Next.js App Router via cookies. Next.js middleware redirects unauthenticated requests to `/login`. FastAPI verifies JWTs using Supabase's JWKS endpoint and extracts `user_id` from the token.

**Tech Stack:** Supabase Auth, `@supabase/ssr`, Next.js 15 App Router middleware, FastAPI, `python-jose[cryptography]` (add to `api/requirements.txt`), PostgreSQL trigger.

---

## File map

**Backend — new/modified:**
- `api/app/auth.py` — new: `get_current_user_id(request)` dependency
- `api/app/routers/workouts.py` — replace TEST_USER_ID with auth dependency
- `api/app/routers/programs.py` — replace TEST_USER_ID with auth dependency
- `api/app/constants.py` — remove TEST_USER_ID

**Frontend — new/modified:**
- `web/src/lib/supabase.ts` — new: browser + server Supabase client factories
- `web/src/middleware.ts` — new: session refresh + route protection
- `web/src/app/login/page.tsx` — new: login page (email + password)
- `web/src/app/login/forgot-password/page.tsx` — new: forgot password page
- `web/src/app/login/reset-password/page.tsx` — new: reset password page
- `web/src/app/register/page.tsx` — new: temporary simple registration (replaced by onboarding in part 2)
- `web/src/lib/api.ts` — add auth token to all fetch calls
- `web/src/app/layout.tsx` — wrap app in auth context

**Database — migration:**
- `api/db/migrations/003_users_table.sql` — create `public.users` table + trigger

---

## Section 1: Database migration

Create `public.users` table that mirrors `auth.users`:

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                TEXT NOT NULL,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create public.users row when a new auth user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Run this migration in the Supabase SQL editor (Dashboard → SQL Editor).

---

## Section 2: Supabase project config

In the Supabase dashboard:
1. Enable **Email/Password** provider under Authentication → Providers
2. Enable **Email magic link** (used for password reset)
3. Set Site URL to `http://localhost:3000`
4. Add `http://localhost:3000/login/reset-password` as an allowed redirect URL

Environment variables needed:

**`web/.env.local`** (add):
```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

**`api/.env`** (add):
```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_JWKS_URL=https://<project>.supabase.co/auth/v1/.well-known/jwks.json
```

---

## Section 3: Frontend Supabase clients

`web/src/lib/supabase.ts` exports two factories — one for browser components, one for server components/middleware:

```typescript
import { createBrowserClient } from "@supabase/ssr"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

---

## Section 4: Next.js middleware

`web/src/middleware.ts` — refreshes the session on every request and redirects unauthenticated users to `/login`:

```typescript
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_PATHS = ["/login", "/register"]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && isPublic) {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
```

---

## Section 5: Login pages

### `/login` — email + password

- Two inputs: email, password
- "Logg inn"-button → `supabase.auth.signInWithPassword({ email, password })`
- On success: router.push("/home")
- On error: show inline error message
- "Glemt passord?"-link → `/login/forgot-password`
- "Ny bruker?"-link → `/register`

### `/login/forgot-password`

- One input: email
- "Send tilbakestillingslenke"-button → `supabase.auth.resetPasswordForEmail(email, { redirectTo: "http://localhost:3000/login/reset-password" })`
- On success: show "Sjekk e-posten din"-confirmation message

### `/login/reset-password`

- Supabase redirects here with a token in the URL fragment — `@supabase/ssr` handles this automatically on page load
- One input: nytt passord
- "Lagre passord"-button → `supabase.auth.updateUser({ password })`
- On success: router.push("/home")

### `/register` (temporary)

- Inputs: fornavn, etternavn, e-post, passord
- "Opprett konto"-button → `supabase.auth.signUp({ email, password, options: { data: { first_name, last_name } } })`
- On success: router.push("/home")
- This page is replaced entirely by the onboarding flow in Part 2.

All login/register pages use the same visual style as the rest of the app (dark theme, max-width 390px, `--ai-accent` orange).

---

## Section 6: Frontend API client — auth header

`web/src/lib/api.ts` — add a helper to get the current session token, and attach it to all API calls:

```typescript
import { createClient } from "./supabase"

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}
```

Every existing `fetch()` call in `api.ts` gets `headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" }`.

---

## Section 7: Backend JWT verification

`api/app/auth.py` — verifies the Supabase JWT and returns the user ID:

```python
import os
from functools import lru_cache
import httpx
from jose import jwt, JWTError
from fastapi import Request, HTTPException

@lru_cache
def _get_jwks() -> dict:
    url = os.environ["SUPABASE_JWKS_URL"]
    return httpx.get(url, timeout=10).json()

def get_current_user_id(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = auth.removeprefix("Bearer ")
    try:
        jwks = _get_jwks()
        payload = jwt.decode(token, jwks, algorithms=["RS256"], audience="authenticated")
        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

Every router that previously used `TEST_USER_ID` now calls `user_id = get_current_user_id(request)` and passes it to queries.

`api/app/constants.py` — remove `TEST_USER_ID` entirely after all routers are updated.

---

## Section 8: Email verification model

Supabase sends a confirmation email automatically on sign-up. The app does not block access based on verification status — unverified users can use all core features. `email_confirmed_at` in `auth.users` (managed by Supabase) is the source of truth.

Future features (social/friends) will check `email_confirmed_at IS NOT NULL` before allowing those actions.

---

## Data flow

```
User visits /home
  → middleware checks session
  → no session → redirect /login

User submits email + password
  → supabase.auth.signInWithPassword()
  → session cookie set
  → redirect /home

Frontend calls API
  → getAuthHeaders() reads session.access_token
  → fetch with Authorization: Bearer <token>

FastAPI receives request
  → get_current_user_id(request)
  → verifies JWT via JWKS
  → returns user UUID
  → queries use real user_id
```
