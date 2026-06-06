import { ReactNode } from "react"

interface Props {
  title: string
  children: ReactNode
}

export default function ProfileSection({ title, children }: Props) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 1.2,
          color: "var(--brand-muted)",
          fontWeight: 600,
          marginBottom: 10,
          paddingLeft: 4,
        }}
      >
        {title}
      </h2>
      <div
        style={{
          background: "var(--brand-surface)",
          border: "1px solid var(--brand-border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </section>
  )
}
