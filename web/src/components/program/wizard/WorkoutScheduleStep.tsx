"use client"
import { useState } from "react"
import type { DaySchedule } from "@/lib/api"

interface Props {
  workoutName: string
  onNext: (schedule: DaySchedule) => void
}

const DOW_LABELS = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"]
// Order for display: Mon-first (Norwegian convention)
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export default function WorkoutScheduleStep({ workoutName, onNext }: Props) {
  const [tab, setTab] = useState<"weekdays" | "frequency">("weekdays")
  const [days, setDays] = useState<number[]>([])
  const [freq, setFreq] = useState<number | null>(null)

  const canContinue = tab === "weekdays" ? days.length > 0 : freq !== null

  const handleContinue = () => {
    if (tab === "weekdays" && days.length > 0) {
      onNext({ kind: "weekdays", weekdays: [...days].sort((a, b) => a - b) })
    } else if (tab === "frequency" && freq !== null) {
      onNext({ kind: "frequency", frequency_per_week: freq })
    }
  }

  const sortedSelectedLabels = [...days].sort((a, b) => a - b).map((d) => DOW_LABELS[d])

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ height: 20 }} />
      <div
        style={{
          display: "flex",
          gap: 24,
          borderBottom: "1px solid var(--brand-border)",
          marginBottom: 18,
        }}
      >
        <button
          type="button"
          onClick={() => setTab("weekdays")}
          style={{
            background: "none",
            border: "none",
            padding: "0 0 8px",
            fontSize: 14,
            fontWeight: 700,
            color: tab === "weekdays" ? "var(--brand-ink)" : "var(--brand-muted)",
            borderBottom: tab === "weekdays" ? "2px solid var(--brand-orange)" : "none",
            cursor: "pointer",
          }}
        >
          Ukedager
        </button>
        <button
          type="button"
          onClick={() => setTab("frequency")}
          style={{
            background: "none",
            border: "none",
            padding: "0 0 8px",
            fontSize: 14,
            fontWeight: 700,
            color: tab === "frequency" ? "var(--brand-ink)" : "var(--brand-muted)",
            borderBottom: tab === "frequency" ? "2px solid var(--brand-orange)" : "none",
            cursor: "pointer",
          }}
        >
          Hyppighet
        </button>
      </div>

      {tab === "weekdays" && (
        <>
          <p style={{ fontSize: 13, color: "var(--brand-muted)", marginBottom: 16 }}>
            Hvilke <b style={{ color: "var(--brand-ink)" }}>ukedager</b> vil du gjøre{" "}
            <b style={{ color: "var(--brand-ink)" }}>{workoutName.toLowerCase()}</b>-økter?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {DISPLAY_ORDER.map((dow) => {
              const on = days.includes(dow)
              return (
                <button
                  key={dow}
                  type="button"
                  onClick={() =>
                    setDays((prev) =>
                      prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow]
                    )
                  }
                  style={{
                    padding: "10px 14px",
                    borderRadius: 99,
                    border: "none",
                    background: on ? "var(--brand-orange)" : "var(--brand-subtle)",
                    color: on ? "white" : "var(--brand-ink)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {DOW_LABELS[dow]}
                </button>
              )
            })}
          </div>
          {days.length > 0 && (
            <p style={{ fontSize: 12, color: "var(--brand-muted)" }}>
              {workoutName} på{" "}
              <b style={{ color: "var(--brand-ink)" }}>{sortedSelectedLabels.join(", ")}</b>
            </p>
          )}
        </>
      )}

      {tab === "frequency" && (
        <>
          <p style={{ fontSize: 13, color: "var(--brand-muted)", marginBottom: 16 }}>
            <b style={{ color: "var(--brand-ink)" }}>Hvor mange ganger</b> i uka vil du gjøre{" "}
            <b style={{ color: "var(--brand-ink)" }}>{workoutName.toLowerCase()}</b>?
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const on = freq === n
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFreq(n)}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    borderRadius: 10,
                    border: "none",
                    background: on ? "var(--brand-orange)" : "var(--brand-subtle)",
                    color: on ? "white" : "var(--brand-ink)",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {n}×
                </button>
              )
            })}
          </div>
          {freq !== null && (
            <p style={{ fontSize: 12, color: "var(--brand-muted)" }}>
              {workoutName} <b style={{ color: "var(--brand-ink)" }}>{freq} ganger</b> i uka
            </p>
          )}
        </>
      )}

      <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          disabled={!canContinue}
          onClick={handleContinue}
          style={{
            background: canContinue ? "var(--brand-orange)" : "var(--brand-border)",
            color: "white",
            border: "none",
            borderRadius: 99,
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 700,
            cursor: canContinue ? "pointer" : "not-allowed",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          → Fortsett
        </button>
      </div>
    </div>
  )
}
