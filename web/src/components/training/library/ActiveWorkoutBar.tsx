"use client"

interface Props {
  label: string
  onContinue: () => void
}

export default function ActiveWorkoutBar({ label, onContinue }: Props) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 2,
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "10px 16px",
        background: "var(--ai-accent-soft)",
        borderTop: "1px solid color-mix(in srgb, var(--brand-orange) 32%, transparent)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span aria-hidden="true" style={{ fontSize: 16 }}>
          🔥
        </span>
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: "var(--brand-ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>
      <button
        type="button"
        onClick={onContinue}
        style={{
          flex: "none",
          background: "none",
          border: "none",
          color: "var(--brand-orange-deep)",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        fortsett ›
      </button>
    </div>
  )
}
