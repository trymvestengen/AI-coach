import ExerciseLibrary from "@/components/exercises/ExerciseLibrary"

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ swap?: string }>
}) {
  const params = await searchParams
  const parsed = params.swap !== undefined ? parseInt(params.swap, 10) : null
  const swapSlot = parsed !== null && !isNaN(parsed) ? parsed : null
  return <ExerciseLibrary swapSlot={swapSlot} />
}
