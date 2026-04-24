"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

export default function RegisterPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
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
          <h1 className="text-white text-2xl font-bold tracking-tight">Opprett konto</h1>
          <p className="text-sm mt-2" style={{ color: "#666" }}>
            Kom i gang med AI Coach
          </p>
        </div>
      </div>

      <div className="rounded-t-3xl px-6 pt-6 pb-8" style={{ background: "#111" }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Fornavn"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            />
            <input
              type="text"
              placeholder="Etternavn"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            />
          </div>
          <input
            type="email"
            placeholder="E-post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
          />
          <input
            type="password"
            placeholder="Passord (minst 6 tegn)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50 mt-1"
            style={{ background: "var(--ai-accent)" }}
          >
            {loading ? "Oppretter konto..." : "Opprett konto"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-xs" style={{ color: "#666" }}>
            Har du allerede en konto? Logg inn
          </Link>
        </div>
      </div>
    </div>
  )
}
