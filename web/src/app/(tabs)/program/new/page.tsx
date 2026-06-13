"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import WizardLayout from "@/components/program/wizard/WizardLayout"
import ProgramNameStep from "@/components/program/wizard/ProgramNameStep"
import WorkoutTemplateStep from "@/components/program/wizard/WorkoutTemplateStep"
import WorkoutNameStep from "@/components/program/wizard/WorkoutNameStep"
import WorkoutScheduleStep from "@/components/program/wizard/WorkoutScheduleStep"
import { createProgram, type DaySchedule, type WorkoutTemplate } from "@/lib/api"

const TEMPLATE_NAME: Record<WorkoutTemplate, string> = {
  custom: "",
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  "full-body": "Full body",
  "upper-body": "Upper body",
}

type Step = 1 | 2 | 3 | 4

export default function NewProgramWizardPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [programName, setProgramName] = useState("")
  const [_workoutTemplate, setWorkoutTemplate] = useState<WorkoutTemplate | null>(null)
  const [workoutName, setWorkoutName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const progress = step * 25

  const goBack = () => {
    if (step === 1) {
      router.push("/program")
    } else {
      setStep((s) => (s - 1) as Step)
    }
  }

  const submitFinal = async (schedule: DaySchedule) => {
    setSubmitting(true)
    setError(null)
    try {
      const body =
        schedule.kind === "weekdays"
          ? { name: workoutName, weekdays: schedule.weekdays }
          : { name: workoutName, frequency_per_week: schedule.frequency_per_week }
      const program = await createProgram({ name: programName, first_day: body })
      router.replace(`/program/${program.id}`)
    } catch {
      setError("Kunne ikke lage program. Prøv igjen.")
      setSubmitting(false)
    }
  }

  return (
    <WizardLayout progressPercent={progress} onBack={goBack}>
      {step === 1 && (
        <ProgramNameStep
          initialName={programName}
          onNext={(name) => {
            setProgramName(name)
            setStep(2)
          }}
        />
      )}
      {step === 2 && (
        <WorkoutTemplateStep
          onSelect={(template) => {
            setWorkoutTemplate(template)
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
      {step === 4 && <WorkoutScheduleStep workoutName={workoutName} onNext={submitFinal} />}
      {submitting && (
        <p
          style={{
            position: "fixed",
            bottom: 80,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 12,
            color: "var(--brand-muted)",
          }}
        >
          Lager program...
        </p>
      )}
      {error && (
        <p
          style={{
            position: "fixed",
            bottom: 80,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 12,
            color: "#dc2626",
          }}
        >
          {error}
        </p>
      )}
    </WizardLayout>
  )
}
