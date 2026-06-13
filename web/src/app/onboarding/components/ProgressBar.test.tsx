import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import ProgressBar from "./ProgressBar"

describe("ProgressBar", () => {
  it("renders one segment per total step", () => {
    const { container } = render(<ProgressBar current={3} total={10} />)
    expect(container.querySelectorAll("[data-segment]").length).toBe(10)
  })

  it("fills segments up to and including current step", () => {
    const { container } = render(<ProgressBar current={3} total={10} />)
    const filled = container.querySelectorAll("[data-segment][data-filled='true']")
    expect(filled.length).toBe(3)
  })

  it("renders nothing when total is 0", () => {
    const { container } = render(<ProgressBar current={0} total={0} />)
    expect(container.querySelectorAll("[data-segment]").length).toBe(0)
  })
})
