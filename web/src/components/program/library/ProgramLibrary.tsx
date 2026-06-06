"use client"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  startWorkout,
  startEmptyWorkout,
  type Program,
  type ProgramFolder,
  type InProgressWorkout,
} from "@/lib/api"
import TodaysWorkoutBanner, { type BannerState } from "./TodaysWorkoutBanner"
import ProgramCard from "./ProgramCard"
import QuickStartCTA from "./QuickStartCTA"
import FolderPillBar from "./FolderPillBar"
import FolderActionsSheet from "./FolderActionsSheet"
import NewProgramSheet from "./NewProgramSheet"
import NewFolderSheet from "./NewFolderSheet"
import ProgramPickerSheet from "./ProgramPickerSheet"

export interface TodaysWorkoutInfo {
  programId: string
  dayId: string
  dayName: string
  exerciseCount: number
  nextDayName: string | null
}

interface Props {
  programs: Program[]
  folders: ProgramFolder[]
  todaysWorkout: TodaysWorkoutInfo | null
  hasActiveProgram: boolean
  inProgress: InProgressWorkout | null
  programPreviews: Record<string, string[]> // programId → first 3 exercise names
}

function deriveBannerState(props: Props): BannerState {
  if (props.inProgress) {
    return {
      kind: "in-progress",
      workoutId: props.inProgress.workout_id,
      dayName: "Pågående økt",
      setsLogged: props.inProgress.sets_logged,
    }
  }
  if (props.todaysWorkout) {
    return {
      kind: "today-ready",
      dayId: props.todaysWorkout.dayId,
      dayName: props.todaysWorkout.dayName,
      exerciseCount: props.todaysWorkout.exerciseCount,
    }
  }
  if (props.hasActiveProgram) {
    return { kind: "rest-day", nextDayName: null }
  }
  if (props.programs.length === 0) {
    return { kind: "empty" }
  }
  return { kind: "no-active", programCount: props.programs.length }
}

export default function ProgramLibrary(props: Props) {
  const router = useRouter()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [newProgramOpen, setNewProgramOpen] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [folderActions, setFolderActions] = useState<ProgramFolder | null>(null)
  const [starting, setStarting] = useState(false)
  const [emptyStarting, setEmptyStarting] = useState(false)

  const bannerState = deriveBannerState(props)

  const visiblePrograms = useMemo(
    () =>
      selectedFolderId === null
        ? props.programs
        : props.programs.filter((p) => p.folder_id === selectedFolderId),
    [props.programs, selectedFolderId]
  )

  const handleStart = async () => {
    if (!props.todaysWorkout || starting) return
    setStarting(true)
    try {
      const { workout_id } = await startWorkout(props.todaysWorkout.dayId)
      router.push(`/program/workout/${workout_id}`)
    } catch {
      setStarting(false)
    }
  }

  const handleContinue = () => {
    if (props.inProgress) router.push(`/program/workout/${props.inProgress.workout_id}`)
  }

  const handleSeeProgram = () => {
    const active = props.programs.find((p) => p.is_active)
    if (active) router.push(`/program/${active.id}`)
  }

  const handleEmptyStart = async () => {
    if (emptyStarting) return
    setEmptyStarting(true)
    try {
      const { workout_id } = await startEmptyWorkout()
      router.push(`/program/workout/${workout_id}`)
    } catch {
      setEmptyStarting(false)
    }
  }

  return (
    <div style={{ padding: 20, background: "var(--brand-canvas)", minHeight: "100%" }}>
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: "var(--brand-ink)",
          letterSpacing: "-0.03em",
          marginBottom: 14,
        }}
      >
        Trening
      </div>

      <TodaysWorkoutBanner
        state={bannerState}
        onStart={handleStart}
        onContinue={handleContinue}
        onSeeProgram={handleSeeProgram}
        onPickActive={() => setPickerOpen(true)}
        onCreateProgram={() => setNewProgramOpen(true)}
      />

      <QuickStartCTA onStart={handleEmptyStart} busy={emptyStarting} />

      <FolderPillBar
        folders={props.folders}
        totalProgramCount={props.programs.length}
        selectedFolderId={selectedFolderId}
        onSelect={setSelectedFolderId}
        onAddFolder={() => setNewFolderOpen(true)}
        onFolderLongPress={setFolderActions}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "4px 4px 10px",
        }}
      >
        <span
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: "var(--brand-ink)",
            letterSpacing: "-0.02em",
          }}
        >
          Programmer
        </span>
        <button
          type="button"
          onClick={() => setNewProgramOpen(true)}
          style={{
            background: "var(--brand-subtle)",
            border: "none",
            color: "var(--brand-orange)",
            borderRadius: 10,
            padding: "5px 10px",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Nytt
        </button>
      </div>

      {visiblePrograms.length === 0 ? (
        <div
          style={{
            background: "var(--brand-surface)",
            border: "1px dashed var(--brand-border)",
            borderRadius: 12,
            padding: "16px 12px",
            textAlign: "center",
            color: "var(--brand-muted)",
            fontSize: 12,
            marginBottom: 18,
          }}
        >
          {selectedFolderId === null
            ? "Ingen programmer enda"
            : "Ingen programmer i denne mappen. Flytt et hit fra ⋯-menyen."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {visiblePrograms.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              previewExercises={props.programPreviews[p.id] ?? []}
              onOpen={(id) => router.push(`/program/${id}`)}
            />
          ))}
        </div>
      )}

      <NewProgramSheet open={newProgramOpen} onClose={() => setNewProgramOpen(false)} />
      <NewFolderSheet
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        onCreated={() => router.refresh()}
      />
      <ProgramPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        programs={props.programs}
        onActivated={() => router.refresh()}
      />
      <FolderActionsSheet
        folder={folderActions}
        onClose={() => setFolderActions(null)}
        onChanged={() => {
          // If the user just deleted the currently-selected folder, reset to "Alle"
          if (folderActions && selectedFolderId === folderActions.id) {
            setSelectedFolderId(null)
          }
          router.refresh()
        }}
      />
    </div>
  )
}
