"use client"
import WorkoutScheduleStep from "../wizard/WorkoutScheduleStep"
import { updateProgramDay, type DaySchedule } from "@/lib/api"

interface Props {
  open: boolean
  programId: string
  dayId: string
  dayName: string
  onClose: () => void
  onSaved: () => void
}

export default function EditScheduleSheet({
  open,
  programId,
  dayId,
  dayName,
  onClose,
  onSaved,
}: Props) {
  if (!open) return null

  const handleNext = async (schedule: DaySchedule) => {
    try {
      if (schedule.kind === "weekdays") {
        await updateProgramDay(programId, dayId, {
          weekdays: schedule.weekdays,
          frequency_per_week: null,
        })
      } else {
        await updateProgramDay(programId, dayId, {
          weekdays: [],
          frequency_per_week: schedule.frequency_per_week,
        })
      }
      onSaved()
      onClose()
    } catch {
      onClose()
    }
  }

  return (
    <div
      onClick={onClose}
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
          height: "70vh",
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
        <WorkoutScheduleStep workoutName={dayName} onNext={handleNext} />
      </div>
    </div>
  )
}
