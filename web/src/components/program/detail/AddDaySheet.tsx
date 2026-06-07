"use client"
import { useState } from "react"
import WorkoutTemplateStep from "../wizard/WorkoutTemplateStep"
import WorkoutNameStep from "../wizard/WorkoutNameStep"
import WorkoutScheduleStep from "../wizard/WorkoutScheduleStep"
import { addProgramDay, type DaySchedule, type WorkoutTemplate, type ProgramDay } from "@/lib/api"

interface Props {
  open: boolean
  programId: string
  onClose: () => void
  onAdded: (day: ProgramDay) => void
}

const TEMPLATE_NAME: Record<WorkoutTemplate, string> = {
  custom: "",
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  "full-body": "Full body",
  "upper-body": "Upper body",
}

export default function AddDaySheet({ open, programId, onClose, onAdded }: Props) {
  const [step, setStep] = useState<2 | 3 | 4>(2)
  const [workoutName, setWorkoutName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    setStep(2)
    setWorkoutName("")
    setError(null)
    onClose()
  }

  const handleFinal = async (schedule: DaySchedule) => {
    setSubmitting(true)
    setError(null)
    try {
      const body =
        schedule.kind === "weekdays"
          ? { name: workoutName, weekdays: schedule.weekdays }
          : { name: workoutName, frequency_per_week: schedule.frequency_per_week }
      const day = await addProgramDay(programId, body)
      onAdded(day)
      close()
    } catch {
      setError("Kunne ikke legge til dag. Prøv igjen.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          height: "85vh",
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 18px 24px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            background: "var(--brand-border)",
            borderRadius: 99,
            margin: "0 auto 14px",
          }}
        />
        {step === 2 && (
          <WorkoutTemplateStep
            onSelect={(template) => {
              setWorkoutName(TEMPLATE_NAME[template])
              setStep(3)
            }}
          />
        )}
        {step === 3 && (
          <WorkoutNameStep
            initialName={workoutName}
            onNext={(name) => {
              setWorkoutName(name)
              setStep(4)
            }}
          />
        )}
        {step === 4 && <WorkoutScheduleStep workoutName={workoutName} onNext={handleFinal} />}
        {submitting && (
          <p style={{ textAlign: "center", fontSize: 12, color: "var(--brand-muted)" }}>
            Lagrer...
          </p>
        )}
        {error && <p style={{ textAlign: "center", fontSize: 12, color: "#dc2626" }}>{error}</p>}
      </div>
    </div>
  )
}
