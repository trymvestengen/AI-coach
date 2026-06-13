"use client"
import { useEffect, useState } from "react"

// iPhone 16 Pro logiske mål (CSS-px).
const SCREEN_W = 402
const SCREEN_H = 874
const INSET = 16 // titanium-padding (13) + svart bezel (3)
const PHONE_W = SCREEN_W + INSET * 2
const PHONE_H = SCREEN_H + INSET * 2
const GAP = 28

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

function Phone({
  theme,
  path,
  reloadKey,
  scale,
}: {
  theme: "dark" | "light"
  path: string
  reloadKey: number
  scale: number
}) {
  const src = `${path}?theme=${theme}`
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ width: PHONE_W * scale, height: PHONE_H * scale, flex: "none" }}>
        <div
          style={{
            position: "relative",
            width: PHONE_W,
            height: PHONE_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <PhoneButton side="left" top={120} height={26} />
          <PhoneButton side="left" top={172} height={52} />
          <PhoneButton side="left" top={238} height={52} />
          <PhoneButton side="right" top={200} height={86} />

          <div
            style={{
              width: PHONE_W,
              height: PHONE_H,
              padding: 13,
              borderRadius: 60,
              boxSizing: "border-box",
              background:
                "linear-gradient(150deg, #4a4d52 0%, #2a2c30 30%, #17181b 70%, #303338 100%)",
              boxShadow:
                "0 60px 120px -35px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                background: "#000",
                borderRadius: 48,
                padding: 3,
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: SCREEN_W,
                  height: SCREEN_H,
                  borderRadius: 45,
                  overflow: "hidden",
                  background: theme === "dark" ? "#15171a" : "#fafaf7",
                }}
              >
                {/* Dynamic island */}
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 126,
                    height: 33,
                    borderRadius: 17,
                    background: "#000",
                    zIndex: 3,
                    pointerEvents: "none",
                  }}
                />
                <iframe
                  key={`${src}-${reloadKey}`}
                  src={src}
                  title={`App-forhåndsvisning (${theme})`}
                  style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                />
                {/* Home-indikator */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 138,
                    height: 5,
                    borderRadius: 999,
                    background: theme === "dark" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.35)",
                    zIndex: 3,
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <span
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {theme === "dark" ? "Mørk" : "Lys"}
      </span>
    </div>
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
  const [scale, setScale] = useState(0.5)

  useEffect(() => {
    const update = () => {
      const availH = window.innerHeight - 150
      const availW = window.innerWidth - 48
      setScale(Math.min(1, availW / (2 * PHONE_W + GAP), availH / PHONE_H))
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

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
          maxWidth: 620,
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

      {/* To telefoner: mørk + lys */}
      <div style={{ display: "flex", gap: GAP, alignItems: "flex-start", flex: "none" }}>
        <Phone theme="dark" path={path} reloadKey={reloadKey} scale={scale} />
        <Phone theme="light" path={path} reloadKey={reloadKey} scale={scale} />
      </div>

      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, letterSpacing: "0.06em" }}>
        {path} · iPhone 16 Pro · mørk + lys side om side
      </div>
    </div>
  )
}
