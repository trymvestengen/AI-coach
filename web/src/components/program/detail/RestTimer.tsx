"use client"
import { useEffect, useState } from "react"

interface Props {
  startedAt: number
  durationSec: number
  onDismiss: () => void
}

/**
 * Floating rest-timer pill. Counts down from durationSec to 0.
 * At 0 it pulses + vibrates (if supported) and the user can tap to dismiss.
 * Designed to render inside ExerciseSheet, positioned absolute at bottom.
 */
export default function RestTimer({ startedAt, durationSec, onDismiss }: Props) {
  const [now, setNow] = useState(() => Date.now())
  const [vibrated, setVibrated] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])

  const elapsedMs = now - startedAt
  const remainingMs = Math.max(0, durationSec * 1000 - elapsedMs)
  const remainingSec = Math.ceil(remainingMs / 1000)
  const done = remainingMs === 0

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (done && !vibrated) {
      setVibrated(true)
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([120, 60, 120])
      }
    }
  }, [done, vibrated])
  /* eslint-enable */

  const mm = Math.floor(remainingSec / 60)
  const ss = remainingSec % 60
  const label = `${mm}:${ss.toString().padStart(2, "0")}`

  return (
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Hopp over hviletid"
      style={{
        position: "absolute",
        left: "50%",
        bottom: 14,
        transform: "translateX(-50%)",
        background: done ? "#16a34a" : "var(--brand-ink)",
        color: "white",
        border: "none",
        borderRadius: 999,
        padding: "10px 18px",
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        animation: done ? "rest-pulse 0.9s ease-in-out infinite" : undefined,
        zIndex: 10,
      }}
    >
      <span aria-hidden style={{ fontSize: 14 }}>
        ⏱
      </span>
      <span className="tnum">{done ? "Ferdig!" : label}</span>
      <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 500 }}>tap for å lukke</span>
      <style jsx>{`
        @keyframes rest-pulse {
          0%,
          100% {
            transform: translateX(-50%) scale(1);
          }
          50% {
            transform: translateX(-50%) scale(1.05);
          }
        }
      `}</style>
    </button>
  )
}
