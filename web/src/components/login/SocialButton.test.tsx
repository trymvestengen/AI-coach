import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import SocialButton from "./SocialButton"

describe("SocialButton", () => {
  it("renders Google variant with label", () => {
    render(<SocialButton variant="google" onClick={() => {}} />)
    expect(screen.getByText(/Fortsett med Google/i)).toBeInTheDocument()
  })

  it("renders Apple variant with label", () => {
    render(<SocialButton variant="apple" onClick={() => {}} />)
    expect(screen.getByText(/Fortsett med Apple/i)).toBeInTheDocument()
  })

  it("renders Email variant with label", () => {
    render(<SocialButton variant="email" onClick={() => {}} />)
    expect(screen.getByText(/Fortsett med e-post/i)).toBeInTheDocument()
  })

  it("calls onClick when pressed", () => {
    const onClick = vi.fn()
    render(<SocialButton variant="google" onClick={onClick} />)
    fireEvent.click(screen.getByRole("button"))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("disables when busy", () => {
    render(<SocialButton variant="google" onClick={() => {}} busy />)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("shows different label when busy", () => {
    render(<SocialButton variant="google" onClick={() => {}} busy />)
    expect(screen.getByText(/Logger inn…/i)).toBeInTheDocument()
  })
})
