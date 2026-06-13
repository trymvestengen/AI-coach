"use client"
import { useState } from "react"
import { patchProgram, type Program } from "@/lib/api"

interface Props {
  open: boolean
  onClose: () => void
  programs: Pick<Program, "id" | "name" | "is_active" | "days_count">[]
  onActivated: () => void
}

export default function ProgramPickerSheet({ open, onClose, programs, onActivated }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  if (!open) return null

  const activate = async (id: string) => {
    setBusyId(id)
    setError(null)
    try {
      await patchProgram(id, { is_active: true })
      onActivated()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke aktivere")
    } finally {
      setBusyId(null)
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
            marginBottom: 16,
          }}
        >
          Velg aktivt program
        </div>

        {error && (
          <div
            style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10, textAlign: "center" }}
          >
            {error}
          </div>
        )}

        {programs.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--brand-muted)", padding: "20px 0" }}>
            Ingen programmer å velge mellom
          </div>
        ) : (
          programs.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => activate(p.id)}
              disabled={busyId !== null}
              style={{
                width: "100%",
                background: p.is_active ? "var(--brand-subtle)" : "var(--brand-surface)",
                border: `1px solid ${p.is_active ? "var(--brand-orange)" : "var(--brand-border)"}`,
                borderRadius: 12,
                padding: "12px 14px",
                marginBottom: 8,
                textAlign: "left",
                cursor: busyId === null ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-ink)" }}>
                  {p.name}
                </div>
                {p.days_count != null && (
                  <div style={{ fontSize: 11, color: "var(--brand-muted)" }}>
                    {p.days_count} dager
                  </div>
                )}
              </div>
              {busyId === p.id ? (
                <span style={{ fontSize: 11, color: "var(--brand-muted)" }}>Aktiverer…</span>
              ) : p.is_active ? (
                <span style={{ fontSize: 11, color: "var(--brand-orange)", fontWeight: 700 }}>
                  ✓
                </span>
              ) : null}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
