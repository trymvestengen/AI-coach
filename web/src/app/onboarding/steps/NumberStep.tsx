"use client"
import StepShell from "../components/StepShell"

interface Props {
  title: string
  subtitle?: string
  unit: string
  value: number | null
  onChange: (v: number | null) => void
  onNext: () => void
  onBack: (() => void) | null
  min: number
  max: number
  placeholder?: string
  currentStep?: number
  totalSteps?: number
  busy?: boolean
}

export default function NumberStep({
  title,
  subtitle,
  unit,
  value,
  onChange,
  onNext,
  onBack,
  min,
  max,
  placeholder,
  currentStep,
  totalSteps,
  busy,
}: Props) {
  const canProgress = value !== null && value >= min && value <= max

  const handleChange = (raw: string) => {
    if (raw === "") {
      onChange(null)
      return
    }
    const parsed = Number(raw)
    if (Number.isFinite(parsed)) onChange(parsed)
  }

  return (
    <StepShell
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      onNext={onNext}
      canProgress={canProgress}
      currentStep={currentStep}
      totalSteps={totalSteps}
      busy={busy}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "var(--brand-surface)",
          border: "1px solid var(--brand-border)",
          borderRadius: 12,
        }}
      >
        <input
          type="number"
          inputMode="numeric"
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) => handleChange(e.target.value)}
          autoFocus
          min={min}
          max={max}
          style={{
            flex: 1,
            padding: "13px 14px",
            fontSize: 16,
            color: "var(--brand-ink)",
            background: "transparent",
            border: "none",
            outline: "none",
          }}
        />
        <span style={{ paddingRight: 14, fontSize: 13, color: "var(--brand-muted)" }}>{unit}</span>
      </div>
    </StepShell>
  )
}
