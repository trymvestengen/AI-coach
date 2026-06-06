"use client"
import type { ProgramFolder } from "@/lib/api"

interface Props {
  folder: ProgramFolder
  onOpen: (id: string) => void
}

export default function FolderCard({ folder, onOpen }: Props) {
  const countLabel = folder.program_count === 1 ? "1 program" : `${folder.program_count} programmer`
  return (
    <button
      type="button"
      onClick={() => onOpen(folder.id)}
      style={{
        background: "linear-gradient(180deg, var(--brand-subtle) 0%, var(--brand-surface) 100%)",
        border: "1px solid var(--brand-border)",
        borderRadius: 14,
        padding: "14px 12px",
        minHeight: 100,
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "rgba(249, 115, 22, 0.15)",
          color: "var(--brand-orange)",
          display: "grid",
          placeItems: "center",
          fontSize: 16,
          marginBottom: 10,
        }}
      >
        📁
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-ink)", lineHeight: 1.25 }}>
        {folder.name}
      </div>
      <div style={{ fontSize: 10, color: "var(--brand-muted)", marginTop: 4 }}>{countLabel}</div>
    </button>
  )
}
