"use client"
import { useState } from "react"
import { renameFolder, deleteFolder, type ProgramFolder } from "@/lib/api"

interface Props {
  folder: ProgramFolder | null
  onClose: () => void
  onChanged: () => void
}

export default function FolderActionsSheet({ folder, onClose, onChanged }: Props) {
  const [mode, setMode] = useState<"menu" | "rename">("menu")
  const [newName, setNewName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!folder) return null

  const startRename = () => {
    setNewName(folder.name)
    setError(null)
    setMode("rename")
  }

  const handleRename = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    setBusy(true)
    setError(null)
    try {
      await renameFolder(folder.id, trimmed)
      onChanged()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke endre navn")
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Slett "${folder.name}"? Programmene flyttes til "Alle" (uten mappe).`)) {
      return
    }
    setBusy(true)
    try {
      await deleteFolder(folder.id)
      onChanged()
      onClose()
    } finally {
      setBusy(false)
    }
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
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--brand-muted)",
            textAlign: "center",
            marginBottom: 16,
            letterSpacing: "-0.01em",
          }}
        >
          📁 {folder.name}
        </div>

        {error && (
          <div
            style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10, textAlign: "center" }}
          >
            {error}
          </div>
        )}

        {mode === "menu" ? (
          <>
            <ActionRow label="Endre navn" onClick={startRename} disabled={busy} />
            <ActionRow label="Slett mappe" onClick={handleDelete} disabled={busy} danger />
          </>
        ) : (
          <>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename()
              }}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "var(--brand-surface)",
                border: "1.5px solid var(--brand-border)",
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 13,
                color: "var(--brand-ink)",
                marginBottom: 10,
              }}
            />
            <button
              type="button"
              onClick={handleRename}
              disabled={!newName.trim() || busy}
              style={{
                width: "100%",
                background: "var(--brand-orange)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: 12,
                fontSize: 13,
                fontWeight: 700,
                cursor: busy || !newName.trim() ? "default" : "pointer",
                opacity: busy || !newName.trim() ? 0.6 : 1,
              }}
            >
              {busy ? "Lagrer…" : "Lagre"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function ActionRow({
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
        padding: 14,
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
