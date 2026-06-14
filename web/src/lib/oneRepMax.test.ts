import { describe, it, expect } from "vitest"
import { epley1rm, bestE1rm } from "./oneRepMax"

describe("oneRepMax", () => {
  it("epley: weight × (1 + reps/30)", () => {
    expect(epley1rm(80, 8)).toBeCloseTo(101.33, 1)
    expect(epley1rm(100, 1)).toBeCloseTo(103.33, 1)
  })
  it("epley: 0 or null weight → 0", () => {
    expect(epley1rm(null, 8)).toBe(0)
    expect(epley1rm(0, 8)).toBe(0)
  })
  it("bestE1rm picks the max across sets", () => {
    expect(
      bestE1rm([
        { reps: 8, weight_kg: 80 },
        { reps: 5, weight_kg: 90 },
      ])
    ).toBeCloseTo(105, 0)
  })
  it("bestE1rm of empty → 0", () => {
    expect(bestE1rm([])).toBe(0)
  })
})
