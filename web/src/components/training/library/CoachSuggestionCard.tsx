"use client"

export interface CoachSuggestion {
  template_id: string
  name: string
  reason: string | null
}

interface Props {
  suggestion: CoachSuggestion
  onStart: (templateId: string) => void
  onSwap: () => void
}

export default function CoachSuggestionCard({ suggestion, onStart, onSwap }: Props) {
  return (
    <div
      style={{
        background: "var(--ai-accent-soft)",
        border: "1px solid color-mix(in srgb, var(--brand-orange) 28%, transparent)",
        borderRadius: 18,
        padding: "18px 18px 16px",
        marginBottom: 4,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--brand-orange-deep)",
        }}
      >
        Coachen foreslår
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: "var(--brand-ink)",
          letterSpacing: "-0.03em",
          margin: "10px 0 4px",
        }}
      >
        {suggestion.name}
      </div>
      {suggestion.reason && (
        <div style={{ fontSize: 13, color: "var(--brand-muted)", marginBottom: 16 }}>
          {suggestion.reason}
        </div>
      )}
      <button
        type="button"
        onClick={() => onStart(suggestion.template_id)}
        style={{
          width: "100%",
          background: "var(--brand-orange)",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          padding: "13px 16px",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Start økt →
      </button>
      <div style={{ textAlign: "center", marginTop: 12 }}>
        <button
          type="button"
          onClick={onSwap}
          style={{
            background: "none",
            border: "none",
            color: "var(--brand-orange-deep)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Bytt →
        </button>
      </div>
    </div>
  )
}
