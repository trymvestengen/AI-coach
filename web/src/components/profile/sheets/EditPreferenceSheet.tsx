"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import type { UserPreference } from "@/lib/profile"

const CATEGORIES: { value: "exercise" | "time" | "intensity" | "other"; label: string }[] = [
  { value: "exercise", label: "Øvelse" },
  { value: "time", label: "Tid" },
  { value: "intensity", label: "Intensitet" },
  { value: "other", label: "Annet" },
]

interface Props {
  open: boolean
  onClose: () => void
  preference: UserPreference | null
  onSave: (data: Partial<UserPreference>) => void
  onDelete: (id: string) => void
}

export default function EditPreferenceSheet({
  open,
  onClose,
  preference,
  onSave,
  onDelete,
}: Props) {
  const [category, setCategory] = useState<string | null>(preference?.category ?? null)
  const [text, setText] = useState(preference?.preference ?? "")
  const isEditing = preference !== null
  const canSave = category !== null && text.trim().length > 0

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
            {isEditing ? "Rediger preferanse" : "Ny preferanse"}
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
              Kategori
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map((c) => {
                const selected = category === c.value
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
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
                    {c.label}
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
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="f.eks. liker ikke beinpress"
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
                  onDelete(preference.id)
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
                  if (category) {
                    onSave({ category: category as UserPreference["category"], preference: text })
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
