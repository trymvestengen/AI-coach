# Login redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand `/login` (+ forgot/reset) til lyst brand-system og legg til Google + Apple sign-in via Supabase OAuth.

**Architecture:** Frontend-bare endring (auth ligger i Supabase). Ny `/auth/callback`-route handler for OAuth, ny komponentmappe `web/src/components/login/`, omstrukturert `LoginPage` med inline expand-flyt. Apple-knapp gated bak `NEXT_PUBLIC_ENABLE_APPLE_LOGIN`.

**Tech Stack:** Next.js 16 App Router + TypeScript, Supabase Auth (browser + server client), Vitest + React Testing Library.

**Spec:** [`docs/superpowers/specs/2026-06-06-login-redesign-design.md`](../specs/2026-06-06-login-redesign-design.md)

---

## Task 1: `/auth/callback` route handler

**Files:**
- Create: `web/src/app/auth/callback/route.ts`

- [ ] **Step 1: Implement route handler**

The directory `web/src/app/auth/callback/` does NOT exist — create it via the file write.

Create `web/src/app/auth/callback/route.ts`:

```ts
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
```

- [ ] **Step 2: Run typecheck**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/auth/callback/route.ts
git commit -m "feat(web): add /auth/callback OAuth handler"
```

## Context for Task 1

- `createServerSupabaseClient` lives in `web/src/lib/supabase-server.ts` — it reads cookies via `next/headers`.
- The `users`-table has `id` matching `auth.uid()` (see migration 001 / RLS policies in 005).
- `.maybeSingle()` returns null when no row found (vs `.single()` which errors).
- Branch: `feat/onboarding-redesign`.

---

## Task 2: SocialButton component

**Files:**
- Create: `web/src/components/login/SocialButton.tsx`
- Test: `web/src/components/login/SocialButton.test.tsx`

Use TDD: tests first.

- [ ] **Step 1: Write failing tests**

The directory `web/src/components/login/` does NOT exist — create it via the file write.

Create `web/src/components/login/SocialButton.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import SocialButton from "./SocialButton"

