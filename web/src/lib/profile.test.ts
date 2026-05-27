import { describe, it, expect, vi, beforeEach } from "vitest"
import { updateProfile, addInjury, deleteInjury } from "./profile"

describe("profile API client", () => {
  beforeEach(() => {
    global.fetch = vi.fn() as unknown as typeof fetch
  })

  it("updateProfile PATCHes /api/users/profile with body", async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ weight_kg: 76 }),
    })
    await updateProfile("token-123", { weight_kg: 76 })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/users/profile"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ weight_kg: 76 }),
      })
    )
  })

  it("addInjury POSTs /api/users/injuries", async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "i-1" }),
    })
    await addInjury("token-123", { body_part: "kne", severity: "lett" })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/users/injuries"),
      expect.objectContaining({ method: "POST" })
    )
  })

  it("deleteInjury DELETEs /api/users/injuries/{id}", async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: "deleted" }),
    })
    await deleteInjury("token-123", "i-1")
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/users/injuries/i-1"),
      expect.objectContaining({ method: "DELETE" })
    )
  })
})
