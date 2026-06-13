"use client"
import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import LoginHero from "@/components/login/LoginHero"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login/reset-password`,
    })
    setSent(true)
    setLoading(false)
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
          Glemt passord?
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--brand-muted)",
            textAlign: "center",
            marginBottom: 18,
          }}
        >
          Vi sender deg en lenke for å tilbakestille passordet
        </div>

        {sent ? (
          <div
            style={{
              background: "var(--brand-surface)",
              border: "1px solid var(--brand-border)",
              borderRadius: 14,
              padding: 16,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-ink)" }}>
              Sjekk e-posten din
            </div>
            <div style={{ fontSize: 12, color: "var(--brand-muted)", marginTop: 6 }}>
              Vi har sendt en tilbakestillingslenke til {email}
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <input
              type="email"
              placeholder="E-post"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
              {loading ? "Sender…" : "Send tilbakestillingslenke"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <Link href="/login" style={{ fontSize: 12, color: "var(--brand-muted)" }}>
            ← Tilbake til innlogging
          </Link>
        </div>
      </div>
    </div>
  )
}
