"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"

const PRESETS: Record<string, string[]> = {
  "Hjemmegym basic": ["barbell", "plates", "bench", "dumbbells_pair"],
  Treningssenter: [
    "barbell",
    "dumbbells_full_range",
    "cable_machine",
    "leg_press",
    "smith_machine",
    "pull_up_bar",
  ],
  "Bare bodyweight": ["pull_up_bar"],
}

interface Props {
  open: boolean
  onClose: () => void
  mode: "add" | "edit"
  existing: string[]
  item: string | null
  onAdd: (equipment: string) => void
  onDelete: (equipment: string) => void
}

const inputStyle = {
  width: "100%",
  background: "var(--brand-canvas)",
  color: "var(--brand-ink)",
  border: "1px solid var(--brand-border)",
  borderRadius: 10,
  padding: 12,
  fontSize: 15,
  outline: "none",
} as const

const labelStyle = {
  display: "block",
  color: "var(--brand-muted)",
  fontSize: 13,
  marginBottom: 6,
} as const

const presetBtnStyle = {
  width: "100%",
  padding: "10px 14px",
  background: "var(--brand-canvas)",
  border: "1px solid var(--brand-border)",
  borderRadius: 10,
  textAlign: "left" as const,
  color: "var(--brand-ink)",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
}

const cancelBtn = {
  padding: "10px 16px",
  background: "transparent",
  color: "var(--brand-muted)",
  border: "none",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
}

const saveBtn = {
  padding: "10px 18px",
  background: "var(--brand-orange)",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
}

const deleteBtn = {
  padding: "10px 16px",
  background: "transparent",
  color: "var(--danger)",
  border: "none",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
}

export default function EquipmentSheet({
  open,
  onClose,
  mode,
  existing,
  item,
  onAdd,
  onDelete,
}: Props) {
  const [value, setValue] = useState("")

  const applyPreset = (preset: string) => {
    for (const eq of PRESETS[preset]) {
      if (!existing.includes(eq)) onAdd(eq)
    }
    onClose()
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.45)" }} />
        <Dialog.Content
          className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto"
          style={{
            background: "var(--brand-surface)",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            color: "var(--brand-ink)",
          }}
        >
          <Dialog.Title
            style={{
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              marginBottom: 14,
              color: "var(--brand-ink)",
            }}
          >
            {mode === "edit" ? `Utstyr: ${item}` : "Legg til utstyr"}
          </Dialog.Title>

          {mode === "add" && (
            <>
              <label style={{ display: "block", marginBottom: 12 }}>
                <span style={labelStyle}>Utstyr</span>
                <input
                  aria-label="Utstyr"
                  style={inputStyle}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="f.eks. barbell"
                />
              </label>

              <div style={{ marginBottom: 14 }}>
                <span style={labelStyle}>Eller velg en preset:</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.keys(PRESETS).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => applyPreset(p)}
                      style={presetBtnStyle}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
            {mode === "edit" && item && (
              <button
                type="button"
                onClick={() => {
                  onDelete(item)
                  onClose()
                }}
                style={deleteBtn}
              >
                Slett
              </button>
            )}
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <button type="button" onClick={onClose} style={cancelBtn}>
                Avbryt
              </button>
              {mode === "add" && (
                <button
                  type="button"
                  disabled={value.trim().length === 0}
                  onClick={() => {
                    onAdd(value.trim())
                    onClose()
                  }}
                  style={{
                    ...saveBtn,
                    opacity: value.trim().length === 0 ? 0.4 : 1,
                    cursor: value.trim().length === 0 ? "default" : "pointer",
                  }}
                >
                  Lagre
                </button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
