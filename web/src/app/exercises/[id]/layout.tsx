export default function ExerciseDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-[390px] h-full bg-background text-foreground shadow-2xl overflow-hidden">
      {children}
    </div>
  )
}
