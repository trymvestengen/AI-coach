"use client"

interface Props {
  compact?: boolean
}

export default function LoginHero({ compact }: Props) {
  return (
    <section className="hero" style={{ marginTop: 14 }}>
      <div className="eyebrow">Din personlige trener</div>
      <h1 className="hero-title" style={{ fontSize: compact ? 36 : 44 }}>
        AI Coach
      </h1>
      {!compact && (
        <p className="hero-sub" style={{ marginBottom: 0 }}>
          Logg treninger, følg progresjon og få coaching som tilpasser seg deg.
        </p>
      )}
    </section>
  )
}
