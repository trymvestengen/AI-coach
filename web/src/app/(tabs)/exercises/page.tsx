import ExerciseLibrary from "@/components/exercises/ExerciseLibrary"

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ swap?: string }>
}) {
  const params = await searchParams
  const swapSlot = params.swap !== undefined ? parseInt(params.swap, 10) : null
  return <ExerciseLibrary swapSlot={swapSlot} />
}
