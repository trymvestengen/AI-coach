"use client"

import { useEffect, useState } from "react"
import { getExerciseDetail, addSet, updateSet, type ProgramExerciseSet } from "@/lib/api"

interface SetRowProps {
  set: ProgramExerciseSet
  onUpdate: (reps: number, weight_kg: number | null) => void
}

function SetRow({ set, onUpdate }: SetRowProps) {
  const [reps, setReps] = useState(String(set.reps))
  const [weight, setWeight] = useState(set.weight_kg != null ? String(set.weight_kg) : "")

  function handleBlur() {
    const r = parseInt(reps) || set.reps
    const w = weight ? parseFloat(weight) : null
    onUpdate(r, w)
  }

  return (
    <div className="grid grid-cols-4 gap-2 items-center py-2.5 border-b">
      <span className="text-sm font-medium text-center">{set.set_number}</span>
      <span className="text-sm text-muted-foreground text-center">–</span>
      <input
        type="number"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={handleBlur}
        placeholder="–"
        className="bg-muted rounded px-2 py-1 text-sm outline-none w-full text-center"
      />
      <input
        type="number"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={handleBlur}
        className="bg-muted rounded px-2 py-1 text-sm outline-none w-full text-center"
      />
    </div>
  )
}

interface Props {
  programId: string
  dayId: string
  exerciseId: string
  exerciseName: string
  onBack: () => void
}

export default function ExerciseDetail({ programId, dayId, exerciseId, exerciseName, onBack }: Props) {
  const [sets, setSets] = useState<ProgramExerciseSet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getExerciseDetail(programId, dayId, exerciseId)
      .then((ex) => setSets(ex.sets))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [programId, dayId, exerciseId])

  async function handleAddSet() {
    const last = sets[sets.length - 1]
    try {
      const newSet = await addSet(programId, dayId, exerciseId, {
        reps: last?.reps ?? 10,
        weight_kg: last !== undefined ? last.weight_kg : undefined,
      })
      setSets((prev) => [...prev, newSet])
    } catch (err) {
      console.error("Failed to add set:", err)
    }
  }

  async function handleUpdate(setId: string, reps: number, weight_kg: number | null) {
    try {
      const updated = await updateSet(programId, dayId, exerciseId, setId, { reps, weight_kg })
      setSets((prev) => prev.map((s) => (s.id === setId ? updated : s)))
    } catch (err) {
      console.error("Failed to update set:", err)
    }
  }

  return (
    <div>
      <div className="p-4 border-b flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-lg">←</button>
        <h2 className="font-bold text-lg">{exerciseName}</h2>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm p-4">Laster...</p>
      ) : (
        <div className="px-4 pt-3">
          <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground font-medium pb-2 border-b uppercase tracking-wide">
            <span className="text-center">Set</span>
            <span className="text-center">Forrige</span>
            <span className="text-center">Kg</span>
            <span className="text-center">Reps</span>
          </div>

          {sets.map((s) => (
            <SetRow
              key={s.id}
              set={s}
              onUpdate={(reps, weight_kg) => handleUpdate(s.id, reps, weight_kg)}
            />
          ))}

          {sets.length === 0 && (
            <p className="text-muted-foreground text-sm py-4 text-center">Ingen sett ennå.</p>
          )}

          <button
            onClick={handleAddSet}
            className="mt-4 w-full py-2.5 text-sm text-muted-foreground border border-dashed rounded-lg hover:bg-accent transition-colors"
          >
            + Legg til sett
          </button>
        </div>
      )}
    </div>
  )
}
