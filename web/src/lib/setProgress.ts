"use client"

function todayKey(programId: string): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const dd = String(now.getDate()).padStart(2, "0")
  return `completedSets-${programId}-${yyyy}${mm}${dd}`
}

export function loadCompletedSets(programId: string): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(todayKey(programId))
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(arr)
  } catch {
    return new Set()
  }
}

export function saveCompletedSets(programId: string, ids: Set<string>): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(todayKey(programId), JSON.stringify([...ids]))
  } catch {
    // ignore quota errors
  }
}
