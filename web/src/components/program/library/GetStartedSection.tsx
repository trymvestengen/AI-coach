"use client"

export type GetStartedState =
  | { kind: "empty" }
  | { kind: "no-active"; programCount: number }
  | { kind: "has-active" }

interface Props {
  state: GetStartedState
  onCreateProgram: () => void
  onPickActive: () => void
}

export default function GetStartedSection({ state, onCreateProgram, onPickActive }: Props) {
  if (state.kind === "empty") {
    return (
      <Card>
        <Label>Kom i gang</Label>
        <Title>Lag ditt første program</Title>
        <Meta>Snakk med coachen, velg en mal, eller bygg selv.</Meta>
        <PrimaryButton onClick={onCreateProgram}>Lag program</PrimaryButton>
      </Card>
    )
  }

  if (state.kind === "no-active") {
    return (
      <Card>
        <Label>
          Du har {state.programCount} {state.programCount === 1 ? "program" : "programmer"}
        </Label>
        <Title>Ingen er aktiv akkurat nå</Title>
        <Meta>Velg ett for å se dagens økt her.</Meta>
        <PrimaryButton onClick={onPickActive}>Velg aktivt program</PrimaryButton>
      </Card>
    )
  }

  // has-active — muted secondary CTA for adding more programs
  return (
    <Card subtle>
      <Label>Nytt program</Label>
      <Title small>Lag et nytt program</Title>
      <Meta>Snakk med coachen, velg en mal, eller bygg selv.</Meta>
      <SecondaryButton onClick={onCreateProgram}>Lag program</SecondaryButton>
    </Card>
  )
}

/* ── Sub-components ─────────────────────────────────────── */

function Card({ children, subtle }: { children: React.ReactNode; subtle?: boolean }) {
  return (
    <div
      style={{
        background: "var(--brand-surface)",
        border: subtle ? "1px solid var(--brand-border)" : "1px dashed var(--brand-border)",
        borderRadius: 16,
        padding: "14px 16px",
        marginBottom: 18,
        color: "var(--brand-ink)",
      }}
    >
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        letterSpacing: 1,
        textTransform: "uppercase",
        fontWeight: 600,
        color: "var(--brand-muted)",
      }}
    >
      {children}
    </div>
  )
}

function Title({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <div
      style={{
        fontSize: small ? 15 : 17,
        fontWeight: 700,
        margin: "4px 0 2px",
        letterSpacing: "-0.02em",
      }}
    >
      {children}
    </div>
  )
}

function Meta({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: "var(--brand-muted)", marginBottom: 10 }}>{children}</div>
  )
}

function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "var(--brand-orange)",
        color: "#fff",
        border: "none",
        borderRadius: 999,
        padding: "8px 14px",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  )
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "var(--brand-subtle)",
        color: "var(--brand-orange)",
        border: "none",
        borderRadius: 999,
        padding: "8px 14px",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  )
}
