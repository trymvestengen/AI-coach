"use client"
import { useRouter } from "next/navigation"

interface Props {
  open: boolean
  onClose: () => void
}

export default function NewProgramSheet({ open, onClose }: Props) {
  const router = useRouter()
  if (!open) return null

  const handleCoach = () => {
    onClose()
    router.push("/coach?prompt=lag-program")
  }
  const handleTemplate = () => {
    onClose()
    // Maler kommer i egen workstream; placeholder router for nå
    alert("Mal-bibliotek kommer snart")
  }
  const handleScratch = () => {
    onClose()
    alert("Bygg fra scratch kommer snart")
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 20px 28px",
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            background: "var(--brand-border)",
            borderRadius: 999,
            margin: "0 auto 14px",
          }}
        />
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--brand-ink)",
            textAlign: "center",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          Hvor skal vi begynne?
        </div>

        <SheetRow
          icon="💬"
          name="Snakk med coachen"
          meta="Coachen lager et program tilpasset deg"
          onClick={handleCoach}
        />
        <SheetRow
          icon="📋"
          name="Velg en mal"
          meta="PPL, full body, push-pull osv."
          onClick={handleTemplate}
        />
        <SheetRow
          icon="✏️"
          name="Bygg fra scratch"
          meta="Definer dager og øvelser selv"
          onClick={handleScratch}
        />
      </div>
    </div>
  )
}

function SheetRow({
  icon,
  name,
  meta,
  onClick,
}: {
  icon: string
  name: string
  meta: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 8,
        display: "flex",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: "var(--brand-subtle)",
          color: "var(--brand-orange)",
          display: "grid",
          placeItems: "center",
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-ink)" }}>{name}</div>
        <div style={{ fontSize: 11, color: "var(--brand-muted)" }}>{meta}</div>
      </div>
    </button>
  )
}
