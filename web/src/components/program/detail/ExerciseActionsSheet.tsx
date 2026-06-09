"use client"

interface Props {
  open: boolean
  onClose: () => void
  onEdit: () => void
  onRemove: () => void
}

export default function ExerciseActionsSheet({ open, onClose, onEdit, onRemove }: Props) {
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 12px 24px",
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            background: "var(--brand-border)",
            borderRadius: 99,
            margin: "0 auto 14px",
          }}
        />
        <Row
          label="Rediger sett"
          onClick={() => {
            onClose()
            onEdit()
          }}
        />
        <Row
          label="Fjern øvelse"
          onClick={() => {
            onClose()
            onRemove()
          }}
          destructive
        />
      </div>
    </div>
  )
}

function Row({
  label,
  onClick,
  destructive,
}: {
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 8,
        textAlign: "left",
        fontSize: 14,
        fontWeight: 600,
        color: destructive ? "#dc2626" : "var(--brand-ink)",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  )
}
