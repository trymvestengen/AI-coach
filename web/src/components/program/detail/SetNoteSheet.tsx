"use client"
import { useState, useEffect } from "react"

interface Props {
  open: boolean
  initialNote: string
  setNumber: number
  onClose: () => void
  onSave: (notes: string) => void
  onDelete: () => void
}

export default function SetNoteSheet({
  open,
  initialNote,
  setNumber,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [notes, setNotes] = useState(initialNote)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) setNotes(initialNote)
  }, [open, initialNote])
  /* eslint-enable */

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 70,
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
          Notat — sett {setNumber}
        </h2>
        <textarea
          autoFocus
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          placeholder="F.eks. tungt, dårlig form, kunne tatt mer…"
          rows={4}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 14,
            border: "1px solid var(--brand-border)",
            borderRadius: 8,
            background: "white",
            outline: "none",
            boxSizing: "border-box",
            resize: "vertical",
            minHeight: 80,
            marginBottom: 12,
            fontFamily: "inherit",
          }}
        />
        <div style={{ display: "flex", gap: 10 }}>
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
            Slett sett
          </button>
          <button
            type="button"
            onClick={() => onSave(notes)}
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
