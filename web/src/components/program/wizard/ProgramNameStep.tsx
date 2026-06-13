"use client"
import { useState } from "react"

interface Props {
  initialName: string
  onNext: (name: string) => void
}

export default function ProgramNameStep({ initialName, onNext }: Props) {
  const [name, setName] = useState(initialName)
  const trimmed = name.trim()
  const canContinue = trimmed.length > 0

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
        Programnavn
      </h1>
      <p style={{ fontSize: 13, color: "var(--brand-muted)", marginBottom: 26 }}>
        Hva skal programmet hete?
      </p>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
        placeholder="F.eks. PPL 4-dagers"
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
      <p style={{ fontSize: 11, color: "var(--brand-muted)", marginTop: 8 }}>
        Du kan endre senere.
      </p>
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
