# Trinn 7E: Social Screen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bygg Social-skjermen med feed-tab (expanderbare FeedCards med like/kommentar) og discover-tab (forslag + ukentlig leaderboard).

**Architecture:** Tre tasks: (1) legg til 6 nye ikoner i icons.tsx, (2) skriv `SocialScreen.tsx` med alle sub-komponenter og mock-data, (3) skriv om `social/page.tsx`. Ingen backend, ingen nye ruter. Mock-data inlined.

**Tech Stack:** Next.js 15, TypeScript, CSS custom properties, inline styles + eksisterende CSS utility klasser (.card, .caption, .metric-s, .title-m, .display-l, .tnum, .screen).

---

## File Map

**Modified:**
- `web/src/components/ui/icons.tsx` — legg til HeartIcon, CommentIcon, ShareIcon, SearchIcon, CheckIcon, UserPlusIcon
- `web/src/app/(tabs)/social/page.tsx` — skriv om til å importere SocialScreen

**Created:**
- `web/src/components/social/SocialScreen.tsx` — full Social-skjerm

---

### Task 1: Nye ikoner

**Files:**
- Modify: `web/src/components/ui/icons.tsx`

- [ ] **Step 1: Legg til 6 ikoner på slutten av icons.tsx**

Åpne `/Users/trymvestengen/Desktop/ai-coach/web/src/components/ui/icons.tsx` og legg til disse eksportene etter `ListIcon`:

```tsx
export const HeartIcon = ({ size = 16, filled = false }: IconProps & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>
  </svg>
)

export const CommentIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-4 3.5V17H6a2 2 0 0 1-2-2V6Z"/>
  </svg>
)

export const ShareIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12M8 7l4-4 4 4M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>
  </svg>
)

export const SearchIcon = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5"/>
    <path d="M20 20l-3.5-3.5"/>
  </svg>
)

export const CheckIcon = ({ size = 12 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12l5 5L20 7"/>
  </svg>
)

export const UserPlusIcon = ({ size = 12 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="10" cy="8" r="3.5"/>
    <path d="M3 20c0.7-3.4 3.3-5 7-5s6.3 1.6 7 5"/>
    <path d="M19 5v6M16 8h6"/>
  </svg>
)
```

- [ ] **Step 2: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npx tsc --noEmit
```

Forventet: ingen feil.

- [ ] **Step 3: Commit**

```bash
git -C /Users/trymvestengen/Desktop/ai-coach add web/src/components/ui/icons.tsx
git -C /Users/trymvestengen/Desktop/ai-coach commit -m "feat: add HeartIcon, CommentIcon, ShareIcon, SearchIcon, CheckIcon, UserPlusIcon"
```

---

### Task 2: SocialScreen-komponenten

**Files:**
- Create: `web/src/components/social/SocialScreen.tsx`

- [ ] **Step 1: Opprett SocialScreen.tsx**

Opprett `/Users/trymvestengen/Desktop/ai-coach/web/src/components/social/SocialScreen.tsx` med dette innholdet:

```tsx
"use client"

import { useState } from "react"
import {
  BoltIcon, HeartIcon, CommentIcon, ShareIcon,
  SearchIcon, CheckIcon, UserPlusIcon,
} from "@/components/ui/icons"

/* ── Types ── */
interface ExerciseHighlight {
  name: string
  detail: string
  pr: boolean
}

interface Post {
  id: string
  user: string
  hue: number
  when: string
  duration: string
  name: string
  tags: string[]
  volume: string
  sets: number
  rpe: number
  pr: boolean
  likes: number
  liked: boolean
  comments: number
  exercises: ExerciseHighlight[]
}

interface Suggestion {
  id: string
  name: string
  hue: number
  mutuals: number
  streak: number
}

interface LeaderEntry {
  id: string
  name: string
  hue: number
  volume: string
  me?: boolean
}

