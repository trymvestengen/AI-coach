"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { shareWorkout, type ProgramExercise } from "@/lib/api"

export interface SetLog {
  reps: number
  weightKg: number | null
  done: boolean
}

interface Props {
  workoutId: string
  exercises: ProgramExercise[]
  setLog: Record<string, SetLog[]>
  onClose: () => void
}

export default function ShareSheet({ workoutId, exercises, setLog, onClose }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalVolume = exercises.reduce((sum, ex) => {
    const log = setLog[ex.id] ?? []
    return sum + log.reduce((s, set) => s + (set.done ? set.reps * (set.weightKg ?? 0) : 0), 0)
  }, 0)
  const totalSets = exercises.reduce((sum, ex) => {
    const log = setLog[ex.id] ?? []
    return sum + log.filter((s) => s.done).length
  }, 0)
  const muscleGroups = Array.from(new Set(exercises.flatMap((ex) => ex.muscle_groups))).slice(0, 3)

  const handleShare = async () => {
    setBusy(true)
    setError(null)
    try {
      await shareWorkout(workoutId)
      router.push("/program")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deling feilet")
    } finally {
      setBusy(false)
    }
  }

  const handleSkip = () => router.push("/program")

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.6)",
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
          padding: "20px 20px 28px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            color: "var(--brand-muted)",
            marginBottom: 14,
          }}
        >
          Økt fullført 🎉
        </div>

        <div
          style={{
            background: "var(--brand-surface)",
            border: "1px solid var(--brand-border)",
            borderRadius: 14,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <div
            style={{ fontSize: 15, fontWeight: 700, color: "var(--brand-ink)", marginBottom: 6 }}
          >
            {muscleGroups.length > 0 ? muscleGroups.join(" · ") : "Økt"}
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--brand-muted)" }}>
            <span>{Math.round(totalVolume).toLocaleString("nb-NO")} kg</span>
            <span>{totalSets} sett</span>
          </div>
        </div>

        {error && (
          <div
            style={{ color: "var(--danger)", fontSize: 12, textAlign: "center", marginBottom: 10 }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleShare}
          disabled={busy}
          style={{
            width: "100%",
            background: "var(--brand-orange)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            fontWeight: 700,
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.7 : 1,
            marginBottom: 8,
          }}
        >
          {busy ? "Deler…" : "Del nå"}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px solid var(--brand-border)",
            color: "var(--brand-muted)",
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Ikke nå
        </button>
      </div>
    </div>
  )
}
