import BottomNav from "@/components/layout/BottomNav"

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      <BottomNav />
    </div>
  )
}
