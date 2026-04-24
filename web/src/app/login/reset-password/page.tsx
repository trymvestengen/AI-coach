"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
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
          <h1 className="text-white text-2xl font-bold tracking-tight">Nytt passord</h1>
          <p className="text-sm mt-2" style={{ color: "#666" }}>
            Velg et nytt passord for kontoen din
          </p>
        </div>
      </div>

      <div className="rounded-t-3xl px-6 pt-6 pb-8" style={{ background: "#111" }}>
        {!ready ? (
          <p className="text-center text-sm" style={{ color: "#666" }}>
            Verifiserer lenken...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Nytt passord"
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
              {loading ? "Lagrer..." : "Lagre passord"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
