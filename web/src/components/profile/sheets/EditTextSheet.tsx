"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"

interface Props {
  open: boolean
  onClose: () => void
  title: string
  initialValue: string
  unit?: string
  type?: "text" | "number" | "textarea"
  onSave: (value: string) => void
}

export default function EditTextSheet({
  open,
  onClose,
  title,
  initialValue,
  unit,
  type = "text",
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
          {type === "textarea" ? (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              style={{
                width: "100%",
                background: "var(--brand-canvas)",
                color: "var(--brand-ink)",
                border: "1px solid var(--brand-border)",
                borderRadius: 10,
                padding: 12,
                minHeight: 100,
                marginBottom: 14,
                fontSize: 15,
                outline: "none",
                resize: "none",
                fontFamily: "inherit",
              }}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <input
                type={type}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                style={{
                  flex: 1,
                  background: "var(--brand-canvas)",
                  color: "var(--brand-ink)",
                  border: "1px solid var(--brand-border)",
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  outline: "none",
                }}
              />
              {unit && <span style={{ color: "var(--brand-muted)", fontSize: 14 }}>{unit}</span>}
            </div>
          )}
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