describe("SocialButton", () => {
  it("renders Google variant with label", () => {
    render(<SocialButton variant="google" onClick={() => {}} />)
    expect(screen.getByText(/Fortsett med Google/i)).toBeInTheDocument()
  })

  it("renders Apple variant with label", () => {
    render(<SocialButton variant="apple" onClick={() => {}} />)
    expect(screen.getByText(/Fortsett med Apple/i)).toBeInTheDocument()
  })

  it("renders Email variant with label", () => {
    render(<SocialButton variant="email" onClick={() => {}} />)
    expect(screen.getByText(/Fortsett med e-post/i)).toBeInTheDocument()
  })

  it("calls onClick when pressed", () => {
    const onClick = vi.fn()
    render(<SocialButton variant="google" onClick={onClick} />)
    fireEvent.click(screen.getByRole("button"))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("disables when busy", () => {
    render(<SocialButton variant="google" onClick={() => {}} busy />)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("shows different label when busy", () => {
    render(<SocialButton variant="google" onClick={() => {}} busy />)
    expect(screen.getByText(/Logger inn…/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm fail**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run test -- SocialButton.test --run
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement SocialButton**

Create `web/src/components/login/SocialButton.tsx`:

```tsx
"use client"

export type SocialVariant = "google" | "apple" | "email"

interface Props {
  variant: SocialVariant
  onClick: () => void
  busy?: boolean
}

const LABELS: Record<SocialVariant, string> = {
  google: "Fortsett med Google",
  apple: "Fortsett med Apple",
  email: "Fortsett med e-post",
}

export default function SocialButton({ variant, onClick, busy }: Props) {
  const isApple = variant === "apple"
  const background = isApple ? "#000" : "var(--brand-surface)"
  const color = isApple ? "#fff" : "var(--brand-ink)"
  const borderColor = isApple ? "#000" : "var(--brand-border)"
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      style={{
        width: "100%",
        background,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 12,
        padding: "13px 14px",
        fontSize: 14,
        fontWeight: 600,
        color,
        cursor: busy ? "default" : "pointer",
        opacity: busy ? 0.7 : 1,
        marginBottom: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}
    >
      <Icon variant={variant} />
      <span>{busy ? "Logger inn…" : LABELS[variant]}</span>
    </button>
  )
}

function Icon({ variant }: { variant: SocialVariant }) {
  if (variant === "apple") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M11.182.008c.015-.05.02-.057.03-.057-.073.59-.197 1.124-.572 1.586-.34.42-.857.79-1.501.79-.014-.45.16-.91.42-1.234.288-.36.79-.643 1.184-.71l.439-.375zM13.05 12.21c-.354.834-.79 1.624-1.385 2.31-.522.6-1.072 1.21-1.812 1.222-.736.012-.97-.43-1.81-.43-.84 0-1.1.418-1.795.442-.715.024-1.262-.65-1.789-1.249C2.42 13.27 1.255 10.385 2.358 8.43c.546-.966 1.527-1.578 2.59-1.593.704-.013 1.367.473 1.795.473.434 0 1.242-.586 2.094-.5.357.014 1.36.144 2.005 1.087-.05.033-1.197.7-1.183 2.085.012 1.66 1.453 2.213 1.47 2.221z"/>
      </svg>
    )
  }
  if (variant === "google") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <path fill="#4285F4" d="M15.68 8.182c0-.566-.05-1.111-.146-1.636H8v3.091h4.305a3.68 3.68 0 0 1-1.594 2.413v2.005h2.582c1.51-1.39 2.387-3.435 2.387-5.873z"/>
        <path fill="#34A853" d="M8 16c2.16 0 3.97-.715 5.293-1.945l-2.582-2.005c-.715.48-1.63.762-2.711.762-2.085 0-3.85-1.408-4.48-3.302H.857v2.069A8 8 0 0 0 8 16z"/>
        <path fill="#FBBC05" d="M3.52 9.51A4.8 4.8 0 0 1 3.27 8c0-.523.09-1.03.25-1.51V4.422H.857A8 8 0 0 0 0 8c0 1.29.31 2.51.857 3.578L3.52 9.51z"/>
        <path fill="#EA4335" d="M8 3.182c1.175 0 2.23.404 3.058 1.198l2.294-2.295C11.965.79 10.155 0 8 0A8 8 0 0 0 .857 4.422L3.52 6.49C4.15 4.596 5.915 3.182 8 3.182z"/>
      </svg>
    )
  }
  // email
  return <span style={{ fontSize: 16 }}>✉️</span>
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run test -- SocialButton.test --run
```
Expected: 6/6 PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/components/login/SocialButton.tsx web/src/components/login/SocialButton.test.tsx
git commit -m "feat(web): add SocialButton for login (google/apple/email)"
```

## Context for Task 2

- Project root: `/Users/trymvestengen/Desktop/ai-coach`
- Apple branding requires black background with white text — the spec explicitly notes this.
- Branch: `feat/onboarding-redesign`.

---

## Task 3: LoginHero component

**Files:**
- Create: `web/src/components/login/LoginHero.tsx`

No tests required — pure layout component.

- [ ] **Step 1: Implement LoginHero**

Create `web/src/components/login/LoginHero.tsx`:

```tsx
"use client"

interface Props {
  compact?: boolean
}

export default function LoginHero({ compact }: Props) {
  return (
    <div style={{ textAlign: "center", padding: compact ? "20px 0 10px" : "30px 0 20px" }}>
      <div
        style={{
          width: compact ? 44 : 56,
          height: compact ? 44 : 56,
          borderRadius: 14,
          background:
            "linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-orange-deep) 100%)",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontSize: compact ? 22 : 26,
          margin: "0 auto 12px",
        }}
        aria-hidden
      >
        💪
      </div>
      <div
        style={{
          fontSize: compact ? 22 : 26,
          fontWeight: 800,
          color: "var(--brand-ink)",
          letterSpacing: "-0.03em",
          marginBottom: 4,
        }}
      >
        AI Coach
      </div>
      <div
        style={{
          fontSize: 10,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: "var(--brand-orange)",
          fontWeight: 700,
        }}
      >
        Din personlige trener
      </div>
      {!compact && (
        <div
          style={{
            fontSize: 13,
            color: "var(--brand-muted)",
            marginTop: 12,
            lineHeight: 1.4,
            maxWidth: 240,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Logg treninger, følg progresjon og få personlig coaching
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/components/login/LoginHero.tsx
git commit -m "feat(web): add LoginHero component"
```

## Context for Task 3

- The `compact` prop is used after the user taps "Fortsett med e-post" — the hero shrinks to make room for the form.
- Branch: `feat/onboarding-redesign`.

---

## Task 4: LoginForm component (email/password)

**Files:**
- Create: `web/src/components/login/LoginForm.tsx`
- Test: `web/src/components/login/LoginForm.test.tsx`

Use TDD: tests first.

- [ ] **Step 1: Write failing tests**

Create `web/src/components/login/LoginForm.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import LoginForm from "./LoginForm"

const mockSignIn = vi.fn()
vi.mock("@/lib/supabase", () => ({
  createClient: () => ({
    auth: { signInWithPassword: mockSignIn },
  }),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}))

describe("LoginForm", () => {
  it("renders email and password fields and submit button", () => {
    render(<LoginForm />)
    expect(screen.getByPlaceholderText(/E-post/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Passord/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Logg inn/i })).toBeInTheDocument()
  })

  it("renders forgot-password and ny-bruker links", () => {
    render(<LoginForm />)
    expect(screen.getByText(/Glemt passord\?/i)).toBeInTheDocument()
    expect(screen.getByText(/Ny bruker\?/i)).toBeInTheDocument()
  })

  it("calls supabase signInWithPassword on submit", async () => {
    mockSignIn.mockResolvedValueOnce({ error: null })
    render(<LoginForm />)
    fireEvent.change(screen.getByPlaceholderText(/E-post/i), {
      target: { value: "trym@example.com" },
    })
    fireEvent.change(screen.getByPlaceholderText(/Passord/i), {
      target: { value: "secret123" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Logg inn/i }))
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "trym@example.com",
        password: "secret123",
      })
    })
  })

  it("shows an error message when sign in fails", async () => {
    mockSignIn.mockResolvedValueOnce({ error: { message: "Invalid credentials" } })
    render(<LoginForm />)
    fireEvent.change(screen.getByPlaceholderText(/E-post/i), {
      target: { value: "wrong@example.com" },
    })
    fireEvent.change(screen.getByPlaceholderText(/Passord/i), {
      target: { value: "bad" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Logg inn/i }))
    await waitFor(() => {
      expect(screen.getByText(/Feil e-post eller passord/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run tests to confirm fail**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run test -- LoginForm.test --run
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement LoginForm**

Create `web/src/components/login/LoginForm.tsx`:

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (signInError) {
      setError("Feil e-post eller passord")
      setLoading(false)
      return
    }
    router.refresh()
    router.push("/home")
  }

  return (
    <>
      <Divider>eller med e-post</Divider>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="email"
          placeholder="E-post"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Passord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
        {error && (
          <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "var(--brand-orange)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "13px",
            fontSize: 14,
            fontWeight: 700,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
            marginTop: 4,
          }}
        >
          {loading ? "Logger inn…" : "Logg inn"}
        </button>
      </form>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 14,
          fontSize: 12,
        }}
      >
        <Link href="/login/forgot-password" style={{ color: "var(--brand-muted)" }}>
          Glemt passord?
        </Link>
        <Link href="/onboarding" style={{ color: "var(--brand-muted)" }}>
          Ny bruker?
        </Link>
      </div>
    </>
  )
}

const inputStyle: React.CSSProperties = {
  background: "var(--brand-surface)",
  border: "1.5px solid var(--brand-border)",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 14,
  color: "var(--brand-ink)",
  outline: "none",
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        textAlign: "center",
        fontSize: 10,
        color: "var(--brand-muted)",
        margin: "16px 0 12px",
        position: "relative",
        textTransform: "uppercase",
        letterSpacing: 1,
      }}
    >
      <span style={{ position: "relative", zIndex: 1, background: "var(--brand-canvas)", padding: "0 10px" }}>
        {children}
      </span>
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: 1,
          background: "var(--brand-border)",
          zIndex: 0,
        }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run test -- LoginForm.test --run
```
Expected: 4/4 PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/components/login/LoginForm.tsx web/src/components/login/LoginForm.test.tsx
git commit -m "feat(web): add LoginForm with email/password sign-in"
```

## Context for Task 4

- Pattern reference: see existing `web/src/app/login/page.tsx` for the current sign-in flow we're extracting from.
- The Divider component uses absolute positioning to draw a horizontal line behind the centered text — standard divider pattern.
- Branch: `feat/onboarding-redesign`.

---

## Task 5: Restructure `/login/page.tsx`

**Files:**
- Modify: `web/src/app/login/page.tsx` (full replace)

- [ ] **Step 1: Replace `page.tsx` with new implementation**

REPLACE the entire contents of `web/src/app/login/page.tsx` with:

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import LoginHero from "@/components/login/LoginHero"
import SocialButton, { type SocialVariant } from "@/components/login/SocialButton"
import LoginForm from "@/components/login/LoginForm"

const APPLE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_APPLE_LOGIN === "true"

export default function LoginPage() {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [busyProvider, setBusyProvider] = useState<"google" | "apple" | null>(null)
  const [oauthError, setOauthError] = useState<string | null>(null)

  // Read ?error= from URL for OAuth failures.
  if (typeof window !== "undefined" && oauthError === null) {
    const params = new URLSearchParams(window.location.search)
    const err = params.get("error")
    if (err) {
      setOauthError("Innlogging feilet, prøv igjen")
      // Clean the URL so error doesn't persist on refresh
      router.replace("/login")
    }
  }

  const handleOAuth = async (provider: "google" | "apple") => {
    if (busyProvider) return
    setBusyProvider(provider)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setOauthError("Kunne ikke starte innlogging, prøv igjen")
      setBusyProvider(null)
    }
    // On success, the browser navigates away to the OAuth provider.
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: "var(--brand-canvas)",
        padding: "0 24px 24px",
      }}
    >
      <LoginHero compact={expanded} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        {APPLE_ENABLED && (
          <SocialButton
            variant="apple"
            onClick={() => handleOAuth("apple")}
            busy={busyProvider === "apple"}
          />
        )}
        <SocialButton
          variant="google"
          onClick={() => handleOAuth("google")}
          busy={busyProvider === "google"}
        />

        {!expanded && (
          <>
            <SocialButton variant="email" onClick={() => setExpanded(true)} />
            <div
              style={{
                textAlign: "center",
                fontSize: 11,
                color: "var(--brand-muted)",
                marginTop: 14,
                lineHeight: 1.5,
              }}
            >
              Ved å fortsette godtar du{" "}
              <span style={{ textDecoration: "underline" }}>vilkår</span> og{" "}
              <span style={{ textDecoration: "underline" }}>personvern</span>
            </div>
          </>
        )}

        {expanded && <LoginForm />}

        {oauthError && (
          <div
            style={{
              color: "var(--danger)",
              fontSize: 12,
              textAlign: "center",
              marginTop: 10,
            }}
          >
            {oauthError}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck + tests**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run typecheck && npm run test -- login --run
```
Expected: typecheck PASS, login-related tests PASS.

- [ ] **Step 3: Smoke-test in browser**

Open `localhost:3000/login` (you may need to log out first). Verify:
- Hero with logo + tagline + description appears
- Three buttons (Apple if enabled, Google, E-post) visible
- Tap "Fortsett med e-post" → email/password form appears, "Fortsett med e-post"-button hides, hero shrinks
- Existing email/password sign-in works (verify with test account)

- [ ] **Step 4: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/login/page.tsx
git commit -m "feat(web): restructure /login with social-first layout"
```

## Context for Task 5

- The `APPLE_ENABLED` constant reads the env var at build time. To enable Apple, set `NEXT_PUBLIC_ENABLE_APPLE_LOGIN=true` in `.env.local` and restart the dev server.
- The error-from-URL read uses an in-render check rather than `useEffect` to avoid the `react-hooks/set-state-in-effect` lint rule. The `router.replace` clears the query so the error doesn't persist.
- Branch: `feat/onboarding-redesign`.

---

## Task 6: Rebrand `/login/forgot-password`

**Files:**
- Modify: `web/src/app/login/forgot-password/page.tsx` (full replace)

- [ ] **Step 1: Replace contents**

REPLACE the entire contents of `web/src/app/login/forgot-password/page.tsx` with:

```tsx
"use client"
import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import LoginHero from "@/components/login/LoginHero"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login/reset-password`,
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: "var(--brand-canvas)",
        padding: "0 24px 24px",
      }}
    >
      <LoginHero compact />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "var(--brand-ink)",
            letterSpacing: "-0.02em",
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          Glemt passord?
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--brand-muted)",
            textAlign: "center",
            marginBottom: 18,
          }}
        >
          Vi sender deg en lenke for å tilbakestille passordet
        </div>

        {sent ? (
          <div
            style={{
              background: "var(--brand-surface)",
              border: "1px solid var(--brand-border)",
              borderRadius: 14,
              padding: 16,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-ink)" }}>
              Sjekk e-posten din
            </div>
            <div style={{ fontSize: 12, color: "var(--brand-muted)", marginTop: 6 }}>
              Vi har sendt en tilbakestillingslenke til {email}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              type="email"
              placeholder="E-post"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                background: "var(--brand-surface)",
                border: "1.5px solid var(--brand-border)",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 14,
                color: "var(--brand-ink)",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "var(--brand-orange)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: 13,
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginTop: 4,
              }}
            >
              {loading ? "Sender…" : "Send tilbakestillingslenke"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <Link href="/login" style={{ fontSize: 12, color: "var(--brand-muted)" }}>
            ← Tilbake til innlogging
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/login/forgot-password/page.tsx
git commit -m "feat(web): rebrand forgot-password to light theme"
```

## Context for Task 6

- The reset link now uses `window.location.origin` instead of a hardcoded `http://localhost:3000` URL — this fixes the bug where reset links only worked in dev.
- Branch: `feat/onboarding-redesign`.

---

## Task 7: Rebrand `/login/reset-password`

**Files:**
- Modify: `web/src/app/login/reset-password/page.tsx` (full replace)

- [ ] **Step 1: Replace contents**

REPLACE the entire contents of `web/src/app/login/reset-password/page.tsx` with:

```tsx
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import LoginHero from "@/components/login/LoginHero"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }
    router.refresh()
    router.push("/home")
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: "var(--brand-canvas)",
        padding: "0 24px 24px",
      }}
    >
      <LoginHero compact />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "var(--brand-ink)",
            letterSpacing: "-0.02em",
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          Nytt passord
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--brand-muted)",
            textAlign: "center",
            marginBottom: 18,
          }}
        >
          Velg et nytt passord for kontoen din
        </div>

        {!ready ? (
          <div style={{ textAlign: "center", color: "var(--brand-muted)", fontSize: 13 }}>
            Verifiserer lenken…
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              type="password"
              placeholder="Nytt passord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                background: "var(--brand-surface)",
                border: "1.5px solid var(--brand-border)",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 14,
                color: "var(--brand-ink)",
                outline: "none",
              }}
            />
            {error && (
              <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "var(--brand-orange)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: 13,
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginTop: 4,
              }}
            >
              {loading ? "Lagrer…" : "Lagre passord"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck + full check**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run typecheck && npm run test --run
```
Expected: typecheck PASS, all tests PASS.

Then:

```bash
cd /Users/trymvestengen/Desktop/ai-coach && make check
```
Expected: lint + typecheck + tests + build all PASS.

- [ ] **Step 3: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/login/reset-password/page.tsx
git commit -m "feat(web): rebrand reset-password to light theme"
```

## Context for Task 7

- The `useEffect` for the auth-state subscription is the same pattern as the existing implementation — Supabase emits `PASSWORD_RECOVERY` when the user follows the reset link.
- Branch: `feat/onboarding-redesign`.

---

## Self-Review

**1. Spec coverage:**
- ✅ Rebrand `/login` to light theme — Task 5
- ✅ Layout C (three CTAs + inline email expand) — Task 5
- ✅ Apple feature flag — Task 5 (`APPLE_ENABLED` from `NEXT_PUBLIC_ENABLE_APPLE_LOGIN`)
- ✅ Google/Apple OAuth via Supabase — Task 5 (`signInWithOAuth`)
- ✅ `/auth/callback` route handler — Task 1
- ✅ First-time OAuth → redirect to `/onboarding` — Task 1 (`profile` row check)
- ✅ OAuth error handling — Task 1 (`?error=` redirect) + Task 5 (read from URL)
- ✅ SocialButton + LoginHero + LoginForm components — Tasks 2, 3, 4
- ✅ Rebrand forgot-password — Task 6
- ✅ Rebrand reset-password — Task 7
- ✅ Vilkår + personvern hint at bottom of default state — Task 5
- ✅ "Glemt passord?" / "Ny bruker?" links visible only when expanded — Task 4 (LoginForm)

**2. Placeholder scan:** Reviewed — no "TBD"/"TODO"/"implement later"/"add error handling" patterns. All code blocks are complete.

**3. Type consistency:** `SocialVariant` type defined in Task 2 and used in Task 5. `LoginHero` `compact` prop consistent across Tasks 3, 5, 6, 7. `signInWithOAuth` provider string union matches Supabase API.

Plan is ready for execution.
