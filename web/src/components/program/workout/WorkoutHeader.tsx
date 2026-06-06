"use client"
import { useEffect, useState } from "react"

interface Props {
  startedAt: string | null
  dayName: string
  onClose: () => void
}

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function WorkoutHeader({ startedAt, dayName, onClose }: Props) {
  const [elapsed, setElapsed] = useState("00:00")

  useEffect(() => {
    if (!startedAt) return
    const start = new Date(startedAt).getTime()
    const tick = () => setElapsed(formatElapsed(Date.now() - start))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  return (
    <div style={{ padding: "14px 20px 10px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Lukk"
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: "var(--brand-surface)",
            border: "1px solid var(--brand-border)",
            color: "var(--brand-muted)",
            fontSize: 18,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
          }}
        >
          ×
        </button>
        <div
          className="tnum"
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--brand-ink)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {elapsed}
        </div>
      </div>
      <div
        style={{
          fontSize: 19,
          fontWeight: 700,
          color: "var(--brand-ink)",
          letterSpacing: "-0.02em",
        }}
      >
        {dayName}
      </div>
    </div>
  )
}
