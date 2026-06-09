"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { patchProgram, deleteProgram } from "@/lib/api"

interface Props {
  open: boolean
  onClose: () => void
  programId: string
  programName: string
  isActive: boolean
  onOpenMoveSheet: () => void
  onOpenManageDays: () => void
  onOpenRename?: () => void
  onOpenAddExercise?: () => void
}

export default function ProgramMenuSheet({
  open,
  onClose,
  programId,
  programName,
  isActive,
  onOpenMoveSheet,
  onOpenManageDays,
  onOpenRename,
  onOpenAddExercise,
}: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  if (!open) return null

  const handleSetActive = async () => {
    setBusy(true)
    try {
      await patchProgram(programId, { is_active: true })
      router.refresh()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Slett «${programName}»? Dette kan ikke angres.`)) return
    setBusy(true)
    try {
      await deleteProgram(programId)
      router.push("/program")
    } finally {
      setBusy(false)
    }
  }

  const handleMove = () => {
    onClose()
    onOpenMoveSheet()
  }

  const handleManageDays = () => {
    onClose()
    onOpenManageDays()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
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
        {!isActive && <MenuRow label="Sett som aktivt" onClick={handleSetActive} disabled={busy} />}
        {onOpenRename && (
          <MenuRow
            label="Endre programnavn"
            onClick={() => {
              onClose()
              onOpenRename()
            }}
            disabled={busy}
          />
        )}
        {onOpenAddExercise && (
          <MenuRow
            label="Legg til øvelse"
            onClick={() => {
              onClose()
              onOpenAddExercise()
            }}
            disabled={busy}
          />
        )}
        <MenuRow label="Rediger dager" onClick={handleManageDays} disabled={busy} />
        <MenuRow label="Flytt til mappe…" onClick={handleMove} disabled={busy} />
        <MenuRow label="Slett program" onClick={handleDelete} disabled={busy} danger />
      </div>
    </div>
  )
}

function MenuRow({
  label,
  onClick,
  disabled,
  danger,
}: {
  label: string
  onClick: () => void
  disabled: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        borderRadius: 12,
        padding: "14px",
        marginBottom: 8,
        textAlign: "center",
        cursor: disabled ? "default" : "pointer",
        fontSize: 14,
        fontWeight: 600,
        color: danger ? "var(--danger)" : "var(--brand-ink)",
      }}
    >
      {label}
    </button>
  )
}
