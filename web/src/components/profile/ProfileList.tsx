"use client"
import { ReactNode } from "react"

interface Item {
  id: string
  primary: string
  secondary?: ReactNode
}

interface Props {
  items: Item[]
  onAdd: () => void
  onItemClick: (id: string) => void
  addLabel: string
}

export default function ProfileList({ items, onAdd, onItemClick, addLabel }: Props) {
  return (
    <div>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onItemClick(it.id)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "13px 14px",
            textAlign: "left",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--brand-border)",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "var(--brand-ink)", fontSize: 14, fontWeight: 500 }}>
              {it.primary}
            </span>
            {it.secondary && (
              <span style={{ color: "var(--brand-muted)", fontSize: 12, marginTop: 2 }}>
                {it.secondary}
              </span>
            )}
          </div>
          <span style={{ color: "var(--brand-faint)", fontSize: 16 }}>›</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onAdd}
        style={{
          width: "100%",
          padding: "13px 14px",
          textAlign: "left",
          background: "transparent",
          border: "none",
          color: "var(--brand-orange)",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        + {addLabel}
      </button>
    </div>
  )
}
