"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import type { UserConstraint } from "@/lib/profile"

const TYPES: { value: "schedule" | "duration" | "frequency"; label: string }[] = [
  { value: "schedule", label: "Tidsplan" },
  { value: "duration", label: "Varighet" },
  { value: "frequency", label: "Frekvens" },
]

interface Props {
  open: boolean
  onClose: () => void
  constraint: UserConstraint | null
  onSave: (data: Partial<UserConstraint>) => void
  onDelete: (id: string) => void
}

export default function EditConstraintSheet({
  open,
  onClose,
  constraint,
  onSave,
  onDelete,
}: Props) {
  const [type, setType] = useState<string | null>(constraint?.type ?? null)
  const [description, setDescription] = useState(constraint?.description ?? "")
  const isEditing = constraint !== null
  const canSave = type !== null && description.trim().length > 0

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
            {isEditing ? "Rediger begrensning" : "Ny begrensning"}
          </Dialog.Title>

          <div style={{ marginBottom: 12 }}>
            <span
              style={{
                display: "block",
                color: "var(--brand-muted)",
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              Type
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TYPES.map((t) => {
                const selected = type === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 999,
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
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          <label style={{ display: "block", marginBottom: 16 }}>
            <span
              style={{
                display: "block",
                color: "var(--brand-muted)",
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              Beskrivelse
            </span>
            <textarea
              aria-label="Beskrivelse"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="f.eks. maks 45 min per økt"
              style={{
                width: "100%",
                background: "var(--brand-canvas)",
                color: "var(--brand-ink)",
                border: "1px solid var(--brand-border)",
                borderRadius: 10,
                padding: 12,
                fontSize: 15,
                minHeight: 80,
                outline: "none",
                resize: "none",
                fontFamily: "inherit",
              }}
            />
          </label>

          <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  onDelete(constraint.id)
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
                Slett
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
                  if (type) {
                    onSave({ type: type as UserConstraint["type"], description })
                  }
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
