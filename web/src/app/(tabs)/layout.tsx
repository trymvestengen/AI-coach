import BottomNav from "@/components/layout/BottomNav"

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
      <BottomNav />
    </div>
  )
}
