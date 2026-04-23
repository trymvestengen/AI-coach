"use client"

import { useEffect, useState } from "react"
import { getWorkouts, type Workout } from "@/lib/api"

function totalVolume(sets: Workout["sets"]): number {
  return sets.reduce((acc, s) => acc + (s.reps ?? 0) * (s.weight_kg ?? 0), 0)
}

function uniqueExerciseCount(sets: Workout["sets"]): number {
  return new Set(sets.map((s) => s.exercise_id)).size
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("no-NO", {
    weekday: "long",
    day: "numeric",
    month: "short",
  })
}

export default function WorkoutLog() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWorkouts()
      .then(setWorkouts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-muted-foreground text-sm p-4">Laster treningslogg...</p>
  }

  if (workouts.length === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground text-sm">
          Ingen treningsøkter logget enda. Si &quot;logg økten min&quot; til treneren etter trening!
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {workouts.map((w) => {
        const exCount = uniqueExerciseCount(w.sets)
        const vol = totalVolume(w.sets)
        return (
          <div key={w.workout_id} className="bg-card border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm capitalize">{formatDate(w.date)}</p>
                <p className="text-xs text-muted-foreground">
                  {exCount} øvelse{exCount !== 1 ? "r" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{vol.toFixed(0)} kg</p>
                <p className="text-xs text-muted-foreground">totalvolum</p>
              </div>
            </div>
            {w.rpe !== null && (
              <p className="text-xs text-muted-foreground mt-1">RPE {w.rpe}/10</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
