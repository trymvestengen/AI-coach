import { describe, it, expect, vi } from "vitest"

// Root page calls Next.js `redirect()`, which throws in test context.
// We mock it to assert intent without crashing.
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}))

import { redirect } from "next/navigation"
import Root from "./page"

describe("Root page", () => {
  it("redirects to /home", () => {
    Root()
    expect(redirect).toHaveBeenCalledWith("/home")
  })
})