/* ── Mock data ── */
const MOCK_FEED: Post[] = [
  {
    id: "p1", user: "markus", hue: 200, when: "38 min ago", duration: "52 min",
    name: "Heavy Squat Day", tags: ["Legs", "Lower"],
    volume: "9 420 kg", sets: 22, rpe: 8.4, pr: true, likes: 12, liked: false, comments: 3,
    exercises: [
      { name: "Back Squat",  detail: "140 × 5", pr: true  },
      { name: "RDL",         detail: "120 × 8", pr: false },
      { name: "Leg Press",   detail: "200 × 10",pr: false },
    ],
  },
  {
    id: "p2", user: "sofia_k", hue: 330, when: "2t siden", duration: "46 min",
    name: "Push Session", tags: ["Push", "Chest", "Triceps"],
    volume: "5 840 kg", sets: 19, rpe: 7.9, pr: false, likes: 8, liked: true, comments: 1,
    exercises: [
      { name: "Bench Press",     detail: "70 × 6",    pr: false },
      { name: "Overhead Press",  detail: "42.5 × 8",  pr: false },
      { name: "Cable Fly",       detail: "15 × 12",   pr: false },
    ],
  },
  {
    id: "p3", user: "jonas_berg", hue: 150, when: "i går", duration: "61 min",
    name: "Pull A", tags: ["Pull", "Back", "Biceps"],
    volume: "7 120 kg", sets: 21, rpe: 8.2, pr: true, likes: 24, liked: false, comments: 6,
    exercises: [
      { name: "Deadlift",    detail: "170 × 3", pr: true  },
      { name: "Pull-up",     detail: "+15 × 6", pr: false },
      { name: "Barbell Row", detail: "80 × 8",  pr: false },
    ],
  },
]

const MOCK_SUGGESTIONS: Suggestion[] = [
  { id: "s1", name: "emma_w",    hue: 280, mutuals: 4, streak: 8  },
  { id: "s2", name: "tobias",    hue: 40,  mutuals: 2, streak: 12 },
  { id: "s3", name: "linnea.f",  hue: 180, mutuals: 6, streak: 5  },
  { id: "s4", name: "david_ol",  hue: 10,  mutuals: 1, streak: 3  },
]

const MOCK_LEADERBOARD: LeaderEntry[] = [
  { id: "l1", name: "jonas_berg", hue: 150, volume: "74.2 t"          },
  { id: "l2", name: "markus",     hue: 200, volume: "68.0 t"          },
  { id: "l3", name: "Trym (deg)", hue: 20,  volume: "62.4 t", me: true },
  { id: "l4", name: "sofia_k",    hue: 330, volume: "58.1 t"          },
  { id: "l5", name: "emma_w",     hue: 280, volume: "51.9 t"          },
]

/* ── Avatar ── */
function Avatar({ name, hue, size = 36 }: { name: string; hue: number; size?: number }) {
  const initial = name.charAt(0).toUpperCase()
  return (
    <div role="img" aria-label={name} style={{
      width: size, height: size, borderRadius: 999,
      background: `linear-gradient(135deg, hsl(${hue} 60% 45%), hsl(${(hue + 40) % 360} 55% 28%))`,
      display: "grid", placeItems: "center",
      color: "var(--fg-0)", fontWeight: 600,
      fontSize: Math.round(size * 0.38), letterSpacing: "-0.01em", flexShrink: 0,
    }}>
      {initial}
    </div>
  )
}

/* ── MuscleTag ── */
function MuscleTag({ label, accent }: { label: string; accent: boolean }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase",
      padding: "3px 7px", borderRadius: 6,
      background: accent ? "var(--ai-accent-soft)" : "rgba(255,255,255,0.06)",
      color: accent ? "var(--ai-accent)" : "var(--fg-2)",
    }}>
      {label}
    </div>
  )
}

