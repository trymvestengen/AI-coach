"use client"
import { useState, useEffect } from "react"

interface Props {
  open: boolean
  initial: { sets: number; reps: number; weight_kg: number | null; notes: string }
  onClose: () => void
  onSave: (body: { sets: number; reps: number; weight_kg: number | null; notes: string }) => void
}

export default function EditExerciseSheet({ open, initial, onClose, onSave }: Props) {
  const [sets, setSets] = useState(initial.sets)
  const [reps, setReps] = useState(initial.reps)
  const [weight, setWeight] = useState<number | null>(initial.weight_kg)
  const [notes, setNotes] = useState(initial.notes)

  // TODO(frontend-lint-debt): re-sync local state when sheet reopens with new initial values
  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setSets(initial.sets)
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
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, textAlign: "center" }}>
          Rediger sett
        </h2>

        <Field id="sets-input" label="Sett">
          <input
            id="sets-input"
            type="number"
            min={1}
            max={20}
            value={sets}
            onChange={(e) => setSets(Math.max(1, Number(e.target.value) || 1))}
            style={fieldInput}
          />
        </Field>
        <Field id="reps-input" label="Reps">
          <input
            id="reps-input"
            type="number"
            min={1}
            max={99}
            value={reps}
            onChange={(e) => setReps(Math.max(1, Number(e.target.value) || 1))}
            style={fieldInput}
          />
        </Field>
        <Field id="weight-input" label="Vekt (kg)">
          <input
            id="weight-input"
            type="number"
            min={0}
            step={0.5}
            value={weight ?? ""}
            onChange={(e) => setWeight(e.target.value === "" ? null : Number(e.target.value))}
            placeholder="(bodyweight)"
            style={fieldInput}
          />
        </Field>
        <Field id="notes-input" label="Notes">
          <textarea
            id="notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            placeholder="F.eks. kontroller form, øk vekt neste uke"
            rows={3}
            style={{ ...fieldInput, resize: "vertical", minHeight: 60 }}
          />
        </Field>

        <button
          type="button"
          onClick={() => onSave({ sets, reps, weight_kg: weight, notes })}
          style={{
            width: "100%",
            background: "var(--brand-orange)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "12px 0",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            marginTop: 10,
          }}
        >
          Lagre
        </button>
      </div>
    </div>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <label htmlFor={id} style={{ display: "block", marginBottom: 12 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--brand-muted)",
          display: "block",
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}

const fieldInput: React.CSSProperties = {
  width: "100%",
  padding: "9px 11px",
  fontSize: 14,
  border: "1px solid var(--brand-border)",
  borderRadius: 8,
  background: "white",
  outline: "none",
  boxSizing: "border-box",
}
