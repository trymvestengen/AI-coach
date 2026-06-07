"use client"
import { useState } from "react"

interface Props {
  initialName: string
  onNext: (name: string) => void
}

export default function WorkoutNameStep({ initialName, onNext }: Props) {
  const [name, setName] = useState(initialName)
  const trimmed = name.trim()
  const canContinue = trimmed.length > 0

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
        Navn
      </h1>
      <p style={{ fontSize: 13, color: "var(--brand-muted)", marginBottom: 32 }}>
        Tilpass navnet hvis du vil
      </p>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        placeholder="Min økt"
        style={{
          fontSize: 18,
          padding: "8px 0",
          border: "none",
          borderBottom: "1px solid var(--brand-ink)",
          background: "transparent",
          outline: "none",
          width: "100%",
        }}
      />
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          disabled={!canContinue}
          onClick={() => onNext(trimmed)}
          style={{
            background: canContinue ? "var(--brand-orange)" : "var(--brand-border)",
            color: "white",
            border: "none",
            borderRadius: 99,
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 700,
            cursor: canContinue ? "pointer" : "not-allowed",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          → Fortsett
        </button>
      </div>
    </div>
  )
}
