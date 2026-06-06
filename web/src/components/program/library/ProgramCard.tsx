"use client"
import type { Program } from "@/lib/api"

interface Props {
  program: Pick<Program, "id" | "name" | "is_active" | "days_count">
  previewExercises?: string[] // first ~3 exercise names from day 1
  onOpen: (id: string) => void
}

export default function ProgramCard({ program, previewExercises, onOpen }: Props) {
  const daysLabel = program.days_count != null ? `${program.days_count} dager` : "Program"
  const previewText =
    previewExercises && previewExercises.length > 0 ? previewExercises.join(", ") : ""
  return (
    <button
      type="button"
      onClick={() => onOpen(program.id)}
      style={{
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        borderRadius: 14,
        padding: "14px 12px",
        minHeight: 120,
        textAlign: "left",
        cursor: "pointer",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {program.is_active && (
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "var(--brand-orange)",
            color: "#fff",
            fontSize: 8,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 999,
            letterSpacing: 0.4,
          }}
        >
          AKTIV
        </span>
      )}
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--brand-ink)",
          lineHeight: 1.25,
          letterSpacing: "-0.01em",
        }}
      >
        {program.name}
      </div>
      <div style={{ fontSize: 10, color: "var(--brand-muted)", marginTop: 4, marginBottom: 8 }}>
        {daysLabel}
      </div>
      {previewText && (
        <div
          style={{
            fontSize: 10,
            color: "var(--brand-muted)",
            lineHeight: 1.4,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {previewText}
        </div>
      )}
    </button>
  )
}
