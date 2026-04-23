"use client"

import { useEffect, useState } from "react"
import { getProgram, type Program, type ProgramDay, type ProgramExerciseSet } from "@/lib/api"
import ExerciseLibrary from "./ExerciseLibrary"
import ExerciseDetail from "./ExerciseDetail"

const MUSCLE_COLORS: Record<string, string> = {
  quads: "#1e3a5f",
  glutes: "#1e3a5f",
  hamstrings: "#1e3a5f",
  chest: "#3a1e1e",
  triceps: "#3a1e1e",
  upper_chest: "#3a1e1e",
  lats: "#1e3a2a",
  rhomboids: "#1e3a2a",
  back: "#1e3a2a",
  traps: "#1e3a2a",
  front_deltoid: "#3a2a1e",
  rear_deltoid: "#3a2a1e",
  rotator_cuff: "#3a2a1e",
  biceps: "#2a1e3a",
  lower_back: "#1e2a3a",
}

function muscleColor(groups: string[]): string {
  for (const g of groups) {
    if (MUSCLE_COLORS[g]) return MUSCLE_COLORS[g]
  }
  return "#1a1a2e"
}

function setSummary(sets: ProgramExerciseSet[]): string {
  if (sets.length === 0) return "Ingen sett"
  const allSameReps   = sets.every((s) => s.reps === sets[0].reps)
  const allSameWeight = sets.every((s) => s.weight_kg === sets[0].weight_kg)
  if (allSameReps && allSameWeight) {
    const w = sets[0].weight_kg != null ? ` · ${sets[0].weight_kg} kg` : ""
    return `${sets.length} sett · ${sets[0].reps} reps${w}`
  }
  return `${sets.length} sett`
}

interface Props {
  programId: string
  onBack: () => void
}

export default function ProgramDetail({ programId, onBack }: Props) {
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(0)
  const [libraryDayId, setLibraryDayId] = useState<string | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<{
    id: string; dayId: string; name: string
  } | null>(null)

  useEffect(() => {
    getProgram(programId)
      .then(setProgram)
      .catch((err) => console.error("Failed to fetch program:", err))
      .finally(() => setLoading(false))
  }, [programId])

  useEffect(() => {
    setActiveDay(0)
  }, [programId])

  if (loading) return <p className="text-muted-foreground text-sm p-4">Laster program...</p>
  if (!program) return <p className="text-muted-foreground text-sm p-4">Program ikke funnet.</p>

  const days = program.days ?? []
  const day: ProgramDay | undefined = days[activeDay]

  if (selectedExercise) {
    return (
      <ExerciseDetail
        programId={programId}
        dayId={selectedExercise.dayId}
        exerciseId={selectedExercise.id}
        exerciseName={selectedExercise.name}
        onBack={() => setSelectedExercise(null)}
      />
    )
  }

  if (libraryDayId) {
    return (
      <ExerciseLibrary
        programId={programId}
        dayId={libraryDayId}
        onClose={() => setLibraryDayId(null)}
        onAdd={() => {
          setLibraryDayId(null)
          getProgram(programId).then(setProgram).catch(console.error)
        }}
      />
    )
  }

  return (
    <div>
      <div className="p-4 border-b flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-lg">←</button>
        <h2 className="font-bold text-lg">{program.name}</h2>
        {program.is_active && (
          <span className="text-xs text-green-500 font-medium ml-auto">Aktiv</span>
        )}
      </div>

      <div className="flex gap-2 p-4 overflow-x-auto">
        {days.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setActiveDay(i)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              i === activeDay
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            Dag {d.day_number}: {d.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 px-4">
        {day?.exercises.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setSelectedExercise({ id: ex.id, dayId: day.id, name: ex.name })}
            className="bg-card border rounded-lg p-3 flex gap-3 items-center text-left w-full hover:bg-accent transition-colors"
          >
            <div
              className="w-8 h-8 rounded-md flex-shrink-0"
              style={{ backgroundColor: muscleColor(ex.muscle_groups) }}
            />
            <div>
              <p className="font-medium text-sm">{ex.name}</p>
              <p className="text-xs text-muted-foreground">{setSummary(ex.sets)}</p>
            </div>
          </button>
        ))}

        {day && (
          <button
            onClick={() => setLibraryDayId(day.id)}
            className="mt-2 border border-dashed rounded-lg p-3 text-sm text-muted-foreground hover:bg-accent transition-colors text-center"
          >
            + Legg til øvelse
          </button>
        )}
      </div>
    </div>
  )
}
