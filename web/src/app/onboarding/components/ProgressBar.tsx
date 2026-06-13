interface Props {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: Props) {
  return (
    <div className="flex gap-1 px-6 pt-5">
      {Array.from({ length: total }, (_, i) => {
        const filled = i < current
        return (
          <div
            key={i}
            data-segment
            data-filled={filled}
            className="flex-1 rounded-full transition-colors duration-300"
            style={{
              height: 3,
              background: filled ? "var(--brand-orange)" : "var(--brand-border)",
            }}
          />
        )
      })}
    </div>
  )
}
