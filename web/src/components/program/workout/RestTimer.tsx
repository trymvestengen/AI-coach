"use client"

import { useState, useEffect, useRef } from "react"

interface RestTimerProps {
  seconds: number
  onDone: () => void
  onChangeDefault: (s: number) => void
}

export default function RestTimer({ seconds, onDone, onChangeDefault }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds)
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(String(seconds))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current!)
          onDoneRef.current()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [])

  const pct = remaining / seconds
  const r = 28
  const circumference = 2 * Math.PI * r

  function handleEditDone() {
    const n = parseInt(editVal, 10)
    if (!isNaN(n) && n > 0) {
      onChangeDefault(n)
    }
    setEditing(false)
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 390,
          background: "var(--brand-surface)",
          borderTop: "1px solid var(--brand-border)",
          borderRadius: "20px 20px 0 0",
          padding: "20px 24px 48px",
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Ring */}
        <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
          <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
            <circle
              cx="36"
              cy="36"
              r={r}
              stroke="var(--brand-subtle)"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="36"
              cy="36"
              r={r}
              stroke="var(--brand-orange)"
              strokeWidth="4"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct)}
              strokeLinecap="round"
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--brand-ink)",
            }}
            className="tnum"
          >
            {remaining}
          </div>
        </div>

        {/* Label + editable duration */}
        <div style={{ flex: 1 }}>
          <div
            style={{ fontSize: 13, color: "var(--brand-muted)", fontWeight: 500, marginBottom: 6 }}
          >
            Hvile
          </div>
          {editing ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                autoFocus
                type="number"
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                onBlur={handleEditDone}
                onKeyDown={(e) => e.key === "Enter" && handleEditDone()}
                style={{
                  width: 60,
                  background: "var(--brand-subtle)",
                  border: "1px solid var(--brand-border)",
                  borderRadius: 8,
                  padding: "4px 8px",
                  color: "var(--brand-ink)",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              />
              <span style={{ fontSize: 13, color: "var(--brand-muted)" }}>sek</span>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditVal(String(seconds))
                setEditing(true)
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                color: "var(--brand-ink)",
                fontWeight: 600,
                padding: 0,
              }}
            >
              {seconds} sek standard ✎
            </button>
          )}
        </div>

        {/* Skip button */}
        <button
          onClick={onDone}
          style={{
            flexShrink: 0,
            height: 40,
            padding: "0 18px",
            borderRadius: 999,
            background: "var(--brand-subtle)",
            border: "1px solid var(--brand-border)",
            color: "var(--brand-muted)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Hopp over
        </button>
      </div>
    </div>
  )
}
