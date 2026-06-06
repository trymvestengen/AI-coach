"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { discardWorkout } from "@/lib/api"

interface Props {
  open: boolean
  workoutId: string
  onCancel: () => void
}

export default function CloseConfirmSheet({ open, workoutId, onCancel }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  if (!open) return null

  const handlePause = () => {
    router.push("/program")
  }
  const handleDiscard = async () => {
    setBusy(true)
    try {
      await discardWorkout(workoutId)
      router.push("/program")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
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
            marginBottom: 16,
          }}
        >
          Lukk økten?
        </div>

        <button
          type="button"
          onClick={handlePause}
          disabled={busy}
          style={{
            width: "100%",
            background: "var(--brand-surface)",
            border: "1px solid var(--brand-border)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--brand-ink)",
            cursor: busy ? "default" : "pointer",
          }}
        >
          Lukk og fortsett senere
        </button>
        <button
          type="button"
          onClick={handleDiscard}
          disabled={busy}
          style={{
            width: "100%",
            background: "var(--brand-surface)",
            border: "1px solid var(--brand-border)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--danger)",
            cursor: busy ? "default" : "pointer",
          }}
        >
          {busy ? "Forkaster…" : "Forkast økt"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            color: "var(--brand-muted)",
            fontSize: 13,
            padding: 10,
            cursor: "pointer",
          }}
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}
