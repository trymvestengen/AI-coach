"use client"
import { useState } from "react"
import { patchProgram, createFolder, type ProgramFolder } from "@/lib/api"

interface Props {
  open: boolean
  programId: string
  folders: ProgramFolder[]
  defaultFolderId: string | null
  onClose: () => void
  onSaved: () => void
}

export default function SaveFolderSheet({
  open,
  programId,
  folders,
  defaultFolderId,
  onClose,
  onSaved,
}: Props) {
  // First-time mode: no folders exist yet.
  const isFirstTime = folders.length === 0

  // Folder selection state. "new" means create new, null means "no folder".
  const [selected, setSelected] = useState<string | "new" | null>(
    isFirstTime ? "new" : defaultFolderId
  )
  const [newFolderName, setNewFolderName] = useState(isFirstTime ? "Første split" : "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSave = async () => {
    setBusy(true)
    setError(null)
    try {
      let folderId: string | null = null
      if (selected === "new") {
        const trimmed = newFolderName.trim()
        if (!trimmed) {
          setError("Mappenavn kan ikke være tomt")
          setBusy(false)
          return
        }
        const created = await createFolder(trimmed)
        folderId = created.id
      } else {
        folderId = selected
      }
      await patchProgram(programId, { folder_id: folderId })
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke lagre")
    } finally {
      setBusy(false)
    }
  }

  const handleSkip = async () => {
    setBusy(true)
    try {
      await patchProgram(programId, { folder_id: null })
      onSaved()
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
            marginBottom: 6,
          }}
        >
          {isFirstTime ? "Lag din første mappe" : "Lagre i mappe"}
        </div>
        {isFirstTime && (
          <div
            style={{
              fontSize: 12,
              color: "var(--brand-muted)",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            Hva vil du kalle den?
          </div>
        )}

        {error && (
          <div
            style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10, textAlign: "center" }}
          >
            {error}
          </div>
        )}

        {!isFirstTime && (
          <>
            <SelectRow
              label="Ingen mappe"
              selected={selected === null}
              onClick={() => setSelected(null)}
            />
            {folders.map((f) => (
              <SelectRow
                key={f.id}
                label={`📁 ${f.name}`}
                selected={selected === f.id}
                onClick={() => setSelected(f.id)}
              />
            ))}
            <SelectRow
              label="+ Lag ny mappe…"
              selected={selected === "new"}
              onClick={() => setSelected("new")}
            />
          </>
        )}

        {(isFirstTime || selected === "new") && (
          <input
            autoFocus={isFirstTime}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Mappenavn"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "var(--brand-surface)",
              border: "1.5px solid var(--brand-border)",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 13,
              color: "var(--brand-ink)",
              marginBottom: 12,
              marginTop: isFirstTime ? 0 : 6,
            }}
          />
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={busy || (selected === "new" && !newFolderName.trim())}
          style={{
            width: "100%",
            background: "var(--brand-orange)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            fontWeight: 700,
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.6 : 1,
            marginBottom: 8,
          }}
        >
          {busy ? "Lagrer…" : isFirstTime ? "Lagre i mappen" : "Lagre"}
        </button>

        {isFirstTime && (
          <button
            type="button"
            onClick={handleSkip}
            disabled={busy}
            style={{
              width: "100%",
              background: "transparent",
              border: "1px solid var(--brand-border)",
              color: "var(--brand-muted)",
              borderRadius: 12,
              padding: 14,
              fontSize: 13,
              fontWeight: 600,
              cursor: busy ? "default" : "pointer",
            }}
          >
            Hopp over (ingen mappe)
          </button>
        )}
      </div>
    </div>
  )
}

function SelectRow({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        background: selected ? "var(--brand-subtle)" : "var(--brand-surface)",
        border: `1px solid ${selected ? "var(--brand-orange)" : "var(--brand-border)"}`,
        borderRadius: 10,
        padding: "10px 14px",
        marginBottom: 6,
        textAlign: "left",
        cursor: "pointer",
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
