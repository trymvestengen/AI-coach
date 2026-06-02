interface Props {
  onClick: () => void
}

export default function BackArrow({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Tilbake"
      className="self-start px-6 pt-3 text-sm"
      style={{ color: "var(--brand-muted)", background: "none", border: "none", cursor: "pointer" }}
    >
      ← Tilbake
    </button>
  )
}
