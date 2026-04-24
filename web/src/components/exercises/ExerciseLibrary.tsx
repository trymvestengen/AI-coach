"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SearchIcon } from "@/components/ui/icons"
import { filterExercises, MUSCLE_GROUPS, type MuscleGroup } from "@/lib/exercises"

export default function ExerciseLibrary() {
  const router = useRouter()
  const [group, setGroup] = useState<MuscleGroup>("Alle")
  const [query, setQuery] = useState("")

  const exercises = filterExercises(group, query)

  return (
    <div className="screen">
      <div style={{ height: 54 }} />

      {/* Header */}
      <div style={{ padding: "8px 20px 12px" }}>
        <div className="display-l" style={{ marginBottom: 2 }}>Øvelser</div>
        <div style={{ fontSize: 13, color: "var(--fg-2)", fontWeight: 500 }}>
          {exercises.length} øvelser
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "0 20px 10px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--bg-2)", border: "1px solid var(--border-1)",
          borderRadius: 12, padding: "10px 14px",
        }}>
          <SearchIcon size={16} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Søk etter øvelse..."
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "var(--fg-0)", fontSize: 14, fontWeight: 500,
            }}
          />
        </div>
      </div>

      {/* Muscle group filter */}
      <div style={{ padding: "0 20px 10px" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {MUSCLE_GROUPS.map(g => {
            const active = group === g
            return (
              <button
                key={g}
                onClick={() => setGroup(g)}
                style={{
                  flexShrink: 0, height: 32, padding: "0 14px", borderRadius: 999,
                  background: active ? "var(--ai-accent-soft)" : "var(--bg-2)",
                  border: active ? "1px solid rgba(255,107,53,0.3)" : "1px solid var(--border-1)",
                  color: active ? "var(--ai-accent)" : "var(--fg-2)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                {g}
              </button>
            )
          })}
        </div>
      </div>

      {/* Exercise list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 100px" }}>
        <div className="card" style={{ overflow: "hidden" }}>
          {exercises.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--fg-3)", fontSize: 14 }}>
              Ingen øvelser funnet
            </div>
          ) : exercises.map((ex, i) => (
            <button
              key={ex.id}
              onClick={() => router.push(`/exercises/${ex.id}`)}
              style={{
                width: "100%", textAlign: "left", background: "none",
                border: "none", color: "inherit", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px",
                borderTop: i === 0 ? "none" : "1px solid var(--border-1)",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: "var(--bg-3)", border: "1px solid var(--border-1)",
                display: "grid", placeItems: "center",
                fontSize: 16,
              }}>
                💪
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.008em" }}>{ex.name}</div>
                <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>
                  {ex.primary} · {ex.equipment}
                </div>
              </div>
              <div style={{
                fontSize: 10, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase",
                padding: "3px 7px", borderRadius: 6,
                background: "var(--ai-accent-soft)", color: "var(--ai-accent)",
                flexShrink: 0,
              }}>
                {ex.primary}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
