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
      <div className="panel-list">
        {options.map((opt) => {
          const selected = value.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              aria-label={opt.label}
              onClick={() => toggle(opt.value)}
              className="list-row"
              style={{
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                ...(selected
                  ? {
                      borderColor: "var(--brand-orange)",
                      background: "var(--accent-soft)",
                    }
                  : {}),
              }}
            >
              <div className="row-main">
                <div className="row-name">{opt.label}</div>
                {opt.sub && <div className="row-meta">{opt.sub}</div>}
              </div>
              {selected && (
                <span
                  className="row-trail"
                  style={{ color: "var(--brand-orange-deep)", fontWeight: 800 }}
                >
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>
    </StepShell>
  )
}
