# Onboarding Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an 11-step onboarding wizard at `/onboarding` that replaces `/register`, collects fitness profile data, and gates the home page behind profile completion.

**Architecture:** Client-side wizard in a single `page.tsx` holding all state in `useState`; Supabase `signUp` at step 3 (password); profile saved via `POST /api/users/profile` at step 11. The `/home` server component calls `GET /api/users/profile` and redirects to `/onboarding` on 404.

**Tech Stack:** Next.js 15 App Router, `@supabase/ssr`, FastAPI, psycopg3, PostgreSQL (Supabase)

---

## File Map

| File | Action |
|------|--------|
| `api/db/migrations/004_onboarding.sql` | Create |
| `api/app/routers/users.py` | Create |
| `api/app/main.py` | Modify — register users router |
| `api/tests/test_users_router.py` | Create |
| `api/tests/conftest.py` | Modify — patch users router auth |
| `web/src/middleware.ts` | Modify |
| `web/next.config.ts` | Modify — add /register redirect |
| `web/src/app/register/page.tsx` | Delete |
| `web/src/app/(tabs)/home/page.tsx` | Modify — profile check |
| `web/src/app/onboarding/page.tsx` | Create |

---

### Task 1: DB Migration

**Files:**
- Create: `api/db/migrations/004_onboarding.sql`

- [ ] **Step 1: Create migration file**

```sql
-- api/db/migrations/004_onboarding.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS first_name              TEXT,
  ADD COLUMN IF NOT EXISTS last_name               TEXT,
  ADD COLUMN IF NOT EXISTS experience_level        TEXT,
  ADD COLUMN IF NOT EXISTS training_days_per_week  INTEGER,
  ADD COLUMN IF NOT EXISTS gender                  TEXT,
  ADD COLUMN IF NOT EXISTS height_cm               INTEGER,
  ADD COLUMN IF NOT EXISTS weight_kg               NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS birth_date              DATE,
  ADD COLUMN IF NOT EXISTS avatar_url              TEXT;

-- Change goals from TEXT to TEXT[] so multi-select values can be stored
ALTER TABLE users
  ALTER COLUMN goals TYPE TEXT[]
  USING CASE WHEN goals IS NULL THEN NULL ELSE ARRAY[goals] END;
```

- [ ] **Step 2: Run migration in Supabase dashboard**

Open Supabase → SQL Editor → paste the file contents → Run.

Expected output: "Success. No rows returned."

- [ ] **Step 3: Commit the migration file**

```bash
git add api/db/migrations/004_onboarding.sql
git commit -m "feat: add onboarding columns to users table"
```

---

### Task 2: Backend — Users Router

**Files:**
- Create: `api/app/routers/users.py`
- Create: `api/tests/test_users_router.py`
- Modify: `api/app/main.py`
- Modify: `api/tests/conftest.py`

- [ ] **Step 1: Write failing tests**

Create `api/tests/test_users_router.py`:

```python
import os
import pytest
from datetime import date
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_get_profile_returns_404_when_no_row(mock_conn, make_mock_get_conn):
    mock_cur = AsyncMock()
    mock_cur.fetchone = AsyncMock(return_value=None)
    mock_conn.execute = AsyncMock(return_value=mock_cur)

    with patch("app.routers.users.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/users/profile")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_profile_returns_data_when_row_exists(mock_conn, make_mock_get_conn):
    mock_cur = AsyncMock()
    mock_cur.fetchone = AsyncMock(return_value=(
        "00000000-0000-0000-0000-000000000001",
        "Ola", "Nordmann",
        ["build_muscle", "get_stronger"],
        "beginner", 4, "male",
        date(1995, 6, 15), 180, 80.0, None,
    ))
    mock_conn.execute = AsyncMock(return_value=mock_cur)

    with patch("app.routers.users.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/users/profile")

    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Ola"
    assert data["last_name"] == "Nordmann"
    assert data["goals"] == ["build_muscle", "get_stronger"]
    assert data["height_cm"] == 180
    assert data["birth_date"] == "1995-06-15"


@pytest.mark.asyncio
async def test_post_profile_creates_row(mock_conn, make_mock_get_conn):
    mock_conn.execute = AsyncMock(return_value=AsyncMock())
    mock_conn.commit = AsyncMock()

    payload = {
        "email": "ola@example.com",
        "first_name": "Ola",
        "last_name": "Nordmann",
        "goals": ["build_muscle", "get_stronger"],
        "experience_level": "beginner",
        "training_days_per_week": 4,
        "gender": "male",
        "birth_date": "1995-06-15",
        "height_cm": 180,
        "weight_kg": 80.0,
        "avatar_url": None,
    }

    with patch("app.routers.users.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/users/profile", json=payload)

    assert response.status_code == 200
    assert response.json() == {"ok": True}
    mock_conn.execute.assert_called_once()
    mock_conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_post_profile_is_idempotent(mock_conn, make_mock_get_conn):
    mock_conn.execute = AsyncMock(return_value=AsyncMock())
    mock_conn.commit = AsyncMock()

    payload = {
        "email": "ola@example.com",
        "first_name": "Ola",
        "last_name": "Nordmann",
        "goals": ["maintain"],
        "experience_level": "intermediate",
        "training_days_per_week": 3,
        "gender": "other",
        "birth_date": "1990-01-01",
        "height_cm": 170,
        "weight_kg": 65.5,
        "avatar_url": "https://example.com/avatar.jpg",
    }

    with patch("app.routers.users.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r1 = await client.post("/api/users/profile", json=payload)
            r2 = await client.post("/api/users/profile", json=payload)

    assert r1.status_code == 200
    assert r2.status_code == 200
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd api && python -m pytest tests/test_users_router.py -v
```

