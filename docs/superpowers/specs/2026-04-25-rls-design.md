# Row Level Security Design

**Goal:** Add PostgreSQL Row Level Security policies to all user-data tables so that direct database access is isolated per user.

**Architecture:** One migration file `api/db/migrations/005_rls.sql` enables RLS and creates policies on all user-owned tables. The FastAPI backend connects as a superuser (bypasses RLS by design — app-level auth already enforced via JWT). RLS protects against direct DB access outside the API and any future Supabase client usage.

**Tech Stack:** PostgreSQL, Supabase Auth (`auth.uid()`)

---

## Tables

### User-owned (RLS enabled, policies per user)

| Table | Policy basis |
|-------|-------------|
| `users` | `id = auth.uid()` |
| `workouts` | `user_id = auth.uid()` |
| `workout_sets` | `workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())` |
| `programs` | `user_id = auth.uid()` |
| `program_days` | `program_id IN (SELECT id FROM programs WHERE user_id = auth.uid())` |
| `program_exercises` | `program_day_id IN (SELECT id FROM program_days WHERE program_id IN (SELECT id FROM programs WHERE user_id = auth.uid()))` |

### Shared (public read, no RLS)

| Table | Access |
|-------|--------|
| `exercises` | Public SELECT for all — no RLS needed |

---

## Policies per table

### `users`
- SELECT: own row only
- INSERT: own row only (`id = auth.uid()`)
- UPDATE: own row only
- DELETE: none (users are not deleted via API)

### `workouts`
- SELECT: own rows
- INSERT: own rows (`user_id = auth.uid()`)
- UPDATE: own rows
- DELETE: own rows

### `workout_sets`
- SELECT: sets belonging to own workouts
- INSERT: sets belonging to own workouts
- UPDATE: sets belonging to own workouts
- DELETE: sets belonging to own workouts

### `programs`
- SELECT: own rows
- INSERT: own rows
- UPDATE: own rows
- DELETE: own rows

### `program_days`
- SELECT: days belonging to own programs
- INSERT: days belonging to own programs
- UPDATE: days belonging to own programs
- DELETE: days belonging to own programs

### `program_exercises`
- SELECT: exercises belonging to own program days
- INSERT: exercises belonging to own program days
- UPDATE: exercises belonging to own program days
- DELETE: exercises belonging to own program days

---

## Migration file

`api/db/migrations/005_rls.sql`

---

## Testing

Run migration in Supabase dashboard SQL editor. Verify:
- Backend API still works (superuser bypasses RLS — no change expected)
- Supabase Table Editor shows only the logged-in user's rows when browsing as `authenticated` role
