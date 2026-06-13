"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import LoginHero from "@/components/login/LoginHero"
import SocialButton from "@/components/login/SocialButton"
import LoginForm from "@/components/login/LoginForm"
import ThemeToggle from "@/components/theme/ThemeToggle"

const APPLE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_APPLE_LOGIN === "true"

export default function LoginPage() {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [busyProvider, setBusyProvider] = useState<"google" | "apple" | null>(null)
  // Les ?error= fra URL-en via en lazy useState-initializer (kjører én gang ved
  // første render — ikke setState under render og ikke setState i en effect).
  const [oauthError, setOauthError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return new URLSearchParams(window.location.search).get("error")
      ? "Innlogging feilet, prøv igjen"
      : null
  })

  // Rydd URL-en så feilen ikke henger ved refresh. Kun navigasjon her (ingen setState).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error")) {
      router.replace("/login")
    }
  }, [router])

  const handleOAuth = async (provider: "google" | "apple") => {
    if (busyProvider) return
    setBusyProvider(provider)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setOauthError("Kunne ikke starte innlogging, prøv igjen")
      setBusyProvider(null)
    }
    // On success, the browser navigates away to the OAuth provider.
  }

  return (
    <div
      className="forge"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: "var(--brand-canvas)",
        padding: "10px 24px 24px",
      }}
    >
      <div className="app-topbar">
        <div className="datebar">
          <span className="tick" />
          Velkommen
        </div>
        <ThemeToggle />
      </div>

      <LoginHero compact={expanded} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          gap: 0,
          marginTop: 24,
        }}
      >
        {APPLE_ENABLED && (
          <SocialButton
            variant="apple"
            onClick={() => handleOAuth("apple")}
            busy={busyProvider === "apple"}
          />
        )}
        <SocialButton
          variant="google"
          onClick={() => handleOAuth("google")}
          busy={busyProvider === "google"}
        />

        {!expanded && (
          <>
            <SocialButton variant="email" onClick={() => setExpanded(true)} />
            <div
              style={{
                textAlign: "center",
                fontSize: 11,
                color: "var(--brand-muted)",
                marginTop: 14,
                lineHeight: 1.5,
              }}
            >
              Ved å fortsette godtar du <span style={{ textDecoration: "underline" }}>vilkår</span>{" "}
              og <span style={{ textDecoration: "underline" }}>personvern</span>
            </div>
          </>
        )}

        {expanded && <LoginForm />}

        {oauthError && (
          <div
            style={{
              color: "var(--danger)",
              fontSize: 12,
              textAlign: "center",
              marginTop: 10,
            }}
          >
            {oauthError}
          </div>
        )}
      </div>
    </div>
  )
}
