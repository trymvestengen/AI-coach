import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import HomeScreen from "./HomeScreen"
import * as api from "@/lib/api"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}))

vi.mock("@/lib/api", () => ({
  startWorkoutFromTemplate: vi.fn(),
}))

const base = {
  firstName: "Trym",
  streak: 3,
  workoutsThisWeek: 2,
  weeklyVolumeT: 4.2,
  nextWorkout: null,
  inProgress: null,
  recentWorkouts: [],
}

describe("HomeScreen", () => {
  beforeEach(() => vi.clearAllMocks())

  it("greets the user by first name", () => {
    render(<HomeScreen {...base} />)
    expect(screen.getByText(/Hei, Trym/)).toBeInTheDocument()
  })

  it("shows the coach's next workout in the hero and starts it", async () => {
    vi.mocked(api.startWorkoutFromTemplate).mockResolvedValue({
      workout_id: "w-1",
      template_id: "t-7",
    })
    render(
      <HomeScreen
        {...base}
        nextWorkout={{ template_id: "t-7", name: "Pull A", reason: "basert på i går" }}
      />
    )
    expect(screen.getByText("Pull A")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Start økt/i }))
    await waitFor(() => expect(api.startWorkoutFromTemplate).toHaveBeenCalledWith("t-7"))
    expect(mockPush).toHaveBeenCalledWith("/program/workout/w-1")
  })

  it("navigates to the workout-run route from the in-progress banner", () => {
    render(
      <HomeScreen
        {...base}
        inProgress={{ workout_id: "w-9", day_name: "Push A", sets_logged: 4 }}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /Fortsett/i }))
    expect(mockPush).toHaveBeenCalledWith("/program/workout/w-9")
  })

  it("does not render placeholder mock friends", () => {
    render(<HomeScreen {...base} />)
    expect(screen.queryByText(/Jonas B\./)).not.toBeInTheDocument()
    expect(screen.queryByText(/Folk du kanskje vil følge/i)).not.toBeInTheDocument()
  })
})
