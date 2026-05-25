"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError("Feil e-post eller passord")
      setLoading(false)
      return
    }
    router.refresh()
    router.push("/home")
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
          <h1 className="text-white text-3xl font-bold tracking-tight">AI Coach</h1>
          <p
            className="text-xs font-semibold uppercase tracking-widest mt-1"
            style={{ color: "var(--ai-accent)" }}
          >
            Din personlige trener — preview test
          </p>
        </div>
        <p
          className="text-sm text-center leading-relaxed mt-1"
          style={{ color: "#555", maxWidth: 200 }}
        >
          Logg treninger, følg progresjon og få personlig coaching
        </p>
      </div>

      <div className="rounded-t-3xl px-6 pt-6 pb-8" style={{ background: "#111" }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="E-post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
            style={{
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
            }}
          />
          <input
            type="password"
            placeholder="Passord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
            style={{
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
            }}
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50 mt-1"
            style={{ background: "var(--ai-accent)" }}
          >
            {loading ? "Logger inn..." : "Logg inn"}
          </button>
        </form>
        <div className="flex justify-between mt-4">
          <Link href="/login/forgot-password" className="text-xs" style={{ color: "#666" }}>
            Glemt passord?
          </Link>
          <Link href="/onboarding" className="text-xs" style={{ color: "#666" }}>
            Ny bruker?
          </Link>
        </div>
      </div>
    </div>
  )
}
