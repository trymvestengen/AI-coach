"use client"
import { useState, useEffect } from "react"

interface Props {
  open: boolean
  initial: { reps: number; weight_kg: number | null; notes: string }
  onClose: () => void
  onSave: (body: { reps: number; weight_kg: number | null; notes: string }) => void
  onDelete?: () => void
}

export default function EditSetSheet({ open, initial, onClose, onSave, onDelete }: Props) {
  const [reps, setReps] = useState(initial.reps)
  const [weight, setWeight] = useState<number | null>(initial.weight_kg)
  const [notes, setNotes] = useState(initial.notes)

  // TODO(frontend-lint-debt): re-sync local state when sheet reopens with new initial values
  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setReps(initial.reps)
      setWeight(initial.weight_kg)
      setNotes(initial.notes)
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, initial])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.5)",
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
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            background: "var(--brand-border)",
            borderRadius: 99,
            margin: "0 auto 14px",
          }}
        />
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 14,
            textAlign: "center",
          }}
        >
          Rediger sett
        </h2>

        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <label style={{ flex: 1 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--brand-muted)",
                display: "block",
                marginBottom: 4,
              }}
            >
              Vekt (kg)
            </span>
            <input
              type="number"
              min={0}
              step={0.5}
              value={weight ?? ""}
              onChange={(e) => setWeight(e.target.value === "" ? null : Number(e.target.value))}
              placeholder="—"
              style={fieldInput}
            />
          </label>
          <label style={{ flex: 1 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--brand-muted)",
                display: "block",
                marginBottom: 4,
              }}
            >
              Reps
            </span>
            <input
              type="number"
              min={1}
              max={99}
              value={reps}
              onChange={(e) => setReps(Math.max(1, Number(e.target.value) || 1))}
              style={fieldInput}
            />
          </label>
        </div>

        <label style={{ display: "block", marginBottom: 14 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--brand-muted)",
              display: "block",
              marginBottom: 4,
            }}
          >
            Notat
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            placeholder="F.eks. tungt, dårlig form, kunne tatt mer…"
            rows={3}
            style={{ ...fieldInput, resize: "vertical", minHeight: 60 }}
          />
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              style={{
                flex: 1,
                background: "transparent",
                color: "#dc2626",
                border: "1px solid var(--brand-border)",
                borderRadius: 12,
                padding: "12px 0",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Slett
            </button>
          )}
          <button
            type="button"
            onClick={() => onSave({ reps, weight_kg: weight, notes })}
            style={{
              flex: 2,
              background: "var(--brand-orange)",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: "12px 0",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Lagre
          </button>
        </div>
      </div>
    </div>
  )
}

const fieldInput: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  border: "1px solid var(--brand-border)",
  borderRadius: 8,
  background: "white",
  outline: "none",
  boxSizing: "border-box",
}
