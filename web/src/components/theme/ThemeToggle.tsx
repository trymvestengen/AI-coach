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

// Self-contained forge sun/moon toggle (styled inline so it works in any topbar,
// not only inside a `.forge` subtree).
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
        flex: "none",
        width: 34,
        height: 34,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        color: "var(--brand-ink)",
        cursor: "pointer",
      }}
    >
      {dark ? (
        <svg
          viewBox="0 0 24 24"
          width="17"
          height="17"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  )
}
