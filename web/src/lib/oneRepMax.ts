export function epley1rm(
  weightKg: number | null | undefined,
  reps: number | null | undefined
): number {
  if (!weightKg || weightKg <= 0 || !reps || reps <= 0) return 0
  return weightKg * (1 + reps / 30)
}

export function bestE1rm(sets: { reps: number | null; weight_kg: number | null }[]): number {
  return sets.reduce((max, s) => Math.max(max, epley1rm(s.weight_kg, s.reps)), 0)
}
