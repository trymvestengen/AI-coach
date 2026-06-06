"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { startWorkout, type Program, type ProgramFolder, type InProgressWorkout } from "@/lib/api"
import TodaysWorkoutBanner, { type BannerState } from "./TodaysWorkoutBanner"
import FolderCard from "./FolderCard"
import ProgramCard from "./ProgramCard"
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
  todaysWorkout: TodaysWorkoutInfo | null // null if rest-day OR no active
  hasActiveProgram: boolean
  inProgress: InProgressWorkout | null
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
    return {
      kind: "rest-day",
      nextDayName: null, // server can populate later
    }
  }
  if (props.programs.length === 0) {
    return { kind: "empty" }
  }
  return { kind: "no-active", programCount: props.programs.length }
}

export default function ProgramLibrary(props: Props) {
  const router = useRouter()
  const [newProgramOpen, setNewProgramOpen] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [starting, setStarting] = useState(false)

  const bannerState = deriveBannerState(props)

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
    // Find the active program and go to it
    const active = props.programs.find((p) => p.is_active)
    if (active) router.push(`/program/${active.id}`)
  }

  return (
    <div style={{ padding: 20, background: "var(--brand-canvas)", minHeight: "100%" }}>
      <TodaysWorkoutBanner
        state={bannerState}
        onStart={handleStart}
        onContinue={handleContinue}
        onSeeProgram={handleSeeProgram}
        onPickActive={() => setPickerOpen(true)}
        onCreateProgram={() => setNewProgramOpen(true)}
      />

      <SectionHeader title="Mapper" onAdd={() => setNewFolderOpen(true)} />
      {props.folders.length === 0 ? (
        <EmptyHint text="Ingen mapper enda" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
          {props.folders.map((f) => (
            <FolderCard
              key={f.id}
              folder={f}
              onOpen={() => {
                /* folder detail later */
              }}
            />
          ))}
        </div>
      )}

      <SectionHeader title="Programmer" onAdd={() => setNewProgramOpen(true)} />
      {props.programs.length === 0 ? (
        <EmptyHint text="Ingen programmer enda" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {props.programs.map((p) => (
            <ProgramCard key={p.id} program={p} onOpen={(id) => router.push(`/program/${id}`)} />
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
    </div>
  )
}

function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        margin: "14px 4px 8px",
      }}
    >
      <span
        style={{
          fontSize: 11,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "var(--brand-muted)",
          fontWeight: 600,
        }}
      >
        {title}
      </span>
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Legg til ${title.toLowerCase()}`}
        style={{
          background: "none",
          border: "none",
          color: "var(--brand-orange)",
          fontSize: 18,
          fontWeight: 700,
          cursor: "pointer",
          padding: "0 4px",
        }}
      >
        +
      </button>
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
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
      {text}
    </div>
  )
}
