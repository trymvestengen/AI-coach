"use client"
import type { Program } from "@/lib/api"

interface Props {
  program: Pick<Program, "id" | "name" | "is_active" | "days_count">
  onOpen: (id: string) => void
}

export default function ProgramCard({ program, onOpen }: Props) {
  const daysLabel = program.days_count != null ? `${program.days_count} dager` : "Program"
  return (
    <button
      type="button"
      onClick={() => onOpen(program.id)}
      style={{
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        borderRadius: 14,
        padding: "14px 12px",
        minHeight: 100,
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
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "var(--brand-subtle)",
          color: "var(--brand-orange)",
          display: "grid",
          placeItems: "center",
          fontSize: 16,
          marginBottom: 10,
        }}
      >
        💪
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-ink)", lineHeight: 1.25 }}>
        {program.name}
      </div>
      <div style={{ fontSize: 10, color: "var(--brand-muted)", marginTop: 4 }}>{daysLabel}</div>
    </button>
  )
}
