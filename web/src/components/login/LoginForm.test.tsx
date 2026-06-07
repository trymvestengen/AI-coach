import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import LoginForm from "./LoginForm"

const mockSignIn = vi.fn()
vi.mock("@/lib/supabase", () => ({
  createClient: () => ({
    auth: { signInWithPassword: mockSignIn },
  }),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}))

describe("LoginForm", () => {
  it("renders email and password fields and submit button", () => {
    render(<LoginForm />)
    expect(screen.getByPlaceholderText(/E-post/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Passord/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Logg inn/i })).toBeInTheDocument()
  })

  it("renders forgot-password and ny-bruker links", () => {
    render(<LoginForm />)
    expect(screen.getByText(/Glemt passord\?/i)).toBeInTheDocument()
    expect(screen.getByText(/Ny bruker\?/i)).toBeInTheDocument()
  })

  it("calls supabase signInWithPassword on submit", async () => {
    mockSignIn.mockResolvedValueOnce({ error: null })
    render(<LoginForm />)
    fireEvent.change(screen.getByPlaceholderText(/E-post/i), {
      target: { value: "trym@example.com" },
    })
    fireEvent.change(screen.getByPlaceholderText(/Passord/i), {
      target: { value: "secret123" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Logg inn/i }))
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "trym@example.com",
        password: "secret123",
      })
    })
  })

  it("shows an error message when sign in fails", async () => {
    mockSignIn.mockResolvedValueOnce({ error: { message: "Invalid credentials" } })
    render(<LoginForm />)
    fireEvent.change(screen.getByPlaceholderText(/E-post/i), {
      target: { value: "wrong@example.com" },
    })
    fireEvent.change(screen.getByPlaceholderText(/Passord/i), {
      target: { value: "bad" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Logg inn/i }))
    await waitFor(() => {
      expect(screen.getByText(/Feil e-post eller passord/i)).toBeInTheDocument()
    })
  })
})
