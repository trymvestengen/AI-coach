"use client"
import type { Template } from "@/lib/api"

interface Props {
  template: Pick<Template, "id" | "name" | "exercise_count">
  onOpen: (id: string) => void
  onMenu: (id: string) => void
}

export default function TemplateCard({ template, onOpen, onMenu }: Props) {
  const count = template.exercise_count ?? 0
  const countLabel = `${count} ${count === 1 ? "øvelse" : "øvelser"}`

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(template.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen(template.id)
        }
      }}
      style={{
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        borderRadius: 14,
        padding: "14px 12px",
        minHeight: 124,
        textAlign: "left",
        cursor: "pointer",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--brand-ink)",
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
          }}
        >
          {template.name}
        </span>
        <button
          type="button"
          aria-label="Mal-valg"
          onClick={(e) => {
            e.stopPropagation()
            onMenu(template.id)
          }}
          style={{
            flex: "none",
            background: "none",
            border: "none",
            padding: "0 2px",
            color: "var(--brand-faint)",
            fontWeight: 700,
            letterSpacing: 1,
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          ⋯
        </button>
      </div>
      <div
        className="tnum"
        style={{ fontSize: 11, color: "var(--brand-muted)", marginTop: "auto" }}
      >
        {countLabel}
      </div>
    </div>
  )
}
