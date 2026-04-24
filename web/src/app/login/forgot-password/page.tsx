"use client"
import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/login/reset-password",
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#0d0d0d" }}>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: "linear-gradient(135deg, #ff6b35, #c94a1a)" }}
        >
          💪
        </div>
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold tracking-tight">Glemt passord?</h1>
          <p className="text-sm mt-2" style={{ color: "#666" }}>
            Vi sender deg en lenke for å tilbakestille passordet
          </p>
        </div>
      </div>

      <div className="rounded-t-3xl px-6 pt-6 pb-8" style={{ background: "#111" }}>
        {sent ? (
          <div className="text-center py-4">
            <p className="text-white font-semibold">Sjekk e-posten din</p>
            <p className="text-sm mt-2" style={{ color: "#666" }}>
              Vi har sendt en tilbakestillingslenke til {email}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="E-post"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50 mt-1"
              style={{ background: "var(--ai-accent)" }}
            >
              {loading ? "Sender..." : "Send tilbakestillingslenke"}
            </button>
          </form>
        )}
        <div className="mt-4 text-center">
          <Link href="/login" className="text-xs" style={{ color: "#666" }}>
            ← Tilbake til innlogging
          </Link>
        </div>
      </div>
    </div>
  )
}
