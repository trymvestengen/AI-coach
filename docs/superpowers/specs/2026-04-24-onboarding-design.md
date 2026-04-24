# Onboarding Flow Design

**Goal:** Replace the temporary `/register` page with a focused, step-by-step onboarding wizard that collects account credentials and fitness profile data before letting new users into the app.

**Architecture:** 11-screen client-side wizard at `/onboarding`. State is held in `useState` within a single page component. Account is created at step 3 (password). Remaining profile data is submitted in one `POST /api/users/profile` call at the final step.

**Tech Stack:** Next.js App Router, Supabase Auth (`@supabase/ssr`), Supabase Storage (avatars), FastAPI, PostgreSQL

---

## Wizard Screens

| Step | Screen | Content | Notes |
|------|--------|---------|-------|
| 1 | Navn | Fornavn, etternavn | No auth yet |
| 2 | E-post | Email input | No auth yet |
| 3 | Passord | Password input | Calls `signUp` — user is now authenticated |
| 4 | Mål | Multi-select goals | Flervalg |
| 5 | Erfaring | Nybegynner / Middels / Erfaren | Single select |
| 6 | Frekvens | 1–2 / 3–4 / 5–6 / 7 dager/uke | Single select |
| 7 | Kjønn | Mann / Kvinne / Vil ikke si | Single select |
| 8 | Fødselsdato | Date input (DD/MM/ÅÅÅÅ) | |
| 9 | Høyde + vekt | height_cm, weight_kg | Two fields, one screen |
| 10 | Profilbilde | File upload to Supabase Storage | Skippable |
| 11 | Ferdig | Summary → submit → /home | Calls POST /api/users/profile |

Progress bar: thin segmented bar at top, one segment per step. Back button on all steps except step 1.

---

## Goals Options (step 4)

- Bygg muskler → `"build_muscle"`
- Gå ned i vekt → `"lose_weight"`
- Bli sterkere → `"get_stronger"`
- Bedre kondis → `"improve_endurance"`
- Holde formen → `"maintain"`

Stored as `TEXT[]` in the database.

## Experience Options (step 5)

- Nybegynner (under 1 år) → `"beginner"`
- Middels (1–3 år) → `"intermediate"`
- Erfaren (3+ år) → `"advanced"`

## Frequency Options (step 6)

- 1–2 dager/uke → `2`
- 3–4 dager/uke → `4`
- 5–6 dager/uke → `6`
- 7 dager/uke → `7`

Stored as `INTEGER` (upper bound of range) in the database.

## Gender Options (step 7)

- Mann → `"male"`
- Kvinne → `"female"`
- Vil ikke si → `"other"`

---

## Database Migration

New migration `004_onboarding.sql`:

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS experience_level       TEXT,
  ADD COLUMN IF NOT EXISTS training_days_per_week INTEGER,
  ADD COLUMN IF NOT EXISTS gender                 TEXT,
  ADD COLUMN IF NOT EXISTS height_cm              INTEGER,
  ADD COLUMN IF NOT EXISTS weight_kg              NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS birth_date             DATE,
  ADD COLUMN IF NOT EXISTS avatar_url             TEXT;

-- goals: TEXT → TEXT[] (multi-select)
ALTER TABLE users
  ALTER COLUMN goals TYPE TEXT[]
  USING CASE WHEN goals IS NULL THEN NULL ELSE ARRAY[goals] END;
