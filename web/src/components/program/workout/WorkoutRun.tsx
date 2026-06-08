"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  logSet,
  completeWorkout,
  type ProgramExercise,
  type ProgramFolder,
  type WorkoutDetail,
  type Exercise,
} from "@/lib/api"
import WorkoutHeader from "./WorkoutHeader"
import CloseConfirmSheet from "./CloseConfirmSheet"
import WorkoutExerciseRow, { type SetLog } from "./WorkoutExerciseRow"
import RestTimer from "./RestTimer"
import ShareSheet from "./ShareSheet"
import ExercisePickerSheet from "./ExercisePickerSheet"
import SaveAsProgramSheet from "./SaveAsProgramSheet"

interface Props {
  workout: WorkoutDetail
  folders: ProgramFolder[]
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

export default function WorkoutRun({ workout, folders }: Props) {
  const router = useRouter()
  const isAdHoc = workout.day_name === null

  // For ad-hoc, exercises mutate as the user adds them. For program mode, exercises stay fixed.
  const [exercises, setExercises] = useState<ProgramExercise[]>(workout.exercises)
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
  const [saveAsProgramOpen, setSaveAsProgramOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // For program-mode: all sets done. For ad-hoc: any sets logged.
  const allProgramSetsDone =
    !isAdHoc &&
    exercises.length > 0 &&
    exercises.every((ex) => (setLog[ex.id] ?? []).every((s) => s.done))

  const hasAnyLoggedSet = Object.values(setLog).some((log) => log.some((s) => s.done))

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

  const handleAddSet = (exerciseId: string) => {
    setSetLog((prev) => {
      const existing = prev[exerciseId] ?? []
      const lastSet = existing[existing.length - 1]
      const defaultReps = lastSet?.reps ?? 8
      const defaultKg = lastSet?.weightKg ?? null
      return {
        ...prev,
        [exerciseId]: [...existing, { reps: defaultReps, weightKg: defaultKg, done: false }],
      }
    })
  }

  const handlePickExercise = (ex: Exercise) => {
    // Convert to ProgramExercise shape (no real program_exercise row — purely client-side).
    const newProgEx: ProgramExercise = {
      id: `ad-hoc-${ex.id}-${Date.now()}`,
      exercise_id: ex.id,
      name: ex.name,
      muscle_groups: ex.muscle_groups,
      order_index: exercises.length,
      sets: [],
      notes: null,
      image_url: ex.image_urls?.[0] ?? null,
    }
    setExercises((prev) => [...prev, newProgEx])
    setSetLog((prev) => ({ ...prev, [newProgEx.id]: [] }))
  }

  const handleComplete = async () => {
    if (completing) return
    setCompleting(true)
    try {
      await completeWorkout(workout.workout_id)
      if (isAdHoc) {
        setSaveAsProgramOpen(true)
      } else {
        setShareOpen(true)
      }
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
        dayName={workout.day_name ?? "Tom økt"}
        onClose={() => setCloseOpen(true)}
      />

      <div style={{ flex: 1, padding: "0 20px 120px", overflowY: "auto" }}>
        {exercises.length === 0 ? (
          <div
            style={{
              background: "var(--brand-surface)",
              border: "1px dashed var(--brand-border)",
              borderRadius: 12,
              padding: "20px 12px",
              textAlign: "center",
              color: "var(--brand-muted)",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            Ingen øvelser ennå.
          </div>
        ) : (
          exercises.map((ex) => (
            <WorkoutExerciseRow
              key={ex.id}
              ex={ex}
              log={setLog[ex.id] ?? []}
              onCheck={(i, reps, kg) => handleCheck(ex, i, reps, kg)}
              onAddSet={isAdHoc ? () => handleAddSet(ex.id) : undefined}
            />
          ))
        )}

        {isAdHoc && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            style={{
              width: "100%",
              background: "var(--brand-subtle)",
              border: "1px dashed var(--brand-orange)",
              color: "var(--brand-orange)",
              borderRadius: 12,
              padding: 12,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 8,
            }}
          >
            + Legg til øvelse
          </button>
        )}
      </div>

      {(allProgramSetsDone || (isAdHoc && hasAnyLoggedSet)) && !shareOpen && !saveAsProgramOpen && (
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

      <ExercisePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePickExercise}
      />

      {shareOpen && (
        <ShareSheet
          workoutId={workout.workout_id}
          exercises={exercises}
          setLog={setLog}
          onClose={() => router.push("/program")}
        />
      )}

      <SaveAsProgramSheet
        open={saveAsProgramOpen}
        workoutId={workout.workout_id}
        folders={folders}
        hasLoggedSets={hasAnyLoggedSet}
        onClose={() => setSaveAsProgramOpen(false)}
      />
    </div>
  )
}
