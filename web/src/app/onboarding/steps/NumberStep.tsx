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
        className="flex items-center rounded-xl"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
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
          className="flex-1 px-4 py-3 text-sm text-white bg-transparent outline-none"
        />
        <span className="pr-3 text-xs" style={{ color: "#666" }}>
          {unit}
        </span>
      </div>
    </StepShell>
  )
}
