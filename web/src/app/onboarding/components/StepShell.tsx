import ProgressBar from "./ProgressBar"
import BackArrow from "./BackArrow"

interface Props {
  title: string
  subtitle?: string
  children: React.ReactNode
  onBack: (() => void) | null
  onNext: () => void
  canProgress: boolean
  onSkip?: () => void
  currentStep?: number
  totalSteps?: number
  nextLabel?: string
  busy?: boolean
}

export default function StepShell({
  title,
  subtitle,
  children,
  onBack,
  onNext,
  canProgress,
  onSkip,
  currentStep,
  totalSteps,
  nextLabel = "Neste",
  busy,
}: Props) {
  return (
    <div className="flex flex-col h-full" style={{ background: "var(--brand-canvas)" }}>
      {totalSteps != null && totalSteps > 0 && (
        <ProgressBar current={currentStep ?? 0} total={totalSteps} />
      )}

      {onBack && <BackArrow onClick={onBack} />}

      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="flex flex-col gap-3">
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--brand-ink)",
              lineHeight: 1.15,
            }}
          >
            {title}
          </h1>
          {subtitle && <p style={{ fontSize: 14, color: "var(--brand-muted)" }}>{subtitle}</p>}
          {children}
          <button
            type="button"
            onClick={onNext}
            disabled={!canProgress || busy}
            style={{
              marginTop: 8,
              padding: "13px 16px",
              borderRadius: 12,
              border: "none",
              background: "var(--brand-orange)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              cursor: canProgress && !busy ? "pointer" : "default",
              opacity: !canProgress || busy ? 0.4 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {busy ? "Lagrer..." : nextLabel}
          </button>
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              style={{
                background: "none",
                border: "none",
                color: "var(--brand-muted)",
                fontSize: 14,
                fontWeight: 500,
                alignSelf: "center",
                marginTop: 4,
                cursor: "pointer",
              }}
            >
              Hopp over →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
