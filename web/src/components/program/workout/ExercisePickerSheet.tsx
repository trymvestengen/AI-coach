"use client"
import { useEffect, useMemo, useState } from "react"
import { getExercises, type Exercise } from "@/lib/api"

interface Props {
  open: boolean
  onClose: () => void
  onPick: (exercise: Exercise) => void
}

export default function ExercisePickerSheet({ open, onClose, onPick }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  // TODO(frontend-lint-debt): setState calls inside effect are intentional here (async data fetch)
  useEffect(() => {
    if (!open || exercises.length > 0) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    getExercises()
      .then(setExercises)
      .catch((e) => setError(e instanceof Error ? e.message : "Kunne ikke laste"))
      .finally(() => setLoading(false))
  }, [open, exercises.length])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return exercises.slice(0, 100)
    return exercises
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.muscle_groups.some((mg) => mg.toLowerCase().includes(q))
      )
      .slice(0, 100)
  }, [exercises, query])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 20px 28px",
          height: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            background: "var(--brand-border)",
            borderRadius: 999,
            margin: "0 auto 14px",
          }}
        />
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--brand-ink)",
            textAlign: "center",
            letterSpacing: "-0.02em",
            marginBottom: 12,
          }}
        >
          Velg øvelse
        </div>

        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søk øvelse eller muskelgruppe…"
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "var(--brand-surface)",
            border: "1.5px solid var(--brand-border)",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            color: "var(--brand-ink)",
            marginBottom: 12,
          }}
        />

        {error && (
          <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10 }}>{error}</div>
        )}

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "var(--brand-muted)", padding: 20 }}>
              Laster…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--brand-muted)", padding: 20 }}>
              Ingen treff
            </div>
          ) : (
            filtered.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => {
                  onPick(ex)
                  onClose()
                }}
                style={{
                  width: "100%",
                  background: "var(--brand-surface)",
                  border: "1px solid var(--brand-border)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  marginBottom: 6,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-ink)" }}>
                  {ex.name}
                </div>
                {ex.muscle_groups.length > 0 && (
                  <div style={{ fontSize: 10, color: "var(--brand-muted)", marginTop: 2 }}>
                    {ex.muscle_groups.join(", ")}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