Expected: `ImportError` or similar — `users.py` doesn't exist yet.

- [ ] **Step 3: Create users router**

Create `api/app/routers/users.py`:

```python
from datetime import date as date_type
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.db import get_conn
from app.auth import get_current_user_id

router = APIRouter()


class UserProfileBody(BaseModel):
    email: str
    first_name: str
    last_name: str
    goals: list[str]
    experience_level: str
    training_days_per_week: int
    gender: str
    birth_date: str  # "YYYY-MM-DD"
    height_cm: int
    weight_kg: float
    avatar_url: str | None = None


@router.get("/users/profile")
async def get_user_profile(request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            """
            SELECT id, first_name, last_name, goals, experience_level,
                   training_days_per_week, gender, birth_date, height_cm,
                   weight_kg, avatar_url
            FROM users WHERE id = %s
            """,
            (user_id,),
        )
        row = await cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {
        "id": str(row[0]),
        "first_name": row[1],
        "last_name": row[2],
        "goals": row[3] or [],
        "experience_level": row[4],
        "training_days_per_week": row[5],
        "gender": row[6],
        "birth_date": row[7].isoformat() if row[7] else None,
        "height_cm": row[8],
        "weight_kg": float(row[9]) if row[9] is not None else None,
        "avatar_url": row[10],
    }


@router.post("/users/profile")
async def upsert_user_profile(request: Request, body: UserProfileBody) -> dict:
    user_id = get_current_user_id(request)
    birth_date = date_type.fromisoformat(body.birth_date)
    async with get_conn() as conn:
        await conn.execute(
            """
            INSERT INTO users (
                id, email, first_name, last_name, goals, experience_level,
                training_days_per_week, gender, birth_date, height_cm,
                weight_kg, avatar_url
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                first_name             = EXCLUDED.first_name,
                last_name              = EXCLUDED.last_name,
                goals                  = EXCLUDED.goals,
                experience_level       = EXCLUDED.experience_level,
                training_days_per_week = EXCLUDED.training_days_per_week,
                gender                 = EXCLUDED.gender,
                birth_date             = EXCLUDED.birth_date,
                height_cm              = EXCLUDED.height_cm,
                weight_kg              = EXCLUDED.weight_kg,
                avatar_url             = EXCLUDED.avatar_url
            """,
            (
                user_id,
                body.email,
                body.first_name,
                body.last_name,
                body.goals,
                body.experience_level,
                body.training_days_per_week,
                body.gender,
                birth_date,
                body.height_cm,
                body.weight_kg,
                body.avatar_url,
            ),
        )
        await conn.commit()
    return {"ok": True}
```

- [ ] **Step 4: Register users router in main.py**

Replace `api/app/main.py`:

```python
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat
from app.routers import workouts
from app.routers import programs
from app.routers import users

app = FastAPI(title="AI Coach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(workouts.router, prefix="/api")
app.include_router(programs.router, prefix="/api")
app.include_router(users.router, prefix="/api")

@app.get("/")
def health():
    return {"status": "ok"}
```

- [ ] **Step 5: Update conftest.py to patch users router auth**

Replace `api/tests/conftest.py`:

