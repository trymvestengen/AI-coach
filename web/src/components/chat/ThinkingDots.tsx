export default function ThinkingDots() {
  return (
    <div role="status" aria-label="Tenker" className="flex gap-1 items-center my-2 ml-2 self-start">
      <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-pulse" />
      <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-pulse [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-pulse [animation-delay:300ms]" />
    </div>
  )
}
