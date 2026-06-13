export default function ThinkingDots() {
  return (
    <div role="status" aria-label="Tenker" className="flex gap-1 items-center my-2 ml-2 self-start">
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: "var(--brand-faint)" }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse [animation-delay:150ms]"
        style={{ background: "var(--brand-faint)" }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse [animation-delay:300ms]"
        style={{ background: "var(--brand-faint)" }}
      />
    </div>
  )
}
