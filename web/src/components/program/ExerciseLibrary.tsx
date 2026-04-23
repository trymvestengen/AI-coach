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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ sets: "3", reps: "10", weight_kg: "" })
  const [submitting, setSubmitting] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

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

  async function handleAdd(exercise: Exercise) {
    setSubmitting(true)
    try {
      await addExerciseToDay(programId, dayId, {
        exercise_id: exercise.id,
        sets: parseInt(form.sets) || 3,
        reps: parseInt(form.reps) || 10,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined,
      })
      setAddError(null)
      onAdd()
    } catch (err) {
      console.error("Failed to add exercise:", err)
      setAddError("Kunne ikke legge til øvelse. Prøv igjen.")
    } finally {
      setSubmitting(false)
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
            <div key={ex.id} className="bg-card border rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{ex.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {ex.muscle_groups.join(", ")} · {ex.difficulty}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = expandedId === ex.id ? null : ex.id
                    setExpandedId(next)
                    setForm({ sets: "3", reps: "10", weight_kg: "" })
                    if (next === null) { setAddError(null); setSubmitting(false) }
                  }}
                  className="text-primary font-bold text-lg px-2"
                >
                  {expandedId === ex.id ? "−" : "+"}
                </button>
              </div>

              {expandedId === ex.id && (
                <div className="mt-3 pt-3 border-t flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Sett</label>
                      <input
                        type="number"
                        value={form.sets}
                        onChange={(e) => setForm((f) => ({ ...f, sets: e.target.value }))}
                        className="w-full bg-muted rounded px-2 py-1 text-sm outline-none mt-0.5"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Reps</label>
                      <input
                        type="number"
                        value={form.reps}
                        onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))}
                        className="w-full bg-muted rounded px-2 py-1 text-sm outline-none mt-0.5"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Vekt (kg)</label>
                      <input
                        type="number"
                        value={form.weight_kg}
                        onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
                        placeholder="–"
                        className="w-full bg-muted rounded px-2 py-1 text-sm outline-none mt-0.5"
                      />
                    </div>
                  </div>
                  {addError && (
                    <p className="text-xs text-red-500">{addError}</p>
                  )}
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleAdd(ex)}
                      disabled={submitting}
                      className="flex-1 bg-primary text-primary-foreground rounded py-1.5 text-sm font-medium disabled:opacity-50"
                    >
                      {submitting ? "Legger til..." : "Legg til"}
                    </button>
                    <button
                      onClick={() => {
                        setExpandedId(null)
                        setForm({ sets: "3", reps: "10", weight_kg: "" })
                        setSubmitting(false)
                      }}
                      className="text-sm text-muted-foreground px-2"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        {!loading && visible.length === 0 && (
          <p className="text-muted-foreground text-sm">Ingen øvelser funnet.</p>
        )}
      </div>
    </div>
  )
}
