"use client"
import { useState } from "react"
import ExerciseDetailModal from "@/components/exercises/ExerciseDetailModal"

interface ExerciseRow {
  id: string
  exercise_id: string
  name: string
  image_url?: string | null
}

export interface DaySummary {
  id: string
  day_number: number
  name: string
  exercise_count: number
  exercises?: ExerciseRow[]
}

interface Props {
  day: DaySummary
  isToday: boolean
  onOpen?: (id: string) => void
}

export default function DayCard({ day, isToday, onOpen }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const handleToggle = () => {
    setExpanded((x) => !x)
    onOpen?.(day.id)
  }

  return (
    <>
      <div
        style={{
          background: "var(--brand-surface)",
          border: "1px solid var(--brand-border)",
          borderRadius: 12,
          padding: 14,
          marginBottom: 8,
        }}
      >
        <button
          type="button"
          onClick={handleToggle}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-ink)" }}>
              {day.name}
              {isToday && (
                <span
                  style={{
                    marginLeft: 8,
                    background: "var(--brand-orange)",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 999,
                  }}
                >
                  I DAG
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "var(--brand-muted)", marginTop: 2 }}>
              {day.exercise_count} øvelser
            </div>
          </div>
          <span style={{ fontSize: 14, color: "var(--brand-muted)" }}>{expanded ? "▾" : "▸"}</span>
        </button>

        {expanded && day.exercises && day.exercises.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {day.exercises.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setDetailId(ex.exercise_id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--brand-canvas)",
                  border: "1px solid var(--brand-border)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    background: "var(--brand-subtle)",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {ex.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ex.image_url}
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = "none"
                      }}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-ink)" }}>
                  {ex.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <ExerciseDetailModal exerciseId={detailId} onClose={() => setDetailId(null)} />
    </>
  )
}
