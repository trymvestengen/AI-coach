"use client"
import { useState } from "react"
import { completeWorkout, type InProgressWorkout } from "@/lib/api"

interface Props {
  open: boolean
  workout: InProgressWorkout
  programName: string
  dayName: string
  onClose: () => void
  onCompleted: () => void
}

export default function FinishWorkoutSheet({
  open,
  workout,
  programName,
  dayName,
  onClose,
  onCompleted,
}: Props) {
  const [rpe, setRpe] = useState<number | null>(null)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  // Snapshot "now" at mount so render stays pure across re-renders.
  const [openedAt] = useState(() => Date.now())

  if (!open) return null

  const setsLogged = workout.logged_sets.length
  const totalVolume = workout.logged_sets.reduce((sum, s) => sum + s.reps * (s.weight_kg ?? 0), 0)
  const uniqueExercises = new Set(workout.logged_sets.map((s) => s.exercise_id)).size
  const durationMin = workout.started_at
    ? Math.max(1, Math.round((openedAt - new Date(workout.started_at).getTime()) / 60000))
    : 0

  const handleFinish = async () => {
    setSubmitting(true)
    try {
      await completeWorkout(workout.workout_id, {
        rpe: rpe ?? undefined,
        notes: notes.trim() || undefined,
      })
      setDone(true)
    } catch {
      alert("Kunne ikke fullføre økten. Prøv igjen.")
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={done ? onCompleted : onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 65,
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
            borderRadius: 99,
            margin: "0 auto 14px",
          }}
        />

        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 4 }}>🔥</div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                margin: "4px 0 4px",
                letterSpacing: "-0.02em",
              }}
            >
              Godt jobba!
            </h2>
            <p style={{ fontSize: 13, color: "var(--brand-muted)", marginBottom: 18 }}>
              {dayName} fullført
            </p>
            <StatsRow
              setsLogged={setsLogged}
              totalVolume={totalVolume}
              uniqueExercises={uniqueExercises}
              durationMin={durationMin}
            />
            <button
              type="button"
              onClick={onCompleted}
              style={{
                width: "100%",
                marginTop: 20,
                background: "var(--brand-orange)",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "14px 0",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Lukk
            </button>
          </div>
        ) : (
          <>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: "2px 0 4px",
                letterSpacing: "-0.01em",
                textAlign: "center",
              }}
            >
              Fullfør økt
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "var(--brand-muted)",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {programName} · {dayName}
            </p>

            <StatsRow
              setsLogged={setsLogged}
              totalVolume={totalVolume}
              uniqueExercises={uniqueExercises}
              durationMin={durationMin}
            />

            <div style={{ marginTop: 18 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--brand-muted)",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                RPE — hvor hardt?{" "}
                <span
                  style={{
                    color: "var(--brand-muted)",
                    fontWeight: 500,
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  (valgfri)
                </span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                  const selected = rpe === n
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRpe(selected ? null : n)}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        background: selected ? "var(--brand-orange)" : "var(--brand-surface)",
                        color: selected ? "white" : "var(--brand-ink)",
                        border: "1px solid var(--brand-border)",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--brand-muted)",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Notater{" "}
                <span
                  style={{
                    color: "var(--brand-muted)",
                    fontWeight: 500,
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  (valgfri)
                </span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                placeholder="Hvordan gikk det? Energi, form, smerter…"
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: 13,
                  border: "1px solid var(--brand-border)",
                  borderRadius: 8,
                  background: "white",
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                  minHeight: 70,
                  fontFamily: "inherit",
                }}
              />
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleFinish}
              style={{
                width: "100%",
                marginTop: 18,
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "14px 0",
                fontSize: 14,
                fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "Lagrer…" : "✓ Fullfør økt"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "100%",
                marginTop: 8,
                background: "transparent",
                color: "var(--brand-muted)",
                border: "none",
                padding: "10px 0",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Avbryt
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function StatsRow({
  setsLogged,
  totalVolume,
  uniqueExercises,
  durationMin,
}: {
  setsLogged: number
  totalVolume: number
  uniqueExercises: number
  durationMin: number
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 8,
        padding: "14px 0",
        borderTop: "1px solid var(--brand-border)",
        borderBottom: "1px solid var(--brand-border)",
      }}
    >
      <Stat label="Sett" value={String(setsLogged)} />
      <Stat label="Øvelser" value={String(uniqueExercises)} />
      <Stat
        label="Kg løftet"
        value={totalVolume > 0 ? Math.round(totalVolume).toLocaleString("no-NO") : "—"}
      />
      <Stat label="Min" value={String(durationMin)} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "var(--brand-ink)",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "var(--brand-muted)",
          letterSpacing: 0.5,
          textTransform: "uppercase",
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  )
}