/* ── FeedCard ── */
function FeedCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.liked)
  const [likes, setLikes] = useState(post.likes)

  function toggleLike() {
    setLiked(prev => {
      setLikes(n => n + (prev ? -1 : 1))
      return !prev
    })
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Avatar name={post.user} hue={post.hue} size={38} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.008em" }}>{post.user}</div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 500 }}>
            {post.when} · {post.duration}
          </div>
        </div>
        {post.pr && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 10, color: "var(--ai-accent)", fontWeight: 700,
            padding: "4px 8px", background: "var(--ai-accent-soft)", borderRadius: 999,
            letterSpacing: 0.4, textTransform: "uppercase",
          }}>
            <BoltIcon size={10} /> PR
          </div>
        )}
      </div>

      {/* Workout title + tags */}
      <div className="title-m" style={{ marginBottom: 6 }}>{post.name}</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {post.tags.map((t, i) => <MuscleTag key={t} label={t} accent={i === 0} />)}
      </div>

      {/* Metrics row */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8, padding: "12px 0", marginBottom: 12,
        borderTop: "1px solid var(--border-1)",
        borderBottom: "1px solid var(--border-1)",
      }}>
        <div>
          <div className="caption" style={{ marginBottom: 3 }}>Volum</div>
          <div className="metric-s tnum">{post.volume}</div>
        </div>
        <div>
          <div className="caption" style={{ marginBottom: 3 }}>Sett</div>
          <div className="metric-s tnum">{post.sets}</div>
        </div>
        <div>
          <div className="caption" style={{ marginBottom: 3 }}>Avg RPE</div>
          <div className="metric-s tnum">{post.rpe}</div>
        </div>
      </div>

      {/* Top exercises */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
        {post.exercises.map(e => (
          <div key={e.name} style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 13, color: "var(--fg-1)",
          }}>
            <span style={{ fontWeight: 500, letterSpacing: "-0.005em" }}>
              {e.pr && (
                <span style={{ color: "var(--ai-accent)", marginRight: 6, fontSize: 10, fontWeight: 700 }}>★</span>
              )}
              {e.name}
            </span>
            <span className="tnum" style={{ color: "var(--fg-2)", fontWeight: 500 }}>{e.detail}</span>
          </div>
        ))}
      </div>

      {/* Action row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 18,
        paddingTop: 10, borderTop: "1px solid var(--border-1)",
      }}>
        <button onClick={toggleLike} style={{
          background: "none", border: "none", padding: 0, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
          color: liked ? "var(--ai-accent)" : "var(--fg-2)",
          fontSize: 13, fontWeight: 500,
        }}>
          <HeartIcon size={16} filled={liked} />
          <span className="tnum">{likes}</span>
        </button>
        <button style={{
          background: "none", border: "none", padding: 0, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
          color: "var(--fg-2)", fontSize: 13, fontWeight: 500,
        }}>
          <CommentIcon size={16} />
          <span className="tnum">{post.comments}</span>
        </button>
        <button style={{
          background: "none", border: "none", padding: 0, cursor: "pointer",
          color: "var(--fg-2)", marginLeft: "auto",
        }}>
          <ShareIcon size={16} />
        </button>
      </div>
    </div>
  )
}

/* ── SuggestionCard ── */
function SuggestionCard({ s }: { s: Suggestion }) {
  const [following, setFollowing] = useState(false)
  return (
    <div style={{
      width: 150, flexShrink: 0,
      background: "var(--bg-2)", border: "1px solid var(--border-1)",
      borderRadius: 16, padding: 12,
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <Avatar name={s.name} hue={s.hue} size={48} />
      <div style={{
        fontSize: 13, fontWeight: 600, letterSpacing: "-0.008em",
        marginTop: 8, textAlign: "center", color: "var(--fg-0)",
      }}>
        {s.name}
      </div>
      <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 2, textAlign: "center" }}>
        {s.mutuals} felles · {s.streak}u streak
      </div>
      <button
        onClick={() => setFollowing(f => !f)}
        style={{
          marginTop: 10, width: "100%",
          padding: "7px 0", borderRadius: 999,
          background: following ? "transparent" : "var(--ai-accent)",
          color: following ? "var(--fg-1)" : "var(--primary-foreground)",
          border: following ? "1px solid var(--border-1)" : "none",
          fontSize: 12, fontWeight: 600, letterSpacing: "-0.005em",
          cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
        }}
      >
        {following
          ? <><CheckIcon size={12} /> Følger</>
          : <><UserPlusIcon size={12} /> Følg</>
        }
      </button>
    </div>
  )
}

/* ── LeaderRow ── */
function LeaderRow({ entry, rank }: { entry: LeaderEntry; rank: number }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 12px",
      background: entry.me ? "var(--ai-accent-soft)" : "transparent",
      borderRadius: 12,
      border: entry.me ? "1px solid rgba(255,107,53,0.22)" : "1px solid transparent",
    }}>
      <div className="tnum" style={{
        width: 18, textAlign: "center",
        fontSize: 12, color: rank <= 3 ? "var(--ai-accent)" : "var(--fg-3)",
        fontWeight: 700, flexShrink: 0,
      }}>
        {rank}
      </div>
      <Avatar name={entry.name} hue={entry.hue} size={30} />
      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, letterSpacing: "-0.005em" }}>
        {entry.name}
        {entry.me && (
          <span style={{ color: "var(--ai-accent)", marginLeft: 6, fontWeight: 500, fontSize: 11 }}>· deg</span>
        )}
      </div>
      <div className="tnum" style={{ fontSize: 13, fontWeight: 600 }}>{entry.volume}</div>
    </div>
  )
}

