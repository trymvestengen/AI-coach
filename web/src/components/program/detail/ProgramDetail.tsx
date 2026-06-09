"use client"
import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { type Program, type ProgramFolder, patchProgram } from "@/lib/api"
import ProgramMenuSheet from "./ProgramMenuSheet"
import MoveToFolderSheet from "./MoveToFolderSheet"
import RenameDaySheet from "./RenameDaySheet"
import ManageDaysSheet from "./ManageDaysSheet"
import ExercisePickerSheet from "@/components/program/workout/ExercisePickerSheet"
import WorkoutRun from "@/components/program/workout/WorkoutRun"
import {
  addExerciseToDay,
  startWorkout,
  getInProgressWorkout,
  getWorkout,
  type InProgressWorkout,
  type WorkoutDetail,
} from "@/lib/api"

interface Props {
  program: Program
  folders: ProgramFolder[]
  todayDayNumber: number
}

export default function ProgramDetail({ program, folders, todayDayNumber }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [manageDaysOpen, setManageDaysOpen] = useState(false)
  const [renameProgOpen, setRenameProgOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [startingWorkout, setStartingWorkout] = useState(false)
  // Ref (not state) so flipping the lock doesn't trigger a re-render and trip
  // react-hooks/set-state-in-effect.
  const autoStartAttemptedRef = useRef(false)
  const [inProgressLoaded, setInProgressLoaded] = useState(false)
  const [inProgress, setInProgress] = useState<InProgressWorkout | null>(null)
  const [activeWorkoutDetail, setActiveWorkoutDetail] = useState<WorkoutDetail | null>(null)

  const days = useMemo(() => program.days ?? [], [program.days])
  const hasAnyExercises = days.some((d) => (d.exercises ?? []).length > 0)
  const targetDayForStart = useMemo(
    () =>
      days.find((d) => (d.weekdays ?? []).includes(todayDayNumber)) ??
      days.find((d) => (d.exercises ?? []).length > 0) ??
      days[0],
    [days, todayDayNumber]
  )

  // Load any in-progress workout on mount
  useEffect(() => {
    getInProgressWorkout()
      .then((w) => setInProgress(w))
      .catch(() => setInProgress(null))
      .finally(() => setInProgressLoaded(true))
  }, [program.id])

  // Auto-start a workout the first time we enter this program with no in-progress one.
  useEffect(() => {
    if (!inProgressLoaded || autoStartAttemptedRef.current) return
    if (inProgress) return
    if (!targetDayForStart) return
    if ((targetDayForStart.exercises ?? []).length === 0) return
    autoStartAttemptedRef.current = true
    let cancelled = false
    ;(async () => {
      setStartingWorkout(true)
      try {
        const { workout_id } = await startWorkout(targetDayForStart.id)
        const [detail, fresh] = await Promise.all([getWorkout(workout_id), getInProgressWorkout()])
        if (cancelled) return
        setActiveWorkoutDetail(detail)
        setInProgress(fresh)
      } catch (e) {
        console.error("[auto-start] failed", e)
      } finally {
        if (!cancelled) setStartingWorkout(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [inProgressLoaded, inProgress, targetDayForStart])

  // When an in-progress workout matches a day in this program, fetch full detail.
  useEffect(() => {
    if (!inProgress) return
    const belongsToProgram = days.some((d) => d.id === inProgress.program_day_id)
    if (!belongsToProgram) return
    let cancelled = false
    getWorkout(inProgress.workout_id)
      .then((d) => {
        if (!cancelled) setActiveWorkoutDetail(d)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [inProgress, days])

  const handleStartManually = async () => {
    if (!targetDayForStart || (targetDayForStart.exercises ?? []).length === 0) {
      setPickerOpen(true)
      return
    }
    setStartingWorkout(true)
    try {
      const { workout_id } = await startWorkout(targetDayForStart.id)
      const [detail, fresh] = await Promise.all([getWorkout(workout_id), getInProgressWorkout()])
      setActiveWorkoutDetail(detail)
      setInProgress(fresh)
    } catch {
      alert("Kunne ikke starte økt. Prøv igjen.")
    } finally {
      setStartingWorkout(false)
    }
  }

  const inProgressBelongsHere = !!inProgress && days.some((d) => d.id === inProgress.program_day_id)

  // ─── Render ───────────────────────────────────────────────────────────────
  // The page is always dark-themed Strong-style. Either an active workout, a
  // loading shimmer, or an empty-state CTA. Edit affordances live in sheets.

  const content = (() => {
    if (inProgressBelongsHere && activeWorkoutDetail) {
      return (
        <WorkoutRun
          workout={activeWorkoutDetail}
          folders={folders}
          onExit={() => {
            setInProgress(null)
            setActiveWorkoutDetail(null)
            autoStartAttemptedRef.current = true
            router.push("/program")
          }}
          onEdit={() => setMenuOpen(true)}
        />
      )
    }

    if (!inProgressLoaded || startingWorkout || (inProgressBelongsHere && !activeWorkoutDetail)) {
      return <DarkCenteredMessage>Laster økt…</DarkCenteredMessage>
    }

    // No in-progress workout for this program and nothing to auto-start.
    if (!hasAnyExercises) {
      return (
        <EmptyProgramState
          programName={program.name}
          onAddExercise={() => setPickerOpen(true)}
          onOpenMenu={() => setMenuOpen(true)}
          onExit={() => router.push("/program")}
        />
      )
    }

    // Has exercises but auto-start was skipped / failed — show a manual Start.
    return (
      <ManualStartState
        programName={program.name}
        onStart={handleStartManually}
        onOpenMenu={() => setMenuOpen(true)}
        onExit={() => router.push("/program")}
        starting={startingWorkout}
      />
    )
  })()

  return (
    <>
      {content}

      <ProgramMenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        programId={program.id}
        programName={program.name}
        isActive={program.is_active}
        onOpenMoveSheet={() => setMoveOpen(true)}
        onOpenManageDays={() => setManageDaysOpen(true)}
        onOpenRename={() => setRenameProgOpen(true)}
        onOpenAddExercise={() => setPickerOpen(true)}
      />

      <ExercisePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={async (exercise: { id: string }) => {
          const dayForAdd =
            targetDayForStart ?? days.find((d) => (d.exercises ?? []).length > 0) ?? days[0]
          if (!dayForAdd) return
          await addExerciseToDay(program.id, dayForAdd.id, { exercise_id: exercise.id })
          setPickerOpen(false)
          window.location.reload()
        }}
      />

      <RenameDaySheet
        open={renameProgOpen}
        initialName={program.name}
        onClose={() => setRenameProgOpen(false)}
        onSave={async (name) => {
          await patchProgram(program.id, { name })
          setRenameProgOpen(false)
          window.location.reload()
        }}
      />

      <ManageDaysSheet
        open={manageDaysOpen}
        program={program}
        onClose={() => setManageDaysOpen(false)}
      />

      <MoveToFolderSheet
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        programId={program.id}
        currentFolderId={program.folder_id ?? null}
        folders={folders}
        onMoved={() => window.location.reload()}
      />
    </>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function DarkCenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#1a1a1a",
        color: "rgba(255,255,255,0.6)",
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
      }}
    >
      {children}
    </div>
  )
}

function EmptyProgramState({
  programName,
  onAddExercise,
  onOpenMenu,
  onExit,
}: {
  programName: string
  onAddExercise: () => void
  onOpenMenu: () => void
  onExit: () => void
}) {
  return (
    <div
      style={{
        background: "#1a1a1a",
        color: "white",
        minHeight: "100%",
        padding: "16px 18px 24px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <DarkTopBar onExit={onExit} onOpenMenu={onOpenMenu} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 14,
        }}
      >
        <div style={{ fontSize: 40 }}>💪</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{programName}</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: 0, maxWidth: 280 }}>
          Programmet er tomt — legg til en øvelse for å starte din første økt.
        </p>
        <button
          type="button"
          onClick={onAddExercise}
          style={{
            background: "var(--brand-orange)",
            color: "white",
            border: "none",
            borderRadius: 99,
            padding: "12px 26px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            marginTop: 10,
          }}
        >
          + Legg til øvelse
        </button>
      </div>
    </div>
  )
}

function ManualStartState({
  programName,
  onStart,
  onOpenMenu,
  onExit,
  starting,
}: {
  programName: string
  onStart: () => void
  onOpenMenu: () => void
  onExit: () => void
  starting: boolean
}) {
  return (
    <div
      style={{
        background: "#1a1a1a",
        color: "white",
        minHeight: "100%",
        padding: "16px 18px 24px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <DarkTopBar onExit={onExit} onOpenMenu={onOpenMenu} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 14,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{programName}</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: 0 }}>Klar til å trene?</p>
        <button
          type="button"
          onClick={onStart}
          disabled={starting}
          style={{
            background: "var(--brand-orange)",
            color: "white",
            border: "none",
            borderRadius: 99,
            padding: "14px 32px",
            fontSize: 15,
            fontWeight: 700,
            cursor: starting ? "not-allowed" : "pointer",
            opacity: starting ? 0.6 : 1,
            marginTop: 8,
          }}
        >
          {starting ? "Starter…" : "▶ Start økt"}
        </button>
      </div>
    </div>
  )
}

function DarkTopBar({ onExit, onOpenMenu }: { onExit: () => void; onOpenMenu: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 22,
      }}
    >
      <button
        type="button"
        onClick={onExit}
        aria-label="Tilbake"
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          border: "none",
          color: "rgba(255,255,255,0.7)",
          cursor: "pointer",
          fontSize: 18,
        }}
      >
        ✕
      </button>
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Program-meny"
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          border: "none",
          color: "rgba(255,255,255,0.7)",
          cursor: "pointer",
          fontSize: 22,
          lineHeight: 1,
        }}
      >
        ⋯
      </button>
    </div>
  )
}
