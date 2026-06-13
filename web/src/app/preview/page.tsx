"use client"
import { useState } from "react"

// Dev-verktøy: viser appen i en flytende telefon-ramme (bezel + notch) på en
// nøytral scene, via iframe. Ligger utenfor (tabs)-layouten og bryter ut av
// root-layoutens 390px-container med position:fixed.

const ROUTES = [
  { label: "Hjem", path: "/home" },
  { label: "Trening", path: "/program" },
  { label: "Coach", path: "/coach" },
  { label: "Profil", path: "/profile" },
  { label: "Historikk", path: "/historikk" },
  { label: "Øvelser", path: "/exercises" },
  { label: "Kropp", path: "/body" },
  { label: "Login", path: "/login" },
  { label: "Onboarding", path: "/onboarding" },
]

export default function PreviewPage() {
  const [path, setPath] = useState("/home")
  const [reloadKey, setReloadKey] = useState(0)

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "radial-gradient(circle at 50% 25%, #2a2c31 0%, #141519 70%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        padding: "20px 16px",
        overflow: "auto",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      }}
    >
      {/* Rute-velger */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
          maxWidth: 560,
        }}
      >
        {ROUTES.map((r) => {
          const active = r.path === path
          return (
            <button
              key={r.path}
              type="button"
              onClick={() => setPath(r.path)}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                border: active ? "1px solid #f97316" : "1px solid rgba(255,255,255,0.16)",
                background: active ? "#f97316" : "rgba(255,255,255,0.06)",
                color: active ? "#fff" : "rgba(255,255,255,0.82)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {r.label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          title="Last inn på nytt"
          style={{
            padding: "7px 12px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.82)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ↻
        </button>
      </div>

      {/* Flytende telefon */}
      <div
        style={{
          position: "relative",
          width: 390 + 24,
          background: "linear-gradient(155deg, #2b2d31, #0a0b0d)",
          borderRadius: 56,
          padding: 12,
          boxShadow:
            "0 50px 100px -30px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.4), inset 0 0 0 2px rgba(255,255,255,0.04)",
          flex: "none",
        }}
      >
        {/* Skjerm */}
        <div
          style={{
            position: "relative",
            width: 390,
            height: "min(844px, calc(100vh - 130px))",
            borderRadius: 44,
            overflow: "hidden",
            background: "#15171a",
          }}
        >
          {/* Dynamic island / notch */}
          <div
            style={{
              position: "absolute",
              top: 11,
              left: "50%",
              transform: "translateX(-50%)",
              width: 118,
              height: 30,
              borderRadius: 16,
              background: "#050607",
              zIndex: 3,
              pointerEvents: "none",
            }}
          />
          <iframe
            key={`${path}-${reloadKey}`}
            src={path}
            title="App-forhåndsvisning"
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          />
        </div>
      </div>

      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, letterSpacing: "0.06em" }}>
        {path} · bruk tema-bryteren inne i appen for lys/mørk
      </div>
    </div>
  )
}
