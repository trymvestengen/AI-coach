"use client"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <button
      onClick={handleLogout}
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
