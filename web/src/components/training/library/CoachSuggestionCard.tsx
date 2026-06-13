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
    <div className="forge">
      <section className="hero" style={{ marginBottom: 4 }}>
        <div className="eyebrow">Coachen foreslår</div>
        <h2 className="hero-title" style={{ fontSize: 38 }}>
          {suggestion.name}
        </h2>
        {suggestion.reason && <p className="hero-sub">{suggestion.reason}</p>}
        <button
          type="button"
          onClick={() => onStart(suggestion.template_id)}
          className="btn btn-primary btn-block"
        >
          Start økt <span className="arrow">→</span>
        </button>
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button
            type="button"
            onClick={onSwap}
            style={{
              background: "none",
              border: "none",
              color: "var(--hero-sub)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Bytt →
          </button>
        </div>
      </section>
    </div>
  )
}
