"use client"
import { useState, useEffect } from "react"

interface Props {
  open: boolean
  initialName: string
  onClose: () => void
  onSave: (name: string) => void
}

export default function RenameDaySheet({ open, initialName, onClose, onSave }: Props) {
  const [name, setName] = useState(initialName)

  // TODO(frontend-lint-debt): re-sync local state when sheet reopens with new initial value
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setName(initialName)
  }, [open, initialName])

  if (!open) return null
  const trimmed = name.trim()

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
          Endre navn
        </h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 14,
            border: "1px solid var(--brand-border)",
            borderRadius: 8,
            background: "white",
            outline: "none",
            boxSizing: "border-box",
            marginBottom: 12,
          }}
        />
        <button
          type="button"
          disabled={trimmed.length === 0}
          onClick={() => onSave(trimmed)}
          style={{
            width: "100%",
            background: trimmed ? "var(--brand-orange)" : "var(--brand-border)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "12px 0",
            fontSize: 14,
            fontWeight: 700,
            cursor: trimmed ? "pointer" : "not-allowed",
          }}
        >
          Lagre
        </button>
      </div>
    </div>
  )
}
