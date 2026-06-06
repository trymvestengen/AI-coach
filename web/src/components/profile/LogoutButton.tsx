"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/login")
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        width: "100%",
        background: "transparent",
        border: "1px solid var(--brand-border)",
        borderRadius: 10,
        padding: 13,
        color: "var(--danger)",
        fontSize: 14,
        fontWeight: 500,
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.5 : 1,
      }}
    >
      {loading ? "Logger ut..." : "Logg ut"}
    </button>
  )
}
