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
      className="lib-mal-card-wrap"
    >
      {/* Plate icon */}
      <div className="lib-plate-icon" aria-hidden>
        🏋️
      </div>

      {/* Name + menu */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 4,
        }}
      >
        <span className="lib-mal-name">{template.name}</span>
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
            minHeight: 44,
            display: "flex",
            alignItems: "center",
          }}
        >
          ⋯
        </button>
      </div>

      {/* Meta: exercise count */}
      <div className="lib-mal-meta">{countLabel}</div>
    </div>
  )
}
