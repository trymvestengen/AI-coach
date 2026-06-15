"use client"
import { useState } from "react"
import { createCustomExercise } from "@/lib/api"

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (id: string) => void
}

const MUSCLES = ["chest", "back", "legs", "shoulders", "arms", "core"]
const MUSCLE_NO: Record<string, string> = {
  chest: "Bryst",
  back: "Rygg",
  legs: "Bein",
  shoulders: "Skuldre",
  arms: "Armer",
  core: "Core",
}

export default function NewExerciseSheet({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("")
  const [muscle, setMuscle] = useState("chest")
  const [equipment, setEquipment] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await createCustomExercise({
        name: trimmed,
        primary_muscles: [muscle],
        equipment: equipment.trim() ? [equipment.trim()] : [],
      })
      onCreated(res.id)
    } catch {
      setError("Kunne ikke lage øvelsen. Prøv igjen.")
      setBusy(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 70,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        className="forge"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--brand-surface)",
          color: "var(--brand-ink)",
          borderRadius: "20px 20px 0 0",
          padding: "16px 20px 26px",
          boxShadow: "0 -6px 32px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            background: "var(--brand-border)",
            borderRadius: 99,
            margin: "0 auto 16px",
          }}
        />
        <h2 className="display-title" style={{ fontSize: 20, marginBottom: 14 }}>
          Ny øvelse
        </h2>
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-muted)" }}>Navn</label>
        <input
          aria-label="Navn"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            margin: "6px 0 14px",
            background: "var(--brand-subtle)",
            border: "1px solid var(--brand-border)",
            borderRadius: 10,
            padding: "11px 12px",
            color: "var(--brand-ink)",
            fontSize: 14,
            outline: "none",
          }}
        />
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-muted)" }}>
          Målmuskel
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0 14px" }}>
          {MUSCLES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMuscle(m)}
              style={{
                padding: "7px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: muscle === m ? "var(--brand-orange)" : "var(--brand-subtle)",
                color: muscle === m ? "#fff" : "var(--brand-ink)",
                border: `1px solid ${muscle === m ? "var(--brand-orange)" : "var(--brand-border)"}`,
              }}
            >
              {MUSCLE_NO[m]}
            </button>
          ))}
        </div>
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-muted)" }}>
          Utstyr (valgfritt)
        </label>
        <input
          aria-label="Utstyr"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          placeholder="f.eks. manualer"
          style={{
            width: "100%",
            boxSizing: "border-box",
            margin: "6px 0 16px",
            background: "var(--brand-subtle)",
            border: "1px solid var(--brand-border)",
            borderRadius: 10,
            padding: "11px 12px",
            color: "var(--brand-ink)",
            fontSize: 14,
            outline: "none",
          }}
        />
        {error && (
          <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10 }}>{error}</div>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="btn btn-primary btn-block"
          style={{ opacity: busy ? 0.7 : 1 }}
        >
          Lag øvelse
        </button>
      </div>
    </div>
  )
}
