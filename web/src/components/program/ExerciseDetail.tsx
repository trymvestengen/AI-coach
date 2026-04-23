"use client"

import { useEffect, useRef, useState } from "react"
import { getExerciseDetail, addSet, updateSet, deleteSet, type ProgramExerciseSet } from "@/lib/api"

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
)

interface SetRowProps {
  set: ProgramExerciseSet
  onUpdate: (reps: number, weight_kg: number | null) => void
  onDelete: (setId: string) => void
}

function SetRow({ set, onUpdate, onDelete }: SetRowProps) {
  const [reps, setReps] = useState(String(set.reps))
  const [weight, setWeight] = useState(set.weight_kg != null ? String(set.weight_kg) : "")
  const [offsetX, setOffsetX] = useState(0)
  const [animating, setAnimating] = useState(false)
  const startXRef = useRef(0)
  const touchingRef = useRef(false)

  useEffect(() => {
    setReps(String(set.reps))
    setWeight(set.weight_kg != null ? String(set.weight_kg) : "")
  }, [set.reps, set.weight_kg])

  function handleBlur(e: React.FocusEvent) {
    const row = e.currentTarget.closest("[data-row]")
    if (row?.contains(e.relatedTarget as Node)) return
    const parsed = parseInt(reps, 10)
    const r = Number.isNaN(parsed) || parsed < 1 ? set.reps : parsed
    const parsedW = parseFloat(weight)
    const w = weight !== "" && !Number.isNaN(parsedW) ? parsedW : null
    onUpdate(r, w)
  }

  function handleTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX
    touchingRef.current = true
    setAnimating(false)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!touchingRef.current) return
    const delta = Math.min(0, Math.max(-80, e.touches[0].clientX - startXRef.current))
    setOffsetX(delta)
  }

  function handleTouchEnd() {
    touchingRef.current = false
    setAnimating(true)
    if (offsetX < -60) {
      setOffsetX(-80)
    } else {
      setOffsetX(0)
    }
  }

  return (
    <div className="relative overflow-hidden border-b">
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center">
        <button
          onClick={() => onDelete(set.id)}
          className="text-white flex items-center justify-center w-full h-full"
          aria-label="Slett sett"
        >
          <TrashIcon />
        </button>
      </div>

      <div
        data-row
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: animating ? "transform 0.2s ease" : "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="grid grid-cols-4 gap-2 items-center py-2.5 bg-background relative z-10"
      >
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

  async function handleDelete(setId: string) {
    try {
      await deleteSet(programId, dayId, exerciseId, setId)
      setSets((prev) => prev.filter((s) => s.id !== setId))
    } catch (err) {
      console.error("Failed to delete set:", err)
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
              onDelete={handleDelete}
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
