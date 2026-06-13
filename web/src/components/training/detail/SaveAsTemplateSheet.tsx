"use client"
import { useState } from "react"
import { createTemplateFromWorkout } from "@/lib/api"

interface Props {
  open: boolean
  workoutId: string
  onClose: () => void
  onSaved: (template: { id: string; name: string }) => void
}

// Dark-styled to match the always-dark WorkoutRun screen it renders over.
export default function SaveAsTemplateSheet({ open, workoutId, onClose, onSaved }: Props) {
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!open) return null

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    setError(null)
    try {
      const tpl = await createTemplateFromWorkout({ workout_id: workoutId, name: trimmed })
      setName("")
      onSaved(tpl)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke lagre mal")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 80,
        background: "rgba(0,0,0,0.7)",
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
          background: "#1a1a1a",
          borderRadius: "20px 20px 0 0",
          padding: "14px 20px 28px",
          color: "white",
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            background: "rgba(255,255,255,0.2)",
            borderRadius: 999,
            margin: "0 auto 14px",
          }}
        />
        <div style={{ fontSize: 16, fontWeight: 700, textAlign: "center", marginBottom: 4 }}>
          Lagre som mal
        </div>
        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.55)",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          Gjenbruk denne økta senere fra Trening.
        </p>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit()
          }}
          placeholder="Navn på mal — f.eks. Push A"
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 13,
            color: "white",
            outline: "none",
            marginBottom: 12,
          }}
        />

        {error && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 10 }}>{error}</div>}

        <button
          type="button"
          onClick={submit}
          disabled={!name.trim() || busy}
          style={{
            width: "100%",
            background: "var(--brand-orange)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: 13,
            fontSize: 14,
            fontWeight: 700,
            cursor: busy || !name.trim() ? "default" : "pointer",
            opacity: busy || !name.trim() ? 0.6 : 1,
          }}
        >
          {busy ? "Lagrer…" : "Lagre som mal"}
        </button>
      </div>
    </div>
  )
}
