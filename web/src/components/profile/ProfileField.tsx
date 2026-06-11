"use client"
import { ReactNode } from "react"

interface Props {
  label: string
  value: ReactNode
  onClick?: () => void
  isLast?: boolean
}

export default function ProfileField({ label, value, onClick, isLast = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "13px 14px",
        textAlign: "left",
        background: "transparent",
        border: "none",
        borderBottom: isLast ? "none" : "1px solid var(--brand-border)",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <span style={{ color: "var(--brand-muted)", fontSize: 14 }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
        <span style={{ color: "var(--brand-ink)" }}>
          {value ?? <span style={{ color: "var(--brand-faint)" }}>—</span>}
        </span>
        <span style={{ color: "var(--brand-faint)", fontSize: 16 }}>›</span>
      </span>
    </button>
  )
}
