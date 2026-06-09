"use client"
import { useState } from "react"
import { patchProgram, type ProgramFolder } from "@/lib/api"

interface Props {
  open: boolean
  onClose: () => void
  programId: string
  currentFolderId: string | null
  folders: ProgramFolder[]
  onMoved: () => void
}

export default function MoveToFolderSheet({
  open,
  onClose,
  programId,
  currentFolderId,
  folders,
  onMoved,
}: Props) {
  const [busy, setBusy] = useState(false)
  if (!open) return null

  const moveTo = async (folderId: string | null) => {
    setBusy(true)
    try {
      await patchProgram(programId, { folder_id: folderId })
      onMoved()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
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
          padding: "14px 20px 28px",
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            background: "var(--brand-border)",
            borderRadius: 999,
            margin: "0 auto 14px",
          }}
        />
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--brand-ink)",
            textAlign: "center",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          Flytt til mappe
        </div>

        {folders.map((f) => (
          <FolderRow
            key={f.id}
            label={`📁 ${f.name}`}
            selected={currentFolderId === f.id}
            disabled={busy}
            onClick={() => moveTo(f.id)}
          />
        ))}
        <FolderRow
          label="↑ Rot (ingen mappe)"
          selected={currentFolderId === null}
          disabled={busy}
          onClick={() => moveTo(null)}
        />
      </div>
    </div>
  )
}

function FolderRow({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string
  selected: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        background: selected ? "var(--brand-subtle)" : "var(--brand-surface)",
        border: `1px solid ${selected ? "var(--brand-orange)" : "var(--brand-border)"}`,
        borderRadius: 10,
        padding: "10px 14px",
        marginBottom: 6,
        textAlign: "left",
        cursor: disabled ? "default" : "pointer",
        fontSize: 13,
        color: "var(--brand-ink)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>{label}</span>
      {selected && <span style={{ color: "var(--brand-orange)", fontWeight: 700 }}>✓</span>}
    </button>
  )
}
