"use client"
import { useState } from "react"
import { updateTemplate, deleteTemplate } from "@/lib/api"

const WEEKDAYS = [
  { label: "Ma", iso: 1 },
  { label: "Ti", iso: 2 },
  { label: "On", iso: 3 },
  { label: "To", iso: 4 },
  { label: "Fr", iso: 5 },
  { label: "Lø", iso: 6 },
  { label: "Sø", iso: 7 },
] as const

export interface TemplateMenuTarget {
  id: string
  name: string
  folder_id: string | null
  scheduled_days?: number[]
}

interface Props {
  template: TemplateMenuTarget | null
  onClose: () => void
  onChanged: () => void
  onDeleted: () => void
}

export default function TemplateMenuSheet({ template, onClose, onChanged, onDeleted }: Props) {
  const [name, setName] = useState(template?.name ?? "")
  const [days, setDays] = useState<number[]>(template?.scheduled_days ?? [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Re-seed the name and days fields whenever a different template is opened.
  const [seededFor, setSeededFor] = useState<string | null>(template?.id ?? null)
  if (template && seededFor !== template.id) {
    setSeededFor(template.id)
    setName(template.name)
    setDays(template.scheduled_days ?? [])
  }

  if (!template) return null

  const run = async (fn: () => Promise<void>, after: () => void) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      after()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Noe gikk galt")
    } finally {
      setBusy(false)
    }
  }

  const rename = () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === template.name) return
    run(
      () => updateTemplate(template.id, { name: trimmed }).then(() => undefined),
      () => {
        onChanged()
        onClose()
      }
    )
  }

  const toggleDay = (day: number) => {
    const next = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day].sort((a, b) => a - b)
    setDays(next)
    run(
      () => updateTemplate(template.id, { scheduled_days: next }).then(() => undefined),
      () => {
        onChanged()
      }
    )
  }

  const remove = () => {
    run(
      () => deleteTemplate(template.id),
      () => {
        onDeleted()
        onClose()
      }
    )
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
          background: "var(--brand-surface)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 20px 28px",
          boxShadow: "0 -6px 32px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            background: "var(--brand-border)",
            borderRadius: 999,
            margin: "0 auto 16px",
          }}
        />

        {/* Gi nytt navn */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--brand-muted)",
            marginBottom: 8,
          }}
        >
          Navn
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") rename()
            }}
            style={{
              flex: 1,
              boxSizing: "border-box",
              background: "var(--brand-surface)",
              border: "1.5px solid var(--brand-border)",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
              color: "var(--brand-ink)",
            }}
          />
          <button
            type="button"
            onClick={rename}
            disabled={busy}
            style={{
              flex: "none",
              background: "var(--brand-subtle)",
              color: "var(--brand-orange)",
              border: "none",
              borderRadius: 10,
              padding: "0 14px",
              fontSize: 12,
              fontWeight: 700,
              cursor: busy ? "default" : "pointer",
            }}
          >
            Lagre navn
          </button>
        </div>

        {/* Planlagte dager */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--brand-muted)",
            marginBottom: 8,
          }}
        >
          Planlagte dager
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {WEEKDAYS.map(({ label, iso }) => (
            <FolderChip
              key={iso}
              label={label}
              active={days.includes(iso)}
              onClick={() => toggleDay(iso)}
              disabled={busy}
            />
          ))}
        </div>

        {error && (
          <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10 }}>{error}</div>
        )}

        <button
          type="button"
          onClick={remove}
          disabled={busy}
          style={{
            width: "100%",
            background: "none",
            color: "var(--danger)",
            border: "1px solid var(--brand-border)",
            borderRadius: 12,
            padding: 12,
            fontSize: 13,
            fontWeight: 700,
            cursor: busy ? "default" : "pointer",
          }}
        >
          Slett mal
        </button>
      </div>
    </div>
  )
}

function FolderChip({
  label,
  active,
  onClick,
  disabled,
}: {
  label: string
  active: boolean
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "7px 12px",
        borderRadius: 999,
        background: active ? "var(--brand-orange)" : "var(--brand-surface)",
        border: `1px solid ${active ? "var(--brand-orange)" : "var(--brand-border)"}`,
        color: active ? "#fff" : "var(--brand-ink)",
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {label}
    </button>
  )
}
