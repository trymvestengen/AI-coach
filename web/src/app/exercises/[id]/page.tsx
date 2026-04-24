import { notFound } from "next/navigation"
import { getExercise } from "@/lib/exercises"
import ExerciseDetail from "@/components/exercises/ExerciseDetail"

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const exercise = getExercise(id)
  if (!exercise) notFound()
  return <ExerciseDetail exercise={exercise} />
}
