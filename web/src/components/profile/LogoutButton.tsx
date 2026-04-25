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
        border: "1px solid #3a1a1a",
        borderRadius: "10px",
        padding: "14px",
        color: "#ff4444",
        fontSize: "15px",
        cursor: "pointer",
      }}
    >
      Logg ut
    </button>
  )
}
