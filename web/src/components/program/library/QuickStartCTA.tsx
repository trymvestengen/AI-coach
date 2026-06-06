"use client"

interface Props {
  onStart: () => void
  busy?: boolean
}

export default function QuickStartCTA({ onStart, busy }: Props) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "var(--brand-muted)",
          fontWeight: 600,
          margin: "0 4px 6px",
        }}
      >
        Hurtigstart
      </div>
      <button
        type="button"
        onClick={onStart}
        disabled={busy}
        style={{
          width: "100%",
          background: "var(--brand-surface)",
          border: "1.5px dashed var(--brand-border)",
          borderRadius: 12,
          padding: 12,
          fontSize: 13,
          fontWeight: 700,
          color: "var(--brand-muted)",
          cursor: busy ? "default" : "pointer",
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Starter…" : "+ Start tom økt"}
      </button>
    </div>
  )
}
