"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { logSet, completeWorkout, type ProgramExercise, type WorkoutDetail } from "@/lib/api"
import WorkoutHeader from "./WorkoutHeader"
import CloseConfirmSheet from "./CloseConfirmSheet"
import WorkoutExerciseRow, { type SetLog } from "./WorkoutExerciseRow"
import RestTimer from "./RestTimer"
import ShareSheet from "./ShareSheet"

interface Props {
  workout: WorkoutDetail
}

function buildInitialLog(
  exercises: ProgramExercise[],
  logged: WorkoutDetail["logged_sets"]
): Record<string, SetLog[]> {
  const out: Record<string, SetLog[]> = {}
  for (const ex of exercises) {
    out[ex.id] = ex.sets.map((s) => {
      const matched = logged.find(
        (l) => l.exercise_id === ex.exercise_id && l.set_number === s.set_number
      )
      return matched
        ? { reps: matched.reps, weightKg: matched.weight_kg, done: true }
        : { reps: s.reps, weightKg: s.weight_kg, done: false }
    })
  }
  return out
}

export default function WorkoutRun({ workout }: Props) {
  const router = useRouter()
  const [setLog, setSetLog] = useState<Record<string, SetLog[]>>(
    buildInitialLog(workout.exercises, workout.logged_sets)
  )
  const [closeOpen, setCloseOpen] = useState(false)
  const [restOpen, setRestOpen] = useState(false)
  const [restSeconds] = useState(() => {
    if (typeof window === "undefined") return 90
    return parseInt(localStorage.getItem("restTimerSeconds") ?? "90", 10)
  })
  const [completing, setCompleting] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const allDone = workout.exercises.every((ex) => (setLog[ex.id] ?? []).every((s) => s.done))

  const handleCheck = async (
    ex: ProgramExercise,
    setIndex: number,
    reps: number,
    weightKg: number | null
  ) => {
    // optimistic
    setSetLog((prev) => ({
      ...prev,
      [ex.id]: prev[ex.id].map((s, i) =>
        i === setIndex ? { ...s, reps, weightKg, done: true } : s
      ),
    }))
    setRestOpen(true)
    try {
      await logSet(workout.workout_id, {
        exercise_id: ex.exercise_id,
        set_number: setIndex + 1,
        reps,
        weight_kg: weightKg,
      })
    } catch {
      // one retry, swallow errors — UI stays optimistic
      try {
        await logSet(workout.workout_id, {
          exercise_id: ex.exercise_id,
          set_number: setIndex + 1,
          reps,
          weight_kg: weightKg,
        })
      } catch {
        /* silent — set stays optimistically logged */
      }
    }
  }

  const handleComplete = async () => {
    if (completing) return
    setCompleting(true)
    try {
      await completeWorkout(workout.workout_id)
      setShareOpen(true)
    } catch {
      setCompleting(false)
    }
  }

  return (
    <div
      style={{
        background: "var(--brand-canvas)",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <WorkoutHeader
        startedAt={workout.started_at}
        dayName={workout.day_name ?? "Økt"}
        onClose={() => setCloseOpen(true)}
      />

      <div style={{ flex: 1, padding: "0 20px 100px", overflowY: "auto" }}>
        {workout.exercises.map((ex) => (
          <WorkoutExerciseRow
            key={ex.id}
            ex={ex}
            log={setLog[ex.id] ?? []}
            onCheck={(i, reps, kg) => handleCheck(ex, i, reps, kg)}
          />
        ))}
      </div>

      {allDone && !shareOpen && (
        <div
          style={{
            padding: "12px 20px 20px",
            borderTop: "1px solid var(--brand-border)",
            background: "var(--brand-canvas)",
          }}
        >
          <button
            type="button"
            onClick={handleComplete}
            disabled={completing}
            style={{
              width: "100%",
              background: "var(--brand-orange)",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              padding: 14,
              fontSize: 15,
              fontWeight: 700,
              cursor: completing ? "default" : "pointer",
              opacity: completing ? 0.7 : 1,
            }}
          >
            {completing ? "Fullfører…" : "Fullfør økt ✓"}
          </button>
        </div>
      )}

      {restOpen && (
        <RestTimer
          seconds={restSeconds}
          onDone={() => setRestOpen(false)}
          onChangeDefault={(s) => localStorage.setItem("restTimerSeconds", String(s))}
        />
      )}

      <CloseConfirmSheet
        open={closeOpen}
        workoutId={workout.workout_id}
        onCancel={() => setCloseOpen(false)}
      />

      {shareOpen && (
        <ShareSheet
          workoutId={workout.workout_id}
          exercises={workout.exercises}
          setLog={setLog}
          onClose={() => router.push("/program")}
        />
      )}
    </div>
  )
}