```python
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from unittest.mock import AsyncMock

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


@pytest.fixture
def make_mock_get_conn():
    def _make(conn):
        @asynccontextmanager
        async def _get_conn():
            yield conn
        return _get_conn
    return _make


@pytest.fixture
def mock_conn():
    conn = AsyncMock()
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[])
    conn.execute = AsyncMock(return_value=cur)
    conn.commit = AsyncMock()
    return conn


@pytest.fixture(autouse=True)
def patch_auth(monkeypatch):
    monkeypatch.setattr("app.routers.workouts.get_current_user_id", lambda r: TEST_USER_ID)
    monkeypatch.setattr("app.routers.programs.get_current_user_id", lambda r: TEST_USER_ID)
    monkeypatch.setattr("app.routers.users.get_current_user_id", lambda r: TEST_USER_ID)
```

- [ ] **Step 6: Run users tests — verify all pass**

```bash
cd api && python -m pytest tests/test_users_router.py -v
```

Expected: 4 tests PASS.

- [ ] **Step 7: Run full test suite — verify no regressions**

```bash
cd api && python -m pytest -v 2>&1 | tail -20
```

Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add api/app/routers/users.py api/app/main.py api/tests/test_users_router.py api/tests/conftest.py
git commit -m "feat: add GET+POST /api/users/profile endpoints"
```

---

### Task 3: Middleware + Routing Cleanup

**Files:**
- Modify: `web/src/middleware.ts`
- Modify: `web/next.config.ts`
- Delete: `web/src/app/register/page.tsx`

- [ ] **Step 1: Update middleware**

Replace `web/src/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Authenticated users on these paths are redirected to /home.
const REDIRECT_WHEN_AUTHED = ["/login", "/register"]

// These paths are accessible without auth. Authenticated users on /onboarding
// are NOT redirected — they may be mid-flow.
const PUBLIC_PATHS = [...REDIRECT_WHEN_AUTHED, "/onboarding"]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

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

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && isRedirectWhenAuthed) {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
```

- [ ] **Step 2: Add /register → /onboarding redirect in next.config.ts**

Replace `web/next.config.ts`:

```typescript
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/register",
        destination: "/onboarding",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
```

- [ ] **Step 3: Delete register page**

```bash
rm web/src/app/register/page.tsx
```

- [ ] **Step 4: Commit**

```bash
git add web/src/middleware.ts web/next.config.ts
git rm web/src/app/register/page.tsx
git commit -m "feat: update middleware for onboarding, remove /register page"
```

---

### Task 4: Home Page Profile Check

**Files:**
- Modify: `web/src/app/(tabs)/home/page.tsx`

The home page is already a server component (no `"use client"`). Converting it to `async` and adding a profile check before rendering.

- [ ] **Step 1: Convert home page to async server component with profile check**

Replace `web/src/app/(tabs)/home/page.tsx`:

```typescript
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
```

- [ ] **Step 2: Verify it type-checks**

```bash
cd web && npx tsc --noEmit 2>&1 | grep -v "node_modules"
```

Expected: no errors from `home/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/(tabs)/home/page.tsx
git commit -m "feat: redirect new users from /home to /onboarding"
```

---

### Task 5: Onboarding Wizard

**Files:**
- Create: `web/src/app/onboarding/page.tsx`

All 11 steps live in one client component. Steps 0–2 collect credentials. Step 2 calls `signUp`. Steps 3–9 collect profile data. Step 10 submits everything.

- [ ] **Step 1: Create the wizard page**

Create `web/src/app/onboarding/page.tsx`:

```typescript
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const TOTAL_STEPS = 11

const GOAL_OPTIONS = [
  { value: "build_muscle", label: "Bygg muskler" },
  { value: "lose_weight", label: "Gå ned i vekt" },
  { value: "get_stronger", label: "Bli sterkere" },
  { value: "improve_endurance", label: "Bedre kondis" },
  { value: "maintain", label: "Holde formen" },
]

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "🌱 Nybegynner", sub: "Under 1 år" },
  { value: "intermediate", label: "💪 Middels", sub: "1–3 år" },
  { value: "advanced", label: "🏆 Erfaren", sub: "3+ år" },
]

const FREQUENCY_OPTIONS = [
  { value: 2, label: "1–2", sub: "dager/uke" },
  { value: 4, label: "3–4", sub: "dager/uke" },
  { value: 6, label: "5–6", sub: "dager/uke" },
  { value: 7, label: "7", sub: "dager/uke" },
]

