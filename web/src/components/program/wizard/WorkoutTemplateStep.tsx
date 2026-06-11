"use client"
import type { WorkoutTemplate } from "@/lib/api"

interface Props {
  onSelect: (template: WorkoutTemplate) => void
}

const TEMPLATES: { id: WorkoutTemplate; label: string }[] = [
  { id: "custom", label: "Custom" },
  { id: "push", label: "Push" },
  { id: "pull", label: "Pull" },
  { id: "legs", label: "Legs" },
  { id: "full-body", label: "Full body" },
  { id: "upper-body", label: "Upper body" },
]

export default function WorkoutTemplateStep({ onSelect }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
        Velg første økt
      </h1>
      <p style={{ fontSize: 13, color: "var(--brand-muted)", marginBottom: 18 }}>
        Vi hjelper deg fylle på med øvelser etterpå.
      </p>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            style={{
              background: "none",
              border: "none",
              padding: "16px 0",
              textAlign: "left",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--brand-ink)",
              borderBottom: "1px solid var(--brand-border)",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
