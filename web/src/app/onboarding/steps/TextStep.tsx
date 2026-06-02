"use client"
import StepShell from "../components/StepShell"

interface Props {
  title: string
  subtitle?: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  onNext: () => void
  onBack: (() => void) | null
  validate: (v: string) => boolean
  type?: "text" | "email" | "password"
  multiline?: boolean
  currentStep?: number
  totalSteps?: number
  onSkip?: () => void
  nextLabel?: string
  busy?: boolean
}

export default function TextStep({
  title,
  subtitle,
  placeholder,
  value,
  onChange,
  onNext,
  onBack,
  validate,
  type = "text",
  multiline,
  currentStep,
  totalSteps,
  onSkip,
  nextLabel,
  busy,
}: Props) {
  const canProgress = validate(value)

  return (
    <StepShell
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      onNext={onNext}
      canProgress={canProgress}
      onSkip={onSkip}
      currentStep={currentStep}
      totalSteps={totalSteps}
      nextLabel={nextLabel}
      busy={busy}
    >
      {multiline ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          rows={4}
          className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none resize-none"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        />
      )}
    </StepShell>
  )
}
