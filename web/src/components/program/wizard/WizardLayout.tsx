"use client"
import type { ReactNode } from "react"

interface Props {
  progressPercent: number
  onBack: () => void
  children: ReactNode
}

export default function WizardLayout({ progressPercent, onBack, children }: Props) {
  return (
    <div
      style={{
        background: "var(--brand-canvas)",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "14px 18px 24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <button
          type="button"
          aria-label="Tilbake"
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "var(--brand-orange)",
            fontSize: 22,
            cursor: "pointer",
            padding: 0,
            lineHeight: 1,
          }}
        >
          ←
        </button>
        <div
          style={{
            flex: 1,
            height: 3,
            background: "var(--brand-border)",
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            data-testid="wizard-progress"
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              background: "var(--brand-orange)",
              transition: "width 200ms ease",
            }}
          />
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  )
}