/* ── SocialScreen (main export) ── */
export default function SocialScreen() {
  const [tab, setTab] = useState<"feed" | "discover">("feed")

  return (
    <div className="screen">
      <div style={{ height: 54 }} />

      {/* Header */}
      <div style={{ padding: "6px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="display-l">Social</div>
          <div style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 2, fontWeight: 500 }}>
            18 venner trener denne uken
          </div>
        </div>
        <button style={{
          width: 40, height: 40, borderRadius: 999,
          background: "var(--bg-2)", border: "1px solid var(--border-1)",
          color: "var(--fg-0)", display: "grid", placeItems: "center", cursor: "pointer",
        }}>
          <SearchIcon size={18} />
        </button>
      </div>

      {/* Segmented control */}
      <div style={{ padding: "4px 20px 12px" }}>
        <div style={{
          display: "flex", background: "var(--bg-2)",
          border: "1px solid var(--border-1)", borderRadius: 999, padding: 3,
        }}>
          {(["feed", "discover"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 999,
                background: tab === t ? "var(--bg-4)" : "transparent",
                border: "none", cursor: "pointer",
                color: tab === t ? "var(--fg-0)" : "var(--fg-2)",
                fontSize: 13, fontWeight: 600, letterSpacing: "-0.005em",
              }}
            >
              {t === "feed" ? "Feed" : "Discover"}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 120px" }}>
        {tab === "feed" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {MOCK_FEED.map(p => <FeedCard key={p.id} post={p} />)}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Suggestions */}
            <div>
              <div className="caption" style={{ marginBottom: 10, padding: "0 2px" }}>Folk du kanskje kjenner</div>
              <div style={{
                display: "flex", gap: 10, overflowX: "auto",
                margin: "0 -20px", padding: "0 20px",
              }}>
                {MOCK_SUGGESTIONS.map(s => <SuggestionCard key={s.id} s={s} />)}
              </div>
            </div>

            {/* Leaderboard */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 2px 8px" }}>
                <div className="caption">Ukentlig leaderboard</div>
                <div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 500 }}>etter volum</div>
              </div>
              <div className="card" style={{ padding: 6 }}>
                {MOCK_LEADERBOARD.map((entry, i) => (
                  <LeaderRow key={entry.id} entry={entry} rank={i + 1} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npx tsc --noEmit
```

Forventet: ingen feil.

- [ ] **Step 3: Commit**

```bash
git -C /Users/trymvestengen/Desktop/ai-coach add web/src/components/social/SocialScreen.tsx
git -C /Users/trymvestengen/Desktop/ai-coach commit -m "feat: add SocialScreen with feed, discover tab, leaderboard"
```

---

### Task 3: Oppdater social/page.tsx

**Files:**
- Modify: `web/src/app/(tabs)/social/page.tsx`

- [ ] **Step 1: Erstatt hele page.tsx**

Skriv over `/Users/trymvestengen/Desktop/ai-coach/web/src/app/(tabs)/social/page.tsx` med:

```tsx
import SocialScreen from "@/components/social/SocialScreen"

export default function SocialPage() {
  return <SocialScreen />
}
```

- [ ] **Step 2: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npx tsc --noEmit
```

Forventet: ingen feil.

- [ ] **Step 3: Commit**

```bash
git -C /Users/trymvestengen/Desktop/ai-coach add "web/src/app/(tabs)/social/page.tsx"
git -C /Users/trymvestengen/Desktop/ai-coach commit -m "feat: wire /social page to SocialScreen"
```
