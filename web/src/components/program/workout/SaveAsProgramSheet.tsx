"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createProgramFromWorkout, createFolder, type ProgramFolder } from "@/lib/api"

interface Props {
  open: boolean
  workoutId: string
  folders: ProgramFolder[]
  hasLoggedSets: boolean
  onClose: () => void
}

export default function SaveAsProgramSheet({
  open,
  workoutId,
  folders,
  hasLoggedSets,
  onClose,
}: Props) {
  const router = useRouter()
  const today = new Date().toLocaleDateString("no-NO", { day: "numeric", month: "long" })
  const [name, setName] = useState(`Tom økt ${today}`)
  const [selected, setSelected] = useState<string | "new" | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSaveAsProgram = async () => {
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
      await createProgramFromWorkout({
        workout_id: workoutId,
        name: name.trim() || `Tom økt ${today}`,
        folder_id: folderId,
      })
      router.push("/program")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke lagre program")
      setBusy(false)
    }
  }

  const handleSkip = () => router.push("/program")

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.6)",
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
          padding: "20px 20px 28px",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            color: "var(--brand-muted)",
            marginBottom: 6,
          }}
        >
          Økt fullført 🎉
        </div>
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: "var(--brand-ink)",
            letterSpacing: "-0.02em",
            marginBottom: 4,
          }}
        >
          Lagre som program?
        </div>
        <div style={{ fontSize: 12, color: "var(--brand-muted)", marginBottom: 16 }}>
          Lar deg gjenta denne økten senere.
        </div>

        {!hasLoggedSets && (
          <div
            style={{
              background: "var(--brand-subtle)",
              border: "1px solid var(--brand-orange-soft)",
              borderRadius: 10,
              padding: 10,
              fontSize: 12,
              color: "var(--brand-muted)",
              marginBottom: 12,
            }}
          >
            Ingen sett logget — kan ikke lagres som program.
          </div>
        )}

        {hasLoggedSets && (
          <>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--brand-muted)",
                marginBottom: 4,
              }}
            >
              Navn
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "var(--brand-surface)",
                border: "1.5px solid var(--brand-border)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                color: "var(--brand-ink)",
                marginBottom: 14,
              }}
            />

            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--brand-muted)",
                marginBottom: 4,
              }}
            >
              Mappe
            </div>
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

            {selected === "new" && (
              <input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Mappenavn"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "var(--brand-surface)",
                  border: "1.5px solid var(--brand-border)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "var(--brand-ink)",
                  margin: "6px 0 10px",
                }}
              />
            )}
          </>
        )}

        {error && (
          <div
            style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10, textAlign: "center" }}
          >
            {error}
          </div>
        )}

        {hasLoggedSets && (
          <button
            type="button"
            onClick={handleSaveAsProgram}
            disabled={busy}
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
              opacity: busy ? 0.7 : 1,
              marginBottom: 8,
              marginTop: 10,
            }}
          >
            {busy ? "Lagrer…" : "Lagre som program"}
          </button>
        )}

        <button
          type="button"
          onClick={handleSkip}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px solid var(--brand-border)",
            color: "var(--brand-muted)",
            borderRadius: 12,
            padding: 14,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {hasLoggedSets ? "Bare lagre økten" : "Tilbake til Trening"}
        </button>
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
