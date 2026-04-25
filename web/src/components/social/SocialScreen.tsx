"use client"

import { useState, useEffect, useRef } from "react"
import {
  BoltIcon, HeartIcon, CommentIcon,
  SearchIcon, CheckIcon, UserPlusIcon,
} from "@/components/ui/icons"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

/* ── Types ── */
interface TopExercise {
  name: string
  sets: number
  reps: number
  weight_kg: number
}

interface FeedItem {
  workout_id: string
  shared_at: string
  user: { id: string; first_name: string; last_name: string; avatar_url: string | null }
  workout: {
    name: string
    duration_min: number
    tags: string[]
    volume_kg: number
    set_count: number
    avg_rpe: number | null
    is_pr: boolean
    top_exercises: TopExercise[]
  }
  likes: { count: number; liked_by_me: boolean }
  comments: { count: number }
}

interface Suggestion {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
  mutual_follows: number
  streak: number
}

interface LeaderEntry {
  rank: number
  user_id: string
  first_name: string
  last_name: string
  avatar_url: string | null
  volume_kg: number
  is_me: boolean
}

interface Comment {
  id: string
  content: string
  created_at: string
  user: { id: string; first_name: string; avatar_url: string | null }
}

interface SocialScreenProps {
  accessToken: string
  feed: FeedItem[]
  suggestions: Suggestion[]
  leaderboard: LeaderEntry[]
}

/* ── Helpers ── */
function hueFromId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffff
  }
  return hash % 360
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m siden`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}t siden`
  const days = Math.floor(hours / 24)
  if (days === 1) return "i går"
  return `${days} dager siden`
}

