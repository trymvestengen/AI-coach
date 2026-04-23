import ProgramList from "@/components/program/ProgramList"

export default function ProgramPage() {
  return (
    <div>
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Program</h1>
        <p className="text-muted-foreground text-sm mt-1">Dine treningsprogrammer</p>
      </div>
      <ProgramList />
    </div>
  )
}
