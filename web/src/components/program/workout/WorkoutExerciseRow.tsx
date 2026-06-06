"use client"
import { useState, useEffect } from "react"
import type { ProgramExercise } from "@/lib/api"

export interface SetLog {
  reps: number
  weightKg: number | null
  done: boolean
}

interface Props {
  ex: ProgramExercise
  log: SetLog[]
  onCheck: (setIndex: number, reps: number, weightKg: number | null) => void
  onAddSet?: () => void // only present in ad-hoc mode
}

export default function WorkoutExerciseRow({ ex, log, onCheck, onAddSet }: Props) {
  const [local, setLocal] = useState(log)

  // Keep local state synced when parent re-renders with new log
  // TODO(frontend-lint-debt): refactor to remove setState inside effect
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocal(log)
  }, [log])

  const target = ex.sets[0]
  const targetReps = target?.reps ?? "–"
  const targetWeight = target?.weight_kg != null ? `${target.weight_kg} kg` : "BW"

  return (
    <div
      style={{
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 10,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--brand-ink)" }}>{ex.name}</div>
      {ex.sets.length > 0 ? (
        <div style={{ fontSize: 11, color: "var(--brand-muted)", marginBottom: 8 }}>
          {ex.sets.length} × {targetReps} · {targetWeight}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "var(--brand-muted)", marginBottom: 8 }}>
          Ingen sett ennå
        </div>
      )}

      {local.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "20px 1fr 1fr 32px",
            gap: 6,
            marginBottom: 4,
            fontSize: 9,
            color: "var(--brand-faint)",
            fontWeight: 600,
            letterSpacing: 0.4,
            textTransform: "uppercase",
          }}
        >
          <span>#</span>
          <span>Reps</span>
          <span>Kg</span>
          <span />
        </div>
      )}

      {local.map((s, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "20px 1fr 1fr 32px",
            gap: 6,
            padding: "5px 0",
            background: s.done ? "var(--brand-subtle)" : "transparent",
            borderRadius: 6,
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--brand-faint)", fontWeight: 600 }}>
            {i + 1}
          </span>
          <input
            type="number"
            inputMode="numeric"
            aria-label={`Reps sett ${i + 1}`}
            value={s.reps}
            disabled={s.done}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10)
              if (isNaN(n)) return
              setLocal((prev) => prev.map((p, idx) => (idx === i ? { ...p, reps: n } : p)))
            }}
            style={inputStyle(s.done)}
          />
          <input
            type="number"
            inputMode="decimal"
            aria-label={`Kg sett ${i + 1}`}
            value={s.weightKg ?? ""}
            placeholder="BW"
            disabled={s.done}
            onChange={(e) => {
              const n = parseFloat(e.target.value)
              const kg = isNaN(n) ? null : n
              setLocal((prev) => prev.map((p, idx) => (idx === i ? { ...p, weightKg: kg } : p)))
            }}
            style={inputStyle(s.done)}
          />
          <button
            type="button"
            aria-label={`Fullfør sett ${i + 1}`}
            disabled={s.done}
            onClick={() => onCheck(i, local[i].reps, local[i].weightKg)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              border: s.done ? "none" : "1px solid var(--brand-border)",
              background: s.done ? "var(--brand-orange)" : "var(--brand-surface)",
              color: s.done ? "#fff" : "var(--brand-muted)",
              cursor: s.done ? "default" : "pointer",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
            }}
          >
            ✓
          </button>
        </div>
      ))}

      {onAddSet && (
        <button
          type="button"
          onClick={onAddSet}
          style={{
            marginTop: 8,
            width: "100%",
            background: "transparent",
            border: "1px dashed var(--brand-border)",
            color: "var(--brand-orange)",
            borderRadius: 8,
            padding: "8px 0",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Legg til sett
        </button>
      )}
    </div>
  )
}

function inputStyle(done: boolean): React.CSSProperties {
  return {
    background: done ? "transparent" : "var(--brand-canvas)",
    border: done ? "none" : "1px solid var(--brand-border)",
    borderRadius: 8,
    padding: "5px 8px",
    color: done ? "var(--brand-muted)" : "var(--brand-ink)",
    fontSize: 13,
    fontWeight: 600,
    width: "100%",
    boxSizing: "border-box",
  }
}
