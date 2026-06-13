"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (signInError) {
      setError("Feil e-post eller passord")
      setLoading(false)
      return
    }
    router.refresh()
    router.push("/home")
  }

  return (
    <>
      <Divider>eller med e-post</Divider>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="input-row" style={{ borderRadius: "var(--fr-md)" }}>
          <input
            className="field"
            type="email"
            placeholder="E-post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-row" style={{ borderRadius: "var(--fr-md)" }}>
          <input
            className="field"
            type="password"
            placeholder="Passord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-block"
          style={{ marginTop: 4, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Logger inn…" : "Logg inn"}
        </button>
      </form>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 14,
          fontSize: 12,
        }}
      >
        <Link href="/login/forgot-password" className="section-link">
          Glemt passord?
        </Link>
        <Link href="/onboarding" className="section-link">
          Ny bruker?
        </Link>
      </div>
    </>
  )
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        textAlign: "center",
        fontSize: 10,
        color: "var(--brand-muted)",
        margin: "16px 0 12px",
        position: "relative",
        textTransform: "uppercase",
        letterSpacing: 1,
      }}
    >
      <span
        style={{
          position: "relative",
          zIndex: 1,
          background: "var(--brand-canvas)",
          padding: "0 10px",
        }}
      >
        {children}
      </span>
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: 1,
          background: "var(--brand-border)",
          zIndex: 0,
        }}
      />
    </div>
  )
}
