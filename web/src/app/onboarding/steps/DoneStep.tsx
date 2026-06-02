"use client"

interface Props {
  firstName: string
  summary: Record<string, string>
  onFinish: () => void
  busy: boolean
}

export default function DoneStep({ firstName, summary, onFinish, busy }: Props) {
  return (
    <div className="flex flex-col h-full" style={{ background: "var(--brand-canvas)" }}>
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="flex flex-col gap-5">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--brand-ink)",
              }}
            >
              Alt klart, {firstName}!
            </h1>
            <p style={{ fontSize: 14, color: "var(--brand-muted)", marginTop: 6 }}>
              Coachen din er klar.
            </p>
          </div>

          <div
            style={{
              background: "var(--brand-surface)",
              border: "1px solid var(--brand-border)",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontSize: 14,
            }}
          >
            {Object.entries(summary).map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    color: "var(--brand-muted)",
                    textTransform: "capitalize",
                  }}
                >
                  {k}
                </span>
                <span
                  style={{
                    color: "var(--brand-ink)",
                    fontWeight: 500,
                    textAlign: "right",
                  }}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onFinish}
            disabled={busy}
            style={{
              background: "var(--brand-orange)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "14px 16px",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.4 : 1,
            }}
          >
            {busy ? "Lagrer..." : "Kom i gang 🚀"}
          </button>
        </div>
      </div>
    </div>
  )
}
