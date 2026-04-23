import WorkoutLog from "@/components/workout/WorkoutLog"

export default function LogPage() {
  return (
    <div>
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Logg</h1>
        <p className="text-muted-foreground text-sm mt-1">Dine siste treningsøkter</p>
      </div>
      <WorkoutLog />
    </div>
  )
}
