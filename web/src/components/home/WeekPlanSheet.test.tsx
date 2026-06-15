import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import WeekPlanSheet from "./WeekPlanSheet"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

const base = {
  open: true,
  templates: [],
  onClose: vi.fn(),
}

describe("WeekPlanSheet", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders nothing when closed", () => {
    const { container } = render(<WeekPlanSheet {...base} open={false} />)
    expect(container.firstChild).toBeNull()
  })

  it("shows all seven weekdays when open", () => {
    render(<WeekPlanSheet {...base} />)
    expect(screen.getByText("Mandag")).toBeInTheDocument()
    expect(screen.getByText("Tirsdag")).toBeInTheDocument()
    expect(screen.getByText("Onsdag")).toBeInTheDocument()
    expect(screen.getByText("Torsdag")).toBeInTheDocument()
    expect(screen.getByText("Fredag")).toBeInTheDocument()
    expect(screen.getByText("Lørdag")).toBeInTheDocument()
    expect(screen.getByText("Søndag")).toBeInTheDocument()
  })

  it("shows 'Ingen planlagt' for days with no templates", () => {
    render(<WeekPlanSheet {...base} />)
    const emptyCells = screen.getAllByText("Ingen planlagt")
    expect(emptyCells.length).toBe(7)
  })

  it("places a template under Mandag and Onsdag when scheduled_days=[1,3]", () => {
    const templates = [{ id: "t-1", name: "Push A", scheduled_days: [1, 3] }]
    render(<WeekPlanSheet {...base} templates={templates} />)

    // Find all day sections by their headings
    const headings = screen.getAllByRole("heading")
    const mandagHeading = headings.find((h) => h.textContent?.includes("Mandag"))
    const tirsdagHeading = headings.find((h) => h.textContent?.includes("Tirsdag"))
    const onsdagHeading = headings.find((h) => h.textContent?.includes("Onsdag"))

    expect(mandagHeading).toBeTruthy()
    expect(tirsdagHeading).toBeTruthy()
    expect(onsdagHeading).toBeTruthy()

    // Template name appears twice (Mandag + Onsdag)
    const templateButtons = screen.getAllByRole("button", { name: "Push A" })
    expect(templateButtons).toHaveLength(2)

    // Only one "Ingen planlagt" for Tirsdag row (5 others have "Ingen planlagt" but Mandag and Onsdag don't)
    // We have 7 days total, 2 with templates → 5 with "Ingen planlagt"
    const emptyCells = screen.getAllByText("Ingen planlagt")
    expect(emptyCells.length).toBe(5)
  })

  it("clicking a template navigates to /program/template/<id> and calls onClose", () => {
    const onClose = vi.fn()
    const templates = [{ id: "t-42", name: "Pull B", scheduled_days: [2] }]
    render(<WeekPlanSheet {...base} templates={templates} onClose={onClose} />)

    const btn = screen.getByRole("button", { name: "Pull B" })
    fireEvent.click(btn)

    expect(mockPush).toHaveBeenCalledWith("/program/template/t-42")
    expect(onClose).toHaveBeenCalled()
  })

  it("clicking the backdrop calls onClose", () => {
    const onClose = vi.fn()
    render(<WeekPlanSheet {...base} onClose={onClose} />)

    // The backdrop is the outermost div — click it directly
    const backdrop = screen.getByTestId("week-plan-backdrop")
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })
})
