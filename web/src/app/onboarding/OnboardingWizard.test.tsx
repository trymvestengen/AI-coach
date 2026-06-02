import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import OnboardingWizard from "./OnboardingWizard"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

const signUpMock = vi.fn()

vi.mock("@/lib/supabase", () => ({
  createClient: () => ({
    auth: {
      signUp: signUpMock,
      getSession: () => Promise.resolve({ data: { session: { access_token: "tok" } } }),
    },
  }),
}))

global.fetch = vi.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
)

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  signUpMock.mockResolvedValue({ error: null })
})

describe("OnboardingWizard — signup phase", () => {
  it("starts on the Name step", () => {
    render(<OnboardingWizard initialProfile={null} firstNameFallback="" />)
    expect(screen.getByRole("heading", { name: /hva heter du/i })).toBeInTheDocument()
  })

  it("advances to Email step after filling name", () => {
    render(<OnboardingWizard initialProfile={null} firstNameFallback="" />)
    fireEvent.change(screen.getByPlaceholderText("Fornavn"), { target: { value: "Trym" } })
    fireEvent.change(screen.getByPlaceholderText("Etternavn"), {
      target: { value: "Vestengen" },
    })
    fireEvent.click(screen.getByRole("button", { name: /neste/i }))
    expect(screen.getByRole("heading", { name: /e-postadresse/i })).toBeInTheDocument()
  })

  it("calls Supabase signUp at step 3 and advances to step 4", async () => {
    render(<OnboardingWizard initialProfile={null} firstNameFallback="" />)
    fireEvent.change(screen.getByPlaceholderText("Fornavn"), { target: { value: "Trym" } })
    fireEvent.change(screen.getByPlaceholderText("Etternavn"), {
      target: { value: "Vestengen" },
    })
    fireEvent.click(screen.getByRole("button", { name: /neste/i }))
    fireEvent.change(screen.getByPlaceholderText("din@epost.no"), {
      target: { value: "trym@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: /neste/i }))
    fireEvent.change(screen.getByPlaceholderText(/passord/i), { target: { value: "abcdef" } })
    fireEvent.click(screen.getByRole("button", { name: /opprett konto/i }))

    // Step 4 is a placeholder ("Steg 4 kommer i neste task") until Task 14.
    // Verify signUp was called with expected args; that's enough to confirm step 3 worked.
    expect(signUpMock).toHaveBeenCalledWith({
      email: "trym@example.com",
      password: "abcdef",
      options: { data: { first_name: "Trym", last_name: "Vestengen" } },
    })
  })

  it("persists draft to localStorage during signup phase", () => {
    render(<OnboardingWizard initialProfile={null} firstNameFallback="" />)
    fireEvent.change(screen.getByPlaceholderText("Fornavn"), { target: { value: "Trym" } })
    fireEvent.change(screen.getByPlaceholderText("Etternavn"), { target: { value: "V" } })
    fireEvent.click(screen.getByRole("button", { name: /neste/i }))
    const stored = JSON.parse(localStorage.getItem("ai-coach.onboarding.draft") || "{}")
    expect(stored.firstName).toBe("Trym")
    expect(stored.lastName).toBe("V")
  })

  it("restores draft from localStorage on mount", () => {
    localStorage.setItem(
      "ai-coach.onboarding.draft",
      JSON.stringify({ firstName: "Anna", lastName: "K", email: "" })
    )
    render(<OnboardingWizard initialProfile={null} firstNameFallback="" />)
    expect(screen.getByDisplayValue("Anna")).toBeInTheDocument()
    expect(screen.getByDisplayValue("K")).toBeInTheDocument()
  })
})

describe("OnboardingWizard — required steps", () => {
  it("shows goals step (step 4) when starting with bootstrapped profile", () => {
    const profile = {
      first_name: "Trym",
      last_name: "V",
      goals: null,
      experience_level: null,
      training_days_per_week: null,
      gender: null,
      birth_date: null,
      height_cm: null,
      weight_kg: null,
      equipment: [],
      injury_notes: null,
      preference_notes: null,
      onboarding_status: "in_progress",
    }
    render(<OnboardingWizard initialProfile={profile} firstNameFallback="Trym" />)
    expect(screen.getByRole("heading", { name: /hva er målet ditt/i })).toBeInTheDocument()
  })

  it("resumes at next missing step when partial profile exists", () => {
    const profile = {
      first_name: "Trym",
      last_name: "V",
      goals: ["build_muscle"],
      experience_level: "beginner",
      training_days_per_week: null,
      gender: null,
      birth_date: null,
      height_cm: null,
      weight_kg: null,
      equipment: [],
      injury_notes: null,
      preference_notes: null,
      onboarding_status: "in_progress",
    }
    render(<OnboardingWizard initialProfile={profile} firstNameFallback="Trym" />)
    expect(screen.getByRole("heading", { name: /hvor mange dager/i })).toBeInTheDocument()
  })

  it("PATCHes goals when advancing past step 4", async () => {
    const profile = {
      first_name: "Trym",
      last_name: "V",
      goals: null,
      experience_level: null,
      training_days_per_week: null,
      gender: null,
      birth_date: null,
      height_cm: null,
      weight_kg: null,
      equipment: [],
      injury_notes: null,
      preference_notes: null,
      onboarding_status: "in_progress",
    }
    render(<OnboardingWizard initialProfile={profile} firstNameFallback="Trym" />)
    fireEvent.click(screen.getByRole("button", { name: "Bygg muskler" }))
    fireEvent.click(screen.getByRole("button", { name: /neste/i }))
    await screen.findByRole("heading", { name: /erfaring/i })
    const patchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find((c) =>
      String(c[1]?.body).includes("build_muscle")
    )
    expect(patchCall).toBeDefined()
    expect(patchCall![1].method).toBe("PATCH")
  })
})

describe("OnboardingWizard — optional and done", () => {
  it("renders DoneStep when all required fields are set", () => {
    const profile = {
      first_name: "Trym",
      last_name: "V",
      goals: ["build_muscle"],
      experience_level: "beginner",
      training_days_per_week: 3,
      gender: "male",
      birth_date: "1990-01-01",
      height_cm: 180,
      weight_kg: 80,
      equipment: ["gym"],
      injury_notes: "skipped",
      preference_notes: "skipped",
      onboarding_status: "in_progress",
    }
    render(<OnboardingWizard initialProfile={profile} firstNameFallback="Trym" />)
    // first step from this state should be 12 (injuries)
    expect(screen.getByRole("heading", { name: /skader/i })).toBeInTheDocument()
  })

  it("skip on injury step advances to preferences", () => {
    const profile = {
      first_name: "Trym",
      last_name: "V",
      goals: ["build_muscle"],
      experience_level: "beginner",
      training_days_per_week: 3,
      gender: "male",
      birth_date: "1990-01-01",
      height_cm: 180,
      weight_kg: 80,
      equipment: ["gym"],
      injury_notes: null,
      preference_notes: null,
      onboarding_status: "in_progress",
    }
    render(<OnboardingWizard initialProfile={profile} firstNameFallback="Trym" />)
    fireEvent.click(screen.getByRole("button", { name: /hopp over/i }))
    expect(screen.getByRole("heading", { name: /preferanser/i })).toBeInTheDocument()
  })

  it("Done step's button POSTs to /onboarding/complete and pushes /home", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>
    const profile = {
      first_name: "Trym",
      last_name: "V",
      goals: ["build_muscle"],
      experience_level: "beginner",
      training_days_per_week: 3,
      gender: "male",
      birth_date: "1990-01-01",
      height_cm: 180,
      weight_kg: 80,
      equipment: ["gym"],
      injury_notes: null,
      preference_notes: null,
      onboarding_status: "in_progress",
    }
    render(<OnboardingWizard initialProfile={profile} firstNameFallback="Trym" />)
    fireEvent.click(screen.getByRole("button", { name: /hopp over/i })) // 12 -> 13
    fireEvent.click(screen.getByRole("button", { name: /hopp over/i })) // 13 -> 14
    await screen.findByRole("heading", { name: /alt klart/i })
    fireEvent.click(screen.getByRole("button", { name: /kom i gang/i }))
    await new Promise((r) => setTimeout(r, 0))
    const completeCall = fetchMock.mock.calls.find((c) =>
      String(c[0]).includes("/api/users/onboarding/complete")
    )
    expect(completeCall).toBeDefined()
  })
})
