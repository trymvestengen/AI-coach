"use client"

import { useEffect, useState } from "react"
import { getExercises, addExerciseToDay, type Exercise } from "@/lib/api"

const MUSCLE_GROUPS: { id: string; label: string }[] = [
  { id: "quads", label: "Ben" },
  { id: "chest", label: "Bryst" },
  { id: "lats", label: "Lats" },
  { id: "back", label: "Rygg" },
  { id: "front_deltoid", label: "Skuldre" },
  { id: "rear_deltoid", label: "Bakskuldre" },
  { id: "biceps", label: "Biceps" },
  { id: "triceps", label: "Triceps" },
  { id: "hamstrings", label: "Hamstrings" },
  { id: "glutes", label: "Glutes" },
]

interface Props {
  programId: string
  dayId: string
  onClose: () => void
  onAdd: () => void
}

export default function ExerciseLibrary({ programId, dayId, onClose, onAdd }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | undefined>()
  const [search, setSearch] = useState("")
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getExercises(filter)
      .then(setExercises)
      .catch((err) => console.error("Failed to fetch exercises:", err))
      .finally(() => setLoading(false))
  }, [filter])

  const visible = search
    ? exercises.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
    : exercises

  async function handleAdd(exerciseId: string) {
    setAddingId(exerciseId)
    try {
      await addExerciseToDay(programId, dayId, { exercise_id: exerciseId })
      onAdd()
    } catch (err) {
      console.error("Failed to add exercise:", err)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div>
      <div className="p-4 border-b flex items-center gap-3">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">←</button>
        <h2 className="font-bold text-lg">Øvelsesbibliotek</h2>
      </div>

      <div className="px-4 pt-3">
        <input
          type="text"
          placeholder="Søk øvelse..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-muted rounded-md px-3 py-2 text-sm outline-none"
        />
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        <button
          onClick={() => setFilter(undefined)}
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            !filter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          Alle
        </button>
        {MUSCLE_GROUPS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(filter === id ? undefined : id)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 px-4 pb-4">
        {loading && <p className="text-muted-foreground text-sm">Laster øvelser...</p>}
        {!loading &&
          visible.map((ex) => (
            <div key={ex.id} className="bg-card border rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{ex.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {ex.muscle_groups.join(", ")} · {ex.difficulty}
                </p>
              </div>
              <button
                onClick={() => handleAdd(ex.id)}
                disabled={addingId === ex.id}
                className="text-primary font-bold text-lg px-2 disabled:opacity-40"
                aria-label={`Legg til ${ex.name}`}
              >
                {addingId === ex.id ? "…" : "+"}
              </button>
            </div>
          ))}
        {!loading && visible.length === 0 && (
          <p className="text-muted-foreground text-sm">Ingen øvelser funnet.</p>
        )}
      </div>
    </div>
  )
}