```

All new columns are nullable — users who registered before onboarding is live are unaffected.

---

## Backend: New Endpoints

### `GET /api/users/profile` (authenticated)

Returns the current user's profile row, or `404` if no row exists yet. Used by `/home` server component to check onboarding completion.

Response (200):
```json
{
  "id": "uuid",
  "first_name": "Ola",
  "last_name": "Nordmann",
  "goals": ["build_muscle"],
  "experience_level": "beginner",
  "training_days_per_week": 4,
  "gender": "male",
  "birth_date": "1995-06-15",
  "height_cm": 180,
  "weight_kg": 80.0,
  "avatar_url": null
}
```

### `POST /api/users/profile` (authenticated)

Request body:
```json
{
  "first_name": "Ola",
  "last_name": "Nordmann",
  "goals": ["build_muscle", "get_stronger"],
  "experience_level": "beginner",
  "training_days_per_week": 4,
  "gender": "male",
  "birth_date": "1995-06-15",
  "height_cm": 180,
  "weight_kg": 80.0,
  "avatar_url": null
}
```

Behaviour: `INSERT INTO users ... ON CONFLICT (id) DO UPDATE SET ...` — idempotent, safe to call multiple times.

New file: `api/app/routers/users.py`. Registered in `api/app/main.py`.

---

## Supabase Storage

Bucket: `avatars` (public read, authenticated write).

Upload path: `{user_id}/avatar.{ext}`

The frontend uploads to Supabase Storage directly using the browser client, gets back a public URL, then passes `avatar_url` to `POST /api/users/profile`.

Setup required in Supabase dashboard: create `avatars` bucket, set policy to allow authenticated users to upload to their own folder.

---

## Routing & Middleware Changes

### `/onboarding` is semi-public

- Unauthenticated users: allowed (steps 1–2 need no auth)
- Authenticated users mid-flow: allowed (steps 4–11)
- Authenticated users who completed onboarding: redirected to `/home` by middleware

Middleware adds `/onboarding` to the list of paths that are accessible without authentication, but does **not** redirect authenticated users away from it (unlike `/login` and `/register`).

### Onboarding completion check

The middleware checks for a completed profile by querying whether a `users` row exists for the current user. If the user is authenticated but has no row in `users`, they are redirected to `/onboarding` regardless of which route they requested.

To avoid a DB query on every request, the check is done in the **home page server component** (`/home/page.tsx`), not in middleware. The server component calls `GET /api/users/profile` with the user's JWT. A `404` response means onboarding is not complete → redirect to `/onboarding`.

### `/register` removed

`/app/register/page.tsx` is deleted. A redirect from `/register` → `/onboarding` is added to `next.config.ts`.

### Updated `PUBLIC_PATHS` in middleware

```typescript
const PUBLIC_PATHS = ["/login", "/register", "/onboarding"]
// Authenticated users on /login and /register → redirect to /home
// Authenticated users on /onboarding → NOT redirected (mid-flow)
const REDIRECT_WHEN_AUTHED = ["/login", "/register"]
```

---

## Frontend Files

| File | Action |
|------|--------|
| `src/app/onboarding/page.tsx` | New — the 11-step wizard |
| `src/app/register/page.tsx` | Deleted |
| `src/middleware.ts` | Updated PUBLIC_PATHS logic |
| `src/app/(tabs)/home/page.tsx` | Add profile-existence check → redirect to /onboarding |
| `next.config.ts` | Add redirect: /register → /onboarding |

---

## Error Handling

- Steps 1–2: no API calls, no errors possible
- Step 3 (signUp): show Supabase error inline (e.g. "E-post allerede i bruk")
- Steps 4–10: local state only, no errors
- Step 11 (submit): show error if `POST /api/users/profile` fails; keep user on step 11 with retry button
- Profile picture upload: if upload fails, show error but allow skipping

---

## Testing

**Backend:**
- `GET /api/users/profile` with no existing row → 404
- `GET /api/users/profile` with existing row → 200 with profile data
- `GET /api/users/profile` without auth → 401
- `POST /api/users/profile` with valid data → 200, row created
- `POST /api/users/profile` called twice → 200, row updated (idempotent)
- `POST /api/users/profile` without auth → 401

**Frontend (manual):**
- Complete full 11-step flow → land on /home
- Back button works on all steps 2–11
- Skip profile picture → completes successfully
- Existing user (row already in DB) hitting /home → not redirected to /onboarding
- New user (no row) hitting /home → redirected to /onboarding
