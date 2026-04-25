# Social Feed Design

**Goal:** Replace mock social data with a real follow system, activity feed, likes, comments, user discovery, and weekly leaderboard.

**Architecture:** New `api/app/routers/social.py` handles all social endpoints. `social/page.tsx` becomes a server component that fetches feed data in parallel and passes it as props to `SocialScreen`. Workouts are private by default; users explicitly share a workout to the feed via a share button.

**Tech Stack:** Next.js 15 App Router, FastAPI, PostgreSQL/Supabase

---

## Data Model

### New tables

```sql
-- follows: who follows whom
CREATE TABLE follows (
  follower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

-- post_likes: one like per user per workout
CREATE TABLE post_likes (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, workout_id)
);

-- post_comments: comments on shared workouts
CREATE TABLE post_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Column added to `workouts`

```sql
ALTER TABLE workouts ADD COLUMN shared_at TIMESTAMPTZ NULL;
-- NULL = private, non-NULL = shared to feed (cannot be undone in MVP)
```

### RLS

All three new tables follow the same pattern as existing tables: users can only see/write their own rows. For `post_likes` and `post_comments`, users can read rows belonging to any shared workout (SELECT open), but can only INSERT/DELETE their own rows.

---

## API Endpoints

All endpoints require `Authorization: Bearer <token>`. Base: `/api`.

### Social router (`/api/social/`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/social/feed` | Shared workouts from followed users, newest first. Returns array of feed items (see shape below). |
| `POST` | `/api/social/follow/{user_id}` | Follow a user. 204 on success, 409 if already following. |
| `DELETE` | `/api/social/follow/{user_id}` | Unfollow a user. 204 on success, 404 if not following. |
| `GET` | `/api/social/suggestions` | Users the caller does not yet follow. Sorted by mutual followers desc, max 20. |
| `GET` | `/api/social/leaderboard` | All users ranked by total volume (kg) this calendar week (Mon–Sun). |
| `POST` | `/api/social/workouts/{workout_id}/like` | Toggle like. Returns `{ liked: true/false, count: number }`. |
| `GET` | `/api/social/workouts/{workout_id}/comments` | All comments on a workout, oldest first. |
| `POST` | `/api/social/workouts/{workout_id}/comments` | Post a comment. Body: `{ content: string }`. Returns created comment. |

### Workouts router addition

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/workouts/{workout_id}/share` | Set `shared_at = now()` on the workout. 200 on success, 404 if not found, 409 if already shared. Must be own workout. |

### User search

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/users/search?q=` | Search users by first or last name (case-insensitive, partial match). Returns array of `{ id, first_name, last_name, avatar_url }`. Min 2 chars. Max 20 results. |

---

## Response Shapes

### Feed item
```ts
{
  workout_id: string
  shared_at: string          // ISO timestamp
  user: {
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
  }
  workout: {
    name: string             // e.g. "Push A"
    duration_min: number     // derived from started_at → completed_at
    tags: string[]           // muscle groups (from exercise metadata)
    volume_kg: number        // sum of weight_kg × reps
    set_count: number
    avg_rpe: number | null
    is_pr: boolean           // true if any set is a personal record weight for that exercise
    top_exercises: Array<{
      name: string
      sets: number           // total sets for this exercise in the workout
      reps: number           // reps on the heaviest set
      weight_kg: number      // max weight lifted across all sets
    }>                       // top 3 exercises by volume (weight_kg × reps × sets)
  }
  likes: { count: number; liked_by_me: boolean }
  comments: { count: number }
}
```

### Suggestion
```ts
{
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
  mutual_follows: number
  streak: number
}
```

### Leaderboard entry
```ts
{
  rank: number
  user_id: string
  first_name: string
  last_name: string
  avatar_url: string | null
  volume_kg: number
  is_me: boolean
}
```

### Comment
```ts
{
  id: string
  user: { id: string; first_name: string; avatar_url: string | null }
  content: string
  created_at: string
}
```

---

## Frontend

### Files changed

| File | Change |
|------|--------|
| `web/src/app/(tabs)/social/page.tsx` | Server component: fetch feed + suggestions + leaderboard in parallel, pass as props |
| `web/src/components/social/SocialScreen.tsx` | Accept real props, remove all mock data, wire up interactions |
| `api/app/routers/social.py` | New — all social endpoints |
| `api/app/routers/workouts.py` | Add `POST /{id}/share` |
| `api/app/main.py` | Register social router |
| `api/db/migrations/006_social.sql` | New tables + `shared_at` column + RLS |

### Feed tab

- Server fetches feed via `GET /api/social/feed`, passes array to `SocialScreen`
- Each card shows: avatar (HSL gradient fallback), name, time ago, workout title, muscle tag chips, volume/sets/RPE row, top 3 exercises with `sets×reps @ weight`, PR badge if `is_pr`
- Like button: client-side toggle, calls `POST /api/social/workouts/{id}/like`, updates count optimistically
- Comment count chip: opens a bottom sheet with comments list + input to add new comment

### Discover tab

- "Folk du kanskje kjenner": fetched from `/api/social/suggestions`, follow/unfollow toggles call API, button state updates immediately
- Search: text input calls `/api/users/search?q=` on change (debounced 300ms), shows results below input with follow button
- Weekly leaderboard: fetched from `/api/social/leaderboard`, current user's row highlighted

### Share a workout

- "Del til feed"-button on the workout detail/completion screen
- Calls `POST /api/workouts/{id}/share`
- Button becomes disabled after share (cannot unshare in MVP)

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Feed fetch fails | Show empty state: "Kunne ikke laste feed" |
| Follow/unfollow fails | Revert optimistic UI, show toast |
| Like fails | Revert optimistic count |
| Comment post fails | Keep input text, show inline error |
| Suggestions fetch fails | Hide section silently |
| Leaderboard fetch fails | Show empty state in leaderboard section |
| Search: query < 2 chars | Don't call API, clear results |

---

## PR Detection

`is_pr` is `true` on a feed item if any set in the workout has a `weight_kg` value that is the highest ever recorded for that exercise by that user (across all their historical workouts). Computed server-side in the feed query.
