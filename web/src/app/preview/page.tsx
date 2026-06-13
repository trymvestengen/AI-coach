"use client"
import { useState } from "react"

// Dev-verktøy: viser appen i en flytende telefon-ramme (bezel + notch) på en
// nøytral scene, via iframe. Ligger utenfor (tabs)-layouten og bryter ut av
// root-layoutens 390px-container med position:fixed.

function PhoneButton({
  side,
  top,
  height,
}: {
  side: "left" | "right"
  top: number
  height: number
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top,
        height,
        width: 4,
        zIndex: 1,
        background: "linear-gradient(90deg, #17181b, #3a3d42)",
        borderRadius: side === "left" ? "3px 0 0 3px" : "0 3px 3px 0",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)",
        ...(side === "left" ? { left: -3 } : { right: -3 }),
      }}
    />
  )
}

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

      {/* Flytende iPhone */}
      <div style={{ position: "relative", flex: "none" }}>
        {/* Side-knapper (titanium) */}
        {/* venstre: handlingsknapp + volum opp/ned */}
        <PhoneButton side="left" top={118} height={26} />
        <PhoneButton side="left" top={170} height={50} />
        <PhoneButton side="left" top={234} height={50} />
        {/* høyre: power */}
        <PhoneButton side="right" top={196} height={82} />

        {/* Titanium-ramme */}
        <div
          style={{
            width: 390 + 28,
            padding: 14,
            borderRadius: 62,
            background:
              "linear-gradient(150deg, #4a4d52 0%, #2a2c30 30%, #17181b 70%, #303338 100%)",
            boxShadow:
              "0 60px 120px -35px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.5)",
          }}
        >
          {/* Indre svart bezel-ring */}
          <div style={{ background: "#000", borderRadius: 50, padding: 3 }}>
            {/* Skjerm */}
            <div
              style={{
                position: "relative",
                width: 390,
                height: "min(844px, calc(100vh - 140px))",
                borderRadius: 47,
                overflow: "hidden",
                background: "#15171a",
              }}
            >
              {/* Dynamic island */}
              <div
                style={{
                  position: "absolute",
                  top: 11,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 120,
                  height: 31,
                  borderRadius: 16,
                  background: "#000",
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
              {/* Home-indikator */}
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 134,
                  height: 5,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.55)",
                  zIndex: 3,
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, letterSpacing: "0.06em" }}>
        {path} · bruk tema-bryteren inne i appen for lys/mørk
      </div>
    </div>
  )
}
