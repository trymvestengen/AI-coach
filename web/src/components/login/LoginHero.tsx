"use client"

interface Props {
  compact?: boolean
}

export default function LoginHero({ compact }: Props) {
  return (
    <div style={{ textAlign: "center", padding: compact ? "20px 0 10px" : "30px 0 20px" }}>
      <div
        style={{
          width: compact ? 44 : 56,
          height: compact ? 44 : 56,
          borderRadius: 14,
          background:
            "linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-orange-deep) 100%)",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontSize: compact ? 22 : 26,
          margin: "0 auto 12px",
        }}
        aria-hidden
      >
        💪
      </div>
      <div
        style={{
          fontSize: compact ? 22 : 26,
          fontWeight: 800,
          color: "var(--brand-ink)",
          letterSpacing: "-0.03em",
          marginBottom: 4,
        }}
      >
        AI Coach
      </div>
      <div
        style={{
          fontSize: 10,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: "var(--brand-orange)",
          fontWeight: 700,
        }}
      >
        Din personlige trener
      </div>
      {!compact && (
        <div
          style={{
            fontSize: 13,
            color: "var(--brand-muted)",
            marginTop: 12,
            lineHeight: 1.4,
            maxWidth: 240,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Logg treninger, følg progresjon og få personlig coaching
        </div>
      )}
    </div>
  )
}
