"use client"
import { useRouter } from "next/navigation"

interface Props {
  programName: string
  isActive: boolean
  subtitle?: string
  onOpenMenu: () => void
}

export default function ProgramDetailHeader({
  programName,
  isActive,
  subtitle,
  onOpenMenu,
}: Props) {
  const router = useRouter()
  return (
    <>
      <button
        type="button"
        onClick={() => router.push("/program")}
        style={{
          background: "none",
          border: "none",
          color: "var(--brand-muted)",
          fontSize: 12,
          padding: 0,
          marginBottom: 8,
          cursor: "pointer",
        }}
      >
        ‹ Bibliotek
      </button>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 6,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--brand-ink)",
              letterSpacing: "-0.02em",
            }}
          >
            {programName}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: "var(--brand-muted)", marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Meny"
          style={{
            background: "none",
            border: "none",
            color: "var(--brand-muted)",
            fontSize: 22,
            cursor: "pointer",
            padding: "0 4px",
          }}
        >
          ⋯
        </button>
      </div>
      {isActive && (
        <span
          style={{
            display: "inline-block",
            background: "var(--brand-subtle)",
            color: "var(--brand-orange-deep)",
            fontSize: 9,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 999,
            letterSpacing: 0.4,
            marginBottom: 14,
          }}
        >
          AKTIV
        </span>
      )}
    </>
  )
}
