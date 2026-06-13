"use client"
import { useState } from "react"
import { createTemplateFolder } from "@/lib/api"

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export default function NewFolderSheet({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!open) return null

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    setError(null)
    try {
      await createTemplateFolder(trimmed)
      setName("")
      onCreated()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke lage mappe")
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
            marginBottom: 16,
          }}
        >
          Lag ny mappe
        </div>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit()
          }}
          placeholder="F.eks. Bulk 2027"
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
          }}
        />

        {error && (
          <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10 }}>{error}</div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={!name.trim() || busy}
          style={{
            width: "100%",
            background: "var(--brand-orange)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: 12,
            fontSize: 13,
            fontWeight: 700,
            cursor: busy || !name.trim() ? "default" : "pointer",
            opacity: busy || !name.trim() ? 0.6 : 1,
          }}
        >
          {busy ? "Lager…" : "Lag mappe"}
        </button>
      </div>
    </div>
  )
}