const GENDER_OPTIONS = [
  { value: "male", label: "Mann" },
  { value: "female", label: "Kvinne" },
  { value: "other", label: "Vil ikke si" },
]

type FormData = {
  firstName: string
  lastName: string
  email: string
  password: string
  goals: string[]
  experienceLevel: string
  trainingDaysPerWeek: number | null
  gender: string
  birthDate: string
  heightCm: string
  weightKg: string
  avatarUrl: string | null
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>({
    firstName: "", lastName: "", email: "", password: "",
    goals: [], experienceLevel: "", trainingDaysPerWeek: null,
    gender: "", birthDate: "", heightCm: "", weightKg: "",
    avatarUrl: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function next() { setError(null); setStep((s) => s + 1) }
  function back() { setError(null); setStep((s) => s - 1) }

  async function handleSignUp() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { first_name: form.firstName, last_name: form.lastName } },
    })
    setLoading(false)
    if (signUpError) { setError(signUpError.message); return }
    next()
  }

  async function handleAvatarUpload(file: File) {
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError("Ikke innlogget"); return }
    const ext = file.name.split(".").pop() ?? "jpg"
    const path = `${user.id}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true })
    if (uploadError) {
      setError("Kunne ikke laste opp bilde. Prøv igjen eller hopp over.")
      return
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path)
    setForm((f) => ({ ...f, avatarUrl: publicUrl }))
    next()
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setError("Ikke innlogget"); setLoading(false); return }
    const res = await fetch(`${API_BASE}/api/users/profile`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: form.email,
        first_name: form.firstName,
        last_name: form.lastName,
        goals: form.goals,
        experience_level: form.experienceLevel,
        training_days_per_week: form.trainingDaysPerWeek,
        gender: form.gender,
        birth_date: form.birthDate,
        height_cm: parseInt(form.heightCm, 10),
        weight_kg: parseFloat(form.weightKg),
        avatar_url: form.avatarUrl,
      }),
    })
    setLoading(false)
    if (!res.ok) { setError("Noe gikk galt. Prøv igjen."); return }
    router.push("/home")
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#0d0d0d" }}>
      {/* Progress bar */}
      <div className="flex gap-1 px-6 pt-5">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-colors duration-300"
            style={{ height: 3, background: i <= step ? "var(--ai-accent, #ff6b35)" : "#2a2a2a" }}
          />
        ))}
      </div>

      {/* Back button */}
      {step > 0 && (
        <button onClick={back} className="self-start px-6 pt-3 text-sm" style={{ color: "#666" }}>
          ← Tilbake
        </button>
      )}

      <div className="flex-1 flex flex-col justify-center px-6">

        {/* Step 0: Name */}
        {step === 0 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">Hva heter du?</h1>
            <input
              type="text"
              placeholder="Fornavn"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              autoFocus
              className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            />
            <input
              type="text"
              placeholder="Etternavn"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            />
            <button
              onClick={next}
              disabled={!form.firstName || !form.lastName}
              className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40 mt-2"
              style={{ background: "var(--ai-accent, #ff6b35)" }}
            >
              Neste
            </button>
          </div>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">E-postadresse</h1>
            <input
              type="email"
              placeholder="din@epost.no"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              autoFocus
              className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            />
            <button
              onClick={next}
              disabled={!form.email}
              className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "var(--ai-accent, #ff6b35)" }}
            >
              Neste
            </button>
          </div>
        )}

        {/* Step 2: Password — calls signUp */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">Velg passord</h1>
            <p className="text-sm" style={{ color: "#666" }}>Minst 6 tegn</p>
            <input
              type="password"
              placeholder="Passord"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              autoFocus
              minLength={6}
              className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              onClick={handleSignUp}
              disabled={form.password.length < 6 || loading}
              className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "var(--ai-accent, #ff6b35)" }}
            >
              {loading ? "Oppretter konto..." : "Opprett konto"}
            </button>
          </div>
        )}

        {/* Step 3: Goals (multi-select) */}
        {step === 3 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">Hva er målet ditt?</h1>
            <p className="text-sm" style={{ color: "#666" }}>Velg ett eller flere</p>
            <div className="flex flex-col gap-2">
              {GOAL_OPTIONS.map((opt) => {
                const selected = form.goals.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        goals: selected
                          ? f.goals.filter((g) => g !== opt.value)
                          : [...f.goals, opt.value],
                      }))
                    }
                    className="rounded-xl px-4 py-3 text-sm text-left font-medium"
                    style={{
                      background: "#1a1a1a",
                      border: `1px solid ${selected ? "var(--ai-accent, #ff6b35)" : "#2a2a2a"}`,
                      color: selected ? "var(--ai-accent, #ff6b35)" : "#aaa",
                    }}
                  >
                    {selected ? "✓ " : ""}{opt.label}
                  </button>
                )
              })}
            </div>
            <button
              onClick={next}
              disabled={form.goals.length === 0}
              className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40 mt-1"
              style={{ background: "var(--ai-accent, #ff6b35)" }}
            >
              Neste
            </button>
          </div>
        )}

        {/* Step 4: Experience — tapping a card advances automatically */}
        {step === 4 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">Treningserfaring</h1>
            <div className="flex flex-col gap-2">
              {EXPERIENCE_OPTIONS.map((opt) => {
                const selected = form.experienceLevel === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setForm((f) => ({ ...f, experienceLevel: opt.value })); next() }}
                    className="rounded-xl px-4 py-3 text-left"
                    style={{
                      background: "#1a1a1a",
                      border: `1px solid ${selected ? "var(--ai-accent, #ff6b35)" : "#2a2a2a"}`,
                    }}
                  >
                    <div className="text-sm font-bold" style={{ color: selected ? "var(--ai-accent, #ff6b35)" : "white" }}>
                      {opt.label}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "#666" }}>{opt.sub}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 5: Frequency — tapping a card advances automatically */}
        {step === 5 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">Hvor ofte trener du?</h1>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCY_OPTIONS.map((opt) => {
                const selected = form.trainingDaysPerWeek === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setForm((f) => ({ ...f, trainingDaysPerWeek: opt.value })); next() }}
                    className="rounded-xl py-5 text-center"
                    style={{
                      background: "#1a1a1a",
                      border: `1px solid ${selected ? "var(--ai-accent, #ff6b35)" : "#2a2a2a"}`,
                    }}
                  >
                    <div className="text-2xl font-bold" style={{ color: selected ? "var(--ai-accent, #ff6b35)" : "white" }}>
                      {opt.label}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "#666" }}>{opt.sub}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 6: Gender — tapping advances automatically */}
        {step === 6 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">Kjønn</h1>
            <div className="flex flex-col gap-2">
              {GENDER_OPTIONS.map((opt) => {
                const selected = form.gender === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setForm((f) => ({ ...f, gender: opt.value })); next() }}
                    className="rounded-xl py-3 text-sm font-medium"
                    style={{
                      background: "#1a1a1a",
                      border: `1px solid ${selected ? "var(--ai-accent, #ff6b35)" : "#2a2a2a"}`,
                      color: selected ? "var(--ai-accent, #ff6b35)" : "#aaa",
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 7: Birth date */}
        {step === 7 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">Når er du født?</h1>
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
              max={new Date().toISOString().split("T")[0]}
              className="rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", colorScheme: "dark" }}
            />
            <button
              onClick={next}
              disabled={!form.birthDate}
              className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "var(--ai-accent, #ff6b35)" }}
            >
              Neste
            </button>
          </div>
        )}

        {/* Step 8: Height + weight */}
        {step === 8 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">Høyde og vekt</h1>
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs" style={{ color: "#666" }}>Høyde</label>
                <div
                  className="flex items-center rounded-xl"
                  style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                >
                  <input
                    type="number"
                    placeholder="180"
                    value={form.heightCm}
                    onChange={(e) => setForm((f) => ({ ...f, heightCm: e.target.value }))}
                    className="flex-1 px-4 py-3 text-sm text-white bg-transparent outline-none"
                  />
                  <span className="pr-3 text-xs" style={{ color: "#666" }}>cm</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs" style={{ color: "#666" }}>Vekt</label>
                <div
                  className="flex items-center rounded-xl"
                  style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                >
                  <input
                    type="number"
                    placeholder="80"
                    value={form.weightKg}
                    onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
                    className="flex-1 px-4 py-3 text-sm text-white bg-transparent outline-none"
                  />
                  <span className="pr-3 text-xs" style={{ color: "#666" }}>kg</span>
                </div>
              </div>
            </div>
            <button
              onClick={next}
              disabled={!form.heightCm || !form.weightKg}
              className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "var(--ai-accent, #ff6b35)" }}
            >
              Neste
            </button>
          </div>
        )}

        {/* Step 9: Profile picture (skippable) */}
        {step === 9 && (
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-white text-2xl font-bold text-center">Profilbilde</h1>
            <p className="text-sm" style={{ color: "#666" }}>Valgfritt</p>
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: "#1a1a1a",
                border: "2px dashed #333",
                overflow: "hidden",
              }}
            >
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Profilbilde" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl" style={{ color: "#444" }}>+</span>
              )}
            </div>
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <label
              className="rounded-xl py-3 px-8 text-sm font-bold text-white cursor-pointer"
              style={{ background: "var(--ai-accent, #ff6b35)" }}
            >
              Last opp bilde
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleAvatarUpload(file)
                }}
              />
            </label>
            <button onClick={next} className="text-sm" style={{ color: "#555" }}>
              Hopp over →
            </button>
          </div>
        )}

        {/* Step 10: Summary + submit */}
        {step === 10 && (
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h1 className="text-white text-2xl font-bold">Alt er klart!</h1>
              <p className="text-sm mt-1" style={{ color: "#666" }}>Hei, {form.firstName}!</p>
            </div>
            <div
              className="rounded-xl p-4 flex flex-col gap-2 text-sm"
              style={{ background: "#111", border: "1px solid #1e1e1e" }}
            >
              <div style={{ color: "#666" }}>
                Mål:{" "}
                <span style={{ color: "#aaa" }}>
                  {form.goals
                    .map((g) => GOAL_OPTIONS.find((o) => o.value === g)?.label)
                    .join(", ")}
                </span>
              </div>
              <div style={{ color: "#666" }}>
                Erfaring:{" "}
                <span style={{ color: "#aaa" }}>
                  {EXPERIENCE_OPTIONS.find((o) => o.value === form.experienceLevel)?.label}
                </span>
              </div>
              <div style={{ color: "#666" }}>
                Trening:{" "}
                <span style={{ color: "#aaa" }}>
                  {FREQUENCY_OPTIONS.find((o) => o.value === form.trainingDaysPerWeek)?.label} dager/uke
                </span>
              </div>
              <div style={{ color: "#666" }}>
                Kropp:{" "}
                <span style={{ color: "#aaa" }}>
                  {form.heightCm} cm · {form.weightKg} kg
                </span>
              </div>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "var(--ai-accent, #ff6b35)" }}
            >
              {loading ? "Lagrer..." : "Kom i gang 🚀"}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Start dev server**

```bash
cd web && npm run dev
```

- [ ] **Step 3: Test the full wizard manually**

Open http://localhost:3000/onboarding and verify each step:

1. Name: both fields required, Next disabled when empty ✓
2. Email: Next disabled when empty ✓
3. Password: "Opprett konto" calls signUp — check Supabase dashboard that user was created ✓
4. Goals: multi-select, checkmarks appear, Next disabled until at least one selected ✓
5. Experience: tap a card → advances immediately ✓
6. Frequency: tap a card → advances immediately ✓
7. Gender: tap a card → advances immediately ✓
8. Birth date: date picker, Next disabled when empty ✓
9. Height + weight: numeric inputs with unit labels, Next disabled when either empty ✓
10. Profile picture: upload works (if avatars bucket set up), skip works ✓
11. Summary: shows correct values, "Kom i gang" POSTs to API → redirects to /home ✓

- [ ] **Step 4: Verify redirect logic**

- Log out → visit http://localhost:3000/home → should redirect to /login ✓
- Log in as newly created user (just onboarded) → /home loads without redirect ✓
- Log in as old user with no profile row → /home redirects to /onboarding ✓

- [ ] **Step 5: Commit**

```bash
git add web/src/app/onboarding/page.tsx
git commit -m "feat: 11-step onboarding wizard"
```

---

### Manual Setup: Supabase Storage (avatars bucket)

Required before profile picture upload works. Do this in the Supabase dashboard.

- [ ] **Step 1: Create avatars bucket**

Supabase dashboard → Storage → **New bucket** → Name: `avatars` → Public: **ON** → Create bucket.

- [ ] **Step 2: Add upload policy**

Storage → avatars → **Policies** → **New policy** → For full customization:

- Policy name: `Allow authenticated uploads`
- Allowed operation: **INSERT**
- Target roles: **authenticated**
- Policy definition:
  ```sql
  (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
  ```

Click Review → Save policy.

This lets users upload only to their own folder (`{user_id}/avatar.jpg`).
