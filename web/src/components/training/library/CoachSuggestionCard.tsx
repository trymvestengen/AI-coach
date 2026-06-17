"use client"

export interface CoachSuggestion {
  template_id: string
  name: string
  reason: string | null
}

interface Props {
  suggestion: CoachSuggestion
  onStart: (templateId: string) => void
}

export default function CoachSuggestionCard({ suggestion, onStart }: Props) {
  return (
    <section
      style={{
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        borderLeft: "3px solid var(--brand-orange)",
        borderRadius: 12,
        padding: "10px 14px",
        marginBottom: 8,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {/* Eyebrow */}
      <div className="eyebrow" style={{ color: "var(--brand-orange)" }}>
        Neste økt
      </div>

      {/* Name + Start button in one row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display), 'Archivo', sans-serif",
            fontStretch: "125%",
            fontWeight: 800,
            fontSize: 17,
            letterSpacing: "-0.02em",
            color: "var(--brand-ink)",
            lineHeight: 1.2,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {suggestion.name}
        </span>

        <button
          type="button"
          onClick={() => onStart(suggestion.template_id)}
          style={{
            flex: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--brand-orange)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            minHeight: 44,
            fontFamily: "inherit",
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
          }}
        >
          Start <span style={{ fontSize: 16 }}>→</span>
        </button>
      </div>

      {/* Optional reason — tiny muted line */}
      {suggestion.reason && (
        <p
          style={{
            fontSize: 12,
            color: "var(--brand-muted)",
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {suggestion.reason}
        </p>
      )}
    </section>
  )
}
