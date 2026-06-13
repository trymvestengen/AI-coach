"use client"
import { useSyncExternalStore } from "react"

// Read the active theme straight from the <html> class. useSyncExternalStore
// gives a hydration-safe read of this external (DOM) state: the server snapshot
// is always "light", matching the first client render, then React re-syncs to
// the real value after hydration — no mismatch and no setState-in-effect.
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  return () => observer.disconnect()
}
function getSnapshot() {
  return document.documentElement.classList.contains("dark")
}
function getServerSnapshot() {
  return false
}

export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  function toggle() {
    const next = !document.documentElement.classList.contains("dark")
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("forge-theme", next ? "dark" : "light")
    // The MutationObserver above picks up the class change and re-renders.
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
