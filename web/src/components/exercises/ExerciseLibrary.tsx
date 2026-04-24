"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SearchIcon, ChevronIcon } from "@/components/ui/icons"
import { filterExercises, MUSCLE_GROUPS, type MuscleGroup, type Exercise } from "@/lib/exercises"

export default function ExerciseLibrary({ swapSlot = null }: { swapSlot?: number | null }) {
  const router = useRouter()
  const [group, setGroup] = useState<MuscleGroup>("Alle")
  const [query, setQuery] = useState("")

  const exercises = filterExercises(group, query)
  const isSwapMode = swapSlot !== null

  function handleSelect(ex: Exercise) {
    if (isSwapMode) {
      sessionStorage.setItem(
        "pendingSwap",
        JSON.stringify({ slot: swapSlot, exerciseId: ex.id, exerciseName: ex.name })
      )
      router.back()
    } else {
      router.push(`/exercises/${ex.id}`)
    }
  }

  return (
    <div className="screen">
      <div style={{ height: 54 }} />

      {/* Header */}
      <div style={{ padding: "8px 20px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        {isSwapMode && (
          <button
            onClick={() => router.back()}
            aria-label="Tilbake"
            style={{
              width: 36, height: 36, borderRadius: 999, flexShrink: 0,
              background: "transparent", border: "none", color: "var(--fg-0)",
              display: "grid", placeItems: "center", cursor: "pointer",
            }}
          >
            <ChevronIcon dir="left" size={20} />
          </button>
        )}
        <div style={{ flex: 1 }}>
          <div className="display-l" style={{ marginBottom: 2 }}>
            {isSwapMode ? "Velg øvelse" : "Øvelser"}
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-2)", fontWeight: 500 }}>
            {isSwapMode
              ? "Velg øvelsen du ønsker å bytte til"
              : `${exercises.length} øvelser`}
          </div>
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
            aria-label="Søk etter øvelse"
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
                aria-pressed={active}
                aria-label={`Filter: ${g}`}
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
              onClick={() => handleSelect(ex)}
              aria-label={isSwapMode ? `Bytt til ${ex.name}` : `Se detaljer for ${ex.name}`}
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
              {isSwapMode ? (
                <div style={{
                  fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 999,
                  background: "var(--ai-accent-soft)", color: "var(--ai-accent)",
                  border: "1px solid rgba(255,107,53,0.2)", flexShrink: 0,
                }}>
                  Velg
                </div>
              ) : (
                <div style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase",
                  padding: "3px 7px", borderRadius: 6,
                  background: "var(--ai-accent-soft)", color: "var(--ai-accent)",
                  flexShrink: 0,
                }}>
                  {ex.primary}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
