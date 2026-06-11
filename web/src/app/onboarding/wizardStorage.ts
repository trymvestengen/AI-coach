const KEY = "ai-coach.onboarding.draft"

export interface Draft {
  firstName?: string
  lastName?: string
  email?: string
  // Password is intentionally NOT persisted (security).
}

export function saveDraft(draft: Draft): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    // Quota or disabled — silently skip.
  }
}

export function loadDraft(): Draft | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as Draft
  } catch {
    return null
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
