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
    <div className="flex flex-col h-full" style={{ background: "#0d0d0d" }}>
      {totalSteps != null && totalSteps > 0 && (
        <ProgressBar current={currentStep ?? 0} total={totalSteps} />
      )}

      {onBack && <BackArrow onClick={onBack} />}

      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-white text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-sm" style={{ color: "#666" }}>
              {subtitle}
            </p>
          )}
          {children}
          <button
            type="button"
            onClick={onNext}
            disabled={!canProgress || busy}
            className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40 mt-2"
            style={{ background: "#ff6b35" }}
          >
            {busy ? "Lagrer..." : nextLabel}
          </button>
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="text-sm self-center mt-1"
              style={{ color: "#666" }}
            >
              Hopp over →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