/* ── Avatar ── */
function Avatar({ name, hue, size = 36 }: { name: string; hue: number; size?: number }) {
  return (
    <div role="img" aria-label={name} style={{
      width: size, height: size, borderRadius: 999,
      background: `linear-gradient(135deg, hsl(${hue} 60% 45%), hsl(${(hue + 40) % 360} 55% 28%))`,
      display: "grid", placeItems: "center",
      color: "var(--fg-0)", fontWeight: 600,
      fontSize: Math.round(size * 0.38), letterSpacing: "-0.01em", flexShrink: 0,
    }}>
      {name.charAt(0).toUpperCase()}
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
function FeedCard({ item, accessToken }: { item: FeedItem; accessToken: string }) {
  const [liked, setLiked] = useState(item.likes.liked_by_me)
  const [likeCount, setLikeCount] = useState(item.likes.count)
  const [commentCount, setCommentCount] = useState(item.comments.count)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const displayName = `${item.user.first_name} ${item.user.last_name}`
  const hue = hueFromId(item.user.id)

  async function toggleLike() {
    const prevLiked = liked
    const prevCount = likeCount
    setLiked(!prevLiked)
    setLikeCount(n => n + (prevLiked ? -1 : 1))
    try {
      const res = await fetch(`${API_BASE}/api/social/workouts/${item.workout_id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setLiked(data.liked)
        setLikeCount(data.count)
      } else {
        setLiked(prevLiked)
        setLikeCount(prevCount)
      }
    } catch {
      setLiked(prevLiked)
      setLikeCount(prevCount)
    }
  }

  async function openComments() {
    setShowComments(prev => !prev)
    if (!commentsLoaded) {
      try {
        const res = await fetch(`${API_BASE}/api/social/workouts/${item.workout_id}/comments`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (res.ok) {
          setComments(await res.json())
          setCommentsLoaded(true)
        }
      } catch { /* fail silently */ }
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/social/workouts/${item.workout_id}/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      })
      if (res.ok) {
        const newComment = await res.json()
        setComments(prev => [...prev, newComment])
        setCommentCount(n => n + 1)
        setCommentText("")
      }
    } catch { /* fail silently */ } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Avatar name={displayName} hue={hue} size={38} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.008em" }}>{displayName}</div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 500 }}>
            {timeAgo(item.shared_at)} · {item.workout.duration_min} min
          </div>
        </div>
        {item.workout.is_pr && (
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

      {/* Title + tags */}
      <div className="title-m" style={{ marginBottom: 6 }}>{item.workout.name}</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {item.workout.tags.map((t, i) => <MuscleTag key={t} label={t} accent={i === 0} />)}
      </div>

      {/* Metrics */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8, padding: "12px 0", marginBottom: 12,
        borderTop: "1px solid var(--border-1)",
        borderBottom: "1px solid var(--border-1)",
      }}>
        <div>
          <div className="caption" style={{ marginBottom: 3 }}>Volum</div>
          <div className="metric-s tnum">{item.workout.volume_kg.toLocaleString("no-NO")} kg</div>
        </div>
        <div>
          <div className="caption" style={{ marginBottom: 3 }}>Sett</div>
          <div className="metric-s tnum">{item.workout.set_count}</div>
        </div>
        <div>
          <div className="caption" style={{ marginBottom: 3 }}>Avg RPE</div>
          <div className="metric-s tnum">{item.workout.avg_rpe?.toFixed(1) ?? "—"}</div>
        </div>
      </div>

      {/* Top exercises */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
        {item.workout.top_exercises.map(e => (
          <div key={e.name} style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 13, color: "var(--fg-1)",
          }}>
            <span style={{ fontWeight: 500, letterSpacing: "-0.005em" }}>{e.name}</span>
            <span className="tnum" style={{ color: "var(--fg-2)", fontWeight: 500 }}>
              {e.sets}×{e.reps} @ {e.weight_kg} kg
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
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
          <span className="tnum">{likeCount}</span>
        </button>
        <button onClick={openComments} style={{
          background: "none", border: "none", padding: 0, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
          color: showComments ? "var(--fg-0)" : "var(--fg-2)",
          fontSize: 13, fontWeight: 500,
        }}>
          <CommentIcon size={16} />
          <span className="tnum">{commentCount}</span>
        </button>
      </div>

      {/* Inline comments section */}
      {showComments && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--border-1)", paddingTop: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
            {comments.length === 0 && commentsLoaded && (
              <div style={{ fontSize: 12, color: "var(--fg-3)" }}>Ingen kommentarer ennå.</div>
            )}
            {comments.map(c => (
              <div key={c.id} style={{ display: "flex", gap: 8 }}>
                <Avatar name={c.user.first_name} hue={hueFromId(c.user.id)} size={24} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{c.user.first_name} </span>
                  <span style={{ fontSize: 12, color: "var(--fg-1)" }}>{c.content}</span>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={submitComment} style={{ display: "flex", gap: 8 }}>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Legg til kommentar…"
              style={{
                flex: 1, background: "var(--bg-2)", border: "1px solid var(--border-1)",
                borderRadius: 10, padding: "8px 12px", fontSize: 13,
                color: "var(--fg-0)", outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || submitting}
              style={{
                background: "var(--ai-accent)", border: "none", borderRadius: 10,
                padding: "8px 14px", fontSize: 12, fontWeight: 600,
                color: "var(--primary-foreground)", cursor: "pointer",
                opacity: !commentText.trim() || submitting ? 0.5 : 1,
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

/* ── SuggestionCard ── */
function SuggestionCard({ s, accessToken }: { s: Suggestion; accessToken: string }) {
  const [following, setFollowing] = useState(false)
  const hue = hueFromId(s.id)
  const name = `${s.first_name} ${s.last_name}`

  async function toggleFollow() {
    const method = following ? "DELETE" : "POST"
    const prev = following
    setFollowing(f => !f)
    try {
      const res = await fetch(`${API_BASE}/api/social/follow/${s.id}`, {
        method,
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) setFollowing(prev)
    } catch {
      setFollowing(prev)
    }
  }

  return (
    <div style={{
      width: 150, flexShrink: 0,
      background: "var(--bg-2)", border: "1px solid var(--border-1)",
      borderRadius: 16, padding: 12,
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <Avatar name={name} hue={hue} size={48} />
      <div style={{
        fontSize: 13, fontWeight: 600, letterSpacing: "-0.008em",
        marginTop: 8, textAlign: "center", color: "var(--fg-0)",
      }}>
        {s.first_name}
      </div>
      <div style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 2, textAlign: "center" }}>
        {s.mutual_follows} felles · {s.streak} aktive dager
      </div>
      <button
        onClick={toggleFollow}
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
function LeaderRow({ entry }: { entry: LeaderEntry }) {
  const name = `${entry.first_name} ${entry.last_name}`
  const hue = hueFromId(entry.user_id)
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 12px",
      background: entry.is_me ? "var(--ai-accent-soft)" : "transparent",
      borderRadius: 12,
      border: entry.is_me ? "1px solid rgba(255,107,53,0.22)" : "1px solid transparent",
    }}>
      <div className="tnum" style={{
        width: 18, textAlign: "center",
        fontSize: 12, color: entry.rank <= 3 ? "var(--ai-accent)" : "var(--fg-3)",
        fontWeight: 700, flexShrink: 0,
      }}>
        {entry.rank}
      </div>
      <Avatar name={name} hue={hue} size={30} />
      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, letterSpacing: "-0.005em" }}>
        {entry.first_name}
        {entry.is_me && (
          <span style={{ color: "var(--ai-accent)", marginLeft: 6, fontWeight: 500, fontSize: 11 }}>· deg</span>
        )}
      </div>
      <div className="tnum" style={{ fontSize: 13, fontWeight: 600 }}>
        {(entry.volume_kg / 1000).toFixed(1)} t
      </div>
    </div>
  )
}

/* ── SearchResult ── */
function SearchResult({ user, accessToken }: { user: { id: string; first_name: string; last_name: string; avatar_url: string | null }; accessToken: string }) {
  const [following, setFollowing] = useState(false)
  const hue = hueFromId(user.id)
  const name = `${user.first_name} ${user.last_name}`

  async function toggleFollow() {
    const method = following ? "DELETE" : "POST"
    const prev = following
    setFollowing(f => !f)
    try {
      const res = await fetch(`${API_BASE}/api/social/follow/${user.id}`, {
        method,
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) setFollowing(prev)
    } catch {
      setFollowing(prev)
    }
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
      borderBottom: "1px solid var(--border-1)",
    }}>
      <Avatar name={name} hue={hue} size={36} />
      <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{name}</div>
      <button
        onClick={toggleFollow}
        style={{
          padding: "6px 12px", borderRadius: 999,
          background: following ? "transparent" : "var(--ai-accent)",
          color: following ? "var(--fg-1)" : "var(--primary-foreground)",
          border: following ? "1px solid var(--border-1)" : "none",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}
      >
        {following ? "Følger" : "Følg"}
      </button>
    </div>
  )
}

/* ── SocialScreen ── */
export default function SocialScreen({ accessToken, feed, suggestions, leaderboard }: SocialScreenProps) {
  const [tab, setTab] = useState<"feed" | "discover">("feed")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{ id: string; first_name: string; last_name: string; avatar_url: string | null }[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        )
        if (res.ok) setSearchResults(await res.json())
      } catch { /* fail silently */ }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery, accessToken])

  return (
    <div className="screen">
      <div style={{ height: 54 }} />

      {/* Header */}
      <div style={{ padding: "6px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="display-l">Social</div>
          <div style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 2, fontWeight: 500 }}>
            {feed.length} delte økter denne uken
          </div>
        </div>
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
          feed.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--fg-3)", fontSize: 14 }}>
              Følg noen for å se treningsøktene deres her.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {feed.map(item => <FeedCard key={item.workout_id} item={item} accessToken={accessToken} />)}
            </div>
          )
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Search */}
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "var(--bg-2)", border: "1px solid var(--border-1)",
                borderRadius: 14, padding: "10px 14px",
              }}>
                <SearchIcon size={16} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Søk på navn…"
                  style={{
                    flex: 1, background: "none", border: "none", outline: "none",
                    fontSize: 14, color: "var(--fg-0)",
                  }}
                />
              </div>
              {searchResults.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  {searchResults.map(u => (
                    <SearchResult key={u.id} user={u} accessToken={accessToken} />
                  ))}
                </div>
              )}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <div className="caption" style={{ marginBottom: 10, padding: "0 2px" }}>Folk du kanskje kjenner</div>
                <div style={{
                  display: "flex", gap: 10, overflowX: "auto",
                  margin: "0 -20px", padding: "0 20px",
                }}>
                  {suggestions.map(s => <SuggestionCard key={s.id} s={s} accessToken={accessToken} />)}
                </div>
              </div>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 2px 8px" }}>
                  <div className="caption">Ukentlig leaderboard</div>
                  <div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 500 }}>etter volum</div>
                </div>
                <div className="card" style={{ padding: 6 }}>
                  {leaderboard.map(entry => <LeaderRow key={entry.user_id} entry={entry} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
