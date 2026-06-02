"use client"

interface Props {
  firstName: string
  summary: Record<string, string>
  onFinish: () => void
  busy: boolean
}

export default function DoneStep({ firstName, summary, onFinish, busy }: Props) {
  return (
    <div className="flex flex-col h-full" style={{ background: "#0d0d0d" }}>
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h1 className="text-white text-2xl font-bold">Alt klart, {firstName}!</h1>
            <p className="text-sm mt-1" style={{ color: "#666" }}>
              Coachen din er klar.
            </p>
          </div>

          <div
            className="rounded-xl p-4 flex flex-col gap-2 text-sm"
            style={{ background: "#111", border: "1px solid #1e1e1e" }}
          >
            {Object.entries(summary).map(([k, v]) => (
              <div key={k} style={{ color: "#666" }}>
                <span style={{ textTransform: "capitalize" }}>{k}:</span>{" "}
                <span style={{ color: "#aaa" }}>{v}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onFinish}
            disabled={busy}
            className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
            style={{ background: "#ff6b35" }}
          >
            {busy ? "Lagrer..." : "Kom i gang 🚀"}
          </button>
        </div>
      </div>
    </div>
  )
}
