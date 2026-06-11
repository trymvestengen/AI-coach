"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import LoginHero from "@/components/login/LoginHero"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }
    router.refresh()
    router.push("/home")
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: "var(--brand-canvas)",
        padding: "0 24px 24px",
      }}
    >
      <LoginHero compact />

      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "var(--brand-ink)",
            letterSpacing: "-0.02em",
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          Nytt passord
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--brand-muted)",
            textAlign: "center",
            marginBottom: 18,
          }}
        >
          Velg et nytt passord for kontoen din
        </div>

        {!ready ? (
          <div style={{ textAlign: "center", color: "var(--brand-muted)", fontSize: 13 }}>
            Verifiserer lenken…
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <input
              type="password"
              placeholder="Nytt passord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                background: "var(--brand-surface)",
                border: "1.5px solid var(--brand-border)",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 14,
                color: "var(--brand-ink)",
                outline: "none",
              }}
            />
            {error && <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "var(--brand-orange)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: 13,
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginTop: 4,
              }}
            >
              {loading ? "Lagrer…" : "Lagre passord"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
