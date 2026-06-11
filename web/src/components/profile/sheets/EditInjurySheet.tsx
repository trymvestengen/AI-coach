"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import type { UserInjury } from "@/lib/profile"

const SEVERITY: { value: "lett" | "moderat" | "alvorlig"; label: string }[] = [
  { value: "lett", label: "Lett" },
  { value: "moderat", label: "Moderat" },
  { value: "alvorlig", label: "Alvorlig" },
]

interface Props {
  open: boolean
  onClose: () => void
  injury: UserInjury | null
  onSave: (data: Partial<UserInjury>) => void
  onDelete: (id: string) => void
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
  fontFamily: "inherit",
} as const

const labelText = {
  display: "block",
  color: "var(--brand-muted)",
  fontSize: 13,
  marginBottom: 6,
} as const

export default function EditInjurySheet({ open, onClose, injury, onSave, onDelete }: Props) {
  const [bodyPart, setBodyPart] = useState(injury?.body_part ?? "")
  const [description, setDescription] = useState(injury?.description ?? "")
  const [severity, setSeverity] = useState<string | null>(injury?.severity ?? null)
  const [startedAt, setStartedAt] = useState(injury?.started_at ?? "")

  const isEditing = injury !== null
  const canSave = bodyPart.trim().length > 0

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
            {isEditing ? "Rediger skade" : "Ny skade"}
          </Dialog.Title>

          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={labelText}>Kroppsdel</span>
            <input
              aria-label="Kroppsdel"
              style={inputStyle}
              value={bodyPart}
              onChange={(e) => setBodyPart(e.target.value)}
              placeholder="f.eks. venstre kne"
            />
          </label>

          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={labelText}>Beskrivelse</span>
            <textarea
              aria-label="Beskrivelse"
              style={{ ...inputStyle, minHeight: 80, resize: "none" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="f.eks. vondt ved dyp bøyning"
            />
          </label>

          <div style={{ marginBottom: 12 }}>
            <span style={labelText}>Alvorlighet</span>
            <div style={{ display: "flex", gap: 8 }}>
              {SEVERITY.map((s) => {
                const selected = severity === s.value
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSeverity(s.value)}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 10,
                      background: selected ? "var(--brand-subtle)" : "var(--brand-canvas)",
                      border: `1px solid ${
                        selected ? "var(--brand-orange)" : "var(--brand-border)"
                      }`,
                      color: selected ? "var(--brand-orange-deep)" : "var(--brand-ink)",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={labelText}>Startdato (valgfri)</span>
            <input
              type="date"
              aria-label="Startdato"
              style={{ ...inputStyle, colorScheme: "light" }}
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
            />
          </label>

          <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  onDelete(injury.id)
                  onClose()
                }}
                style={{
                  padding: "10px 16px",
                  background: "transparent",
                  color: "var(--danger)",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Markér som leget
              </button>
            )}
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "10px 16px",
                  background: "transparent",
                  color: "var(--brand-muted)",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Avbryt
              </button>
              <button
                type="button"
                disabled={!canSave}
                onClick={() => {
                  onSave({
                    body_part: bodyPart,
                    description: description || null,
                    severity: severity || null,
                    started_at: startedAt || null,
                  })
                  onClose()
                }}
                style={{
                  padding: "10px 18px",
                  background: "var(--brand-orange)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: canSave ? "pointer" : "default",
                  opacity: canSave ? 1 : 0.4,
                }}
              >
                Lagre
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
