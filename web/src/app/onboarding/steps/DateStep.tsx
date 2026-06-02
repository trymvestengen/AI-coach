"use client"
import StepShell from "../components/StepShell"

interface Props {
  title: string
  subtitle?: string
  value: string
  onChange: (v: string) => void
  onNext: () => void
  onBack: (() => void) | null
  currentStep?: number
  totalSteps?: number
  busy?: boolean
}

export default function DateStep({
  title,
  subtitle,
  value,
  onChange,
  onNext,
  onBack,
  currentStep,
  totalSteps,
  busy,
}: Props) {
  const canProgress = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const today = new Date().toISOString().split("T")[0]

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
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={today}
        autoFocus
        className="rounded-xl px-4 py-3 text-sm text-white outline-none"
        style={{
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          colorScheme: "dark",
        }}
      />
    </StepShell>
  )
}
