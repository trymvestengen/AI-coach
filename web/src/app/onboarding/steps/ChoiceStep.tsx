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
              style={{
                background: selected ? "var(--brand-subtle)" : "var(--brand-surface)",
                border: `1px solid ${selected ? "var(--brand-orange)" : "var(--brand-border)"}`,
                color: selected ? "var(--brand-orange-deep)" : "var(--brand-ink)",
                borderRadius: 12,
                padding: "13px 16px",
                fontSize: 15,
                fontWeight: 500,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {multi && selected ? "✓ " : ""}
              {opt.label}
              {opt.sub && (
                <span
                  style={{
                    display: "block",
                    fontSize: 12,
                    marginTop: 3,
                    color: "var(--brand-muted)",
                  }}
                >
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
