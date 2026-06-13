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
        <input
          type="email"
          placeholder="E-post"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Passord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
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
            padding: "13px",
            fontSize: 14,
            fontWeight: 700,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
            marginTop: 4,
          }}
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
        <Link href="/login/forgot-password" style={{ color: "var(--brand-muted)" }}>
          Glemt passord?
        </Link>
        <Link href="/onboarding" style={{ color: "var(--brand-muted)" }}>
          Ny bruker?
        </Link>
      </div>
    </>
  )
}

const inputStyle: React.CSSProperties = {
  background: "var(--brand-surface)",
  border: "1.5px solid var(--brand-border)",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 14,
  color: "var(--brand-ink)",
  outline: "none",
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
