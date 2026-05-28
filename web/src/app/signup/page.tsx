"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

export default function SignupPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    })
    setLoading(false)
    if (signUpError) {
      setError(signUpError.message)
      return
    }
    router.push("/onboarding")
  }

  return (
    <div
      className="flex flex-col items-center justify-center h-full px-6"
      style={{ background: "#0d0d0d" }}
    >
      <form onSubmit={handleSignUp} className="w-full max-w-sm flex flex-col gap-3">
        <h1 className="text-white text-2xl font-bold mb-2">Opprett konto</h1>
        <input
          type="text"
          placeholder="Fornavn"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          autoFocus
          className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        />
        <input
          type="text"
          placeholder="Etternavn"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        />
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
          placeholder="Passord (min 6 tegn)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
          style={{ background: "var(--ai-accent, #ff6b35)" }}
        >
          {loading ? "Oppretter konto..." : "Opprett konto"}
        </button>
        <a href="/login" className="text-sm text-center mt-2" style={{ color: "#888" }}>
          Har du allerede konto? Logg inn
        </a>
      </form>
    </div>
  )
}
