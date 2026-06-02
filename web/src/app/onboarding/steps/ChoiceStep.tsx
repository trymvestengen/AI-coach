"use client"
import StepShell from "../components/StepShell"

interface Option {
  value: string
  label: string
  sub?: string
}

interface Props {
  title: string
  subtitle?: string
  options: Option[]
  value: string[]
  onChange: (v: string[]) => void
  onNext: () => void
  onBack: (() => void) | null
  multi?: boolean
  currentStep?: number
  totalSteps?: number
  busy?: boolean
}

export default function ChoiceStep({
  title,
  subtitle,
  options,
  value,
  onChange,
  onNext,
  onBack,
  multi,
  currentStep,
  totalSteps,
  busy,
}: Props) {
  const toggle = (v: string) => {
    if (multi) {
      onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
    } else {
      onChange([v])
    }
  }

  return (
    <StepShell
      title={title}
      subtitle={subtitle ?? (multi ? "Velg ett eller flere" : undefined)}
      onBack={onBack}
      onNext={onNext}
      canProgress={value.length > 0}
      currentStep={currentStep}
      totalSteps={totalSteps}
      busy={busy}
    >
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const selected = value.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              aria-label={opt.label}
              onClick={() => toggle(opt.value)}
              className="rounded-xl px-4 py-3 text-sm text-left font-medium"
              style={{
                background: "#1a1a1a",
                border: `1px solid ${selected ? "#ff6b35" : "#2a2a2a"}`,
                color: selected ? "#ff6b35" : "#aaa",
              }}
            >
              {multi && selected ? "✓ " : ""}
              {opt.label}
              {opt.sub && (
                <span className="block text-xs mt-1" style={{ color: "#666" }}>
                  {opt.sub}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </StepShell>
  )
}
