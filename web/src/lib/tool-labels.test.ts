import { describe, it, expect } from "vitest"
import { TOOL_LABELS, shouldShowPill } from "./tool-labels"

describe("tool-labels", () => {
  it("has labels for all destructive tools", () => {
    const destructive = [
      "delete_program",
      "delete_folder",
      "remove_program_day",
      "remove_exercise_from_day",
      "swap_exercise_in_day",
      "discard_workout",
      "remove_injury",
    ]
    for (const tool of destructive) {
      expect(TOOL_LABELS[tool]).toBeDefined()
    }
  })

  it("returns false for silent read tools", () => {
    expect(shouldShowPill("get_user_profile")).toBe(false)
    expect(shouldShowPill("get_workout_history")).toBe(false)
  })

  it("returns true for write tools with labels", () => {
    expect(shouldShowPill("create_program")).toBe(true)
    expect(shouldShowPill("delete_program")).toBe(true)
  })

  it("returns false for unknown tools", () => {
    expect(shouldShowPill("nonexistent_tool")).toBe(false)
  })
})
