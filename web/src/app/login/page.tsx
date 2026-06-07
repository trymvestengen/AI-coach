"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import LoginHero from "@/components/login/LoginHero"
import SocialButton from "@/components/login/SocialButton"
import LoginForm from "@/components/login/LoginForm"

const APPLE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_APPLE_LOGIN === "true"

export default function LoginPage() {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [busyProvider, setBusyProvider] = useState<"google" | "apple" | null>(null)
  const [oauthError, setOauthError] = useState<string | null>(null)

  // Read ?error= from URL for OAuth failures.
  if (typeof window !== "undefined" && oauthError === null) {
    const params = new URLSearchParams(window.location.search)
    const err = params.get("error")
    if (err) {
      setOauthError("Innlogging feilet, prøv igjen")
      // Clean the URL so error doesn't persist on refresh
      router.replace("/login")
    }
  }

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
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: "var(--brand-canvas)",
        padding: "0 24px 24px",
      }}
    >
      <LoginHero compact={expanded} />

      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
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
