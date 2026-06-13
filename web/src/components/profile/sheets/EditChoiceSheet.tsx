"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"

interface Choice {
  value: string
  label: string
}

interface Props {
  open: boolean
  onClose: () => void
  title: string
  choices: Choice[]
  initialValue: string
  onSave: (value: string) => void
}

export default function EditChoiceSheet({
  open,
  onClose,
  title,
  choices,
  initialValue,
  onSave,
}: Props) {
  const [value, setValue] = useState(initialValue)

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
          className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto"
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
            {title}
          </Dialog.Title>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {choices.map((c) => {
              const selected = value === c.value
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setValue(c.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 12,
                    textAlign: "left",
                    background: selected ? "var(--brand-subtle)" : "var(--brand-canvas)",
                    border: `1px solid ${selected ? "var(--brand-orange)" : "var(--brand-border)"}`,
                    color: selected ? "var(--brand-orange-deep)" : "var(--brand-ink)",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
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
              onClick={() => {
                onSave(value)
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
                cursor: "pointer",
              }}
            >
              Lagre
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
