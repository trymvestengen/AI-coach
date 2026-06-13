"use client"
import { useState } from "react"

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  )
  function toggle() {
    const next = !document.documentElement.classList.contains("dark")
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("forge-theme", next ? "dark" : "light")
    setDark(next)
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Bytt tema"
      aria-pressed={dark}
      style={{
        width: 36,
        height: 36,
        borderRadius: 999,
        cursor: "pointer",
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        color: "var(--brand-ink)",
        display: "grid",
        placeItems: "center",
        fontSize: 16,
      }}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  )
}
