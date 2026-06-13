import { describe, it, expect, beforeEach } from "vitest"
import { saveDraft, loadDraft, clearDraft } from "./wizardStorage"

beforeEach(() => {
  localStorage.clear()
})

describe("wizardStorage", () => {
  it("returns null when no draft exists", () => {
    expect(loadDraft()).toBeNull()
  })

  it("round-trips a draft via save/load", () => {
    saveDraft({ firstName: "T", lastName: "V", email: "x@y.no" })
    const result = loadDraft()
    expect(result).toEqual({ firstName: "T", lastName: "V", email: "x@y.no" })
  })

  it("clearDraft removes the entry", () => {
    saveDraft({ firstName: "T" })
    clearDraft()
    expect(loadDraft()).toBeNull()
  })

  it("returns null when stored JSON is invalid", () => {
    localStorage.setItem("ai-coach.onboarding.draft", "not-json")
    expect(loadDraft()).toBeNull()
  })
})
