# Profile Page Design

**Goal:** Replace the placeholder `/profile` page with a read-only overview of the user's fitness profile and a log out button.

**Architecture:** Server component fetches profile from `GET /api/users/profile` using the user's JWT. All data is read-only — editing is deferred to a future settings feature.

**Tech Stack:** Next.js App Router, Supabase Auth (`@supabase/ssr`), FastAPI

---

## Screen

Single scrollable page at `/profile` (inside the `(tabs)` layout, so bottom nav is visible).

### Header
- Avatar image if `avatar_url` is set, otherwise a placeholder icon
- Full name (`first_name + last_name`)
- Email address

### Goals section
- Label: "Mål"
- Goals rendered as pill/chip badges (one per goal, translated to Norwegian display labels)

| Value | Display |
|-------|---------|
| `build_muscle` | Bygg muskler |
| `lose_weight` | Gå ned i vekt |
| `get_stronger` | Bli sterkere |
| `improve_endurance` | Bedre kondis |
| `maintain` | Holde formen |

### Stats grid (2 columns)
| Tile | Value |
|------|-------|
| Erfaring | Nybegynner / Middels / Erfaren |
| Frekvens | e.g. "3–4 dager/uke" |
| Høyde · Vekt | e.g. "180 cm · 80 kg" |
| Alder | Calculated from `birth_date`, e.g. "30 år" |

Experience level display labels:
- `beginner` → Nybegynner
- `intermediate` → Middels
- `advanced` → Erfaren

Frequency display labels:
- `2` → 1–2 dager/uke
- `4` → 3–4 dager/uke
- `6` → 5–6 dager/uke
- `7` → 7 dager/uke

### Footer
- "Logg ut" button (full width, red-tinted border)
- Calls `supabase.auth.signOut()` then redirects to `/login`

---

## Data Flow

1. Page renders as a server component
2. Reads session via `createServerSupabaseClient().auth.getSession()`
3. Fetches `GET /api/users/profile` with `Authorization: Bearer <token>`
4. If 404 → redirect to `/onboarding`
5. If non-200/404 → throw (Next.js error boundary)
6. Renders profile data

Log out is handled client-side: a small `"use client"` `LogoutButton` component calls `supabase.auth.signOut()` and `router.push("/login")`.

---

## Files

| File | Action |
|------|--------|
| `src/app/(tabs)/profile/page.tsx` | Replace placeholder with server component |
| `src/components/profile/LogoutButton.tsx` | New — client component for sign out |

---

## No Backend Changes

`GET /api/users/profile` already returns all needed fields. No new endpoints required.

---

## Error Handling

- 404 from profile API → redirect to `/onboarding`
- Non-200 → throw (Next.js will show error boundary)
- Missing `avatar_url` → show placeholder icon
- Missing `birth_date` → hide age tile

---

## Testing (manual)

- Logged-in user with complete profile → all tiles show correct data
- User with no avatar → placeholder icon shown
- Log out button → redirects to `/login`, session cleared
- Unauthenticated user hitting `/profile` → middleware redirects to `/login`
