"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { FullProfile, UserInjury, UserPreference, UserConstraint } from "@/lib/profile"
import {
  updateProfile,
  addInjury,
  updateInjury,
  deleteInjury,
  addPreference,
  updatePreference,
  deletePreference,
  addEquipment,
  deleteEquipment,
  addConstraint,
  updateConstraint,
  deleteConstraint,
} from "@/lib/profile"
import ProfileSection from "@/components/profile/ProfileSection"
import ProfileField from "@/components/profile/ProfileField"
import ProfileList from "@/components/profile/ProfileList"
import LogoutButton from "@/components/profile/LogoutButton"
import EditTextSheet from "@/components/profile/sheets/EditTextSheet"
import EditChoiceSheet from "@/components/profile/sheets/EditChoiceSheet"
import EditMultiSelectSheet from "@/components/profile/sheets/EditMultiSelectSheet"
import EditInjurySheet from "@/components/profile/sheets/EditInjurySheet"
import EditPreferenceSheet from "@/components/profile/sheets/EditPreferenceSheet"
import EditConstraintSheet from "@/components/profile/sheets/EditConstraintSheet"
import EquipmentSheet from "@/components/profile/sheets/EquipmentSheet"

const GOALS = [
  { value: "build_muscle", label: "Bygg muskler" },
  { value: "lose_weight", label: "Gå ned i vekt" },
  { value: "get_stronger", label: "Bli sterkere" },
  { value: "improve_endurance", label: "Bedre kondis" },
  { value: "maintain", label: "Holde formen" },
]
const EXPERIENCE = [
  { value: "beginner", label: "Nybegynner" },
  { value: "intermediate", label: "Middels" },
  { value: "advanced", label: "Erfaren" },
]
const ACTIVITY = [
  { value: "sedentary", label: "Sedentær" },
  { value: "light", label: "Lett aktiv" },
  { value: "moderate", label: "Moderat" },
  { value: "very_active", label: "Svært aktiv" },
]
const TRAINING_TIME = [
  { value: "morning", label: "Morgen" },
  { value: "lunch", label: "Lunsj" },
  { value: "evening", label: "Kveld" },
  { value: "flexible", label: "Fleksibel" },
]
const FREQUENCY_CHOICES = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
  value: String(n),
  label: `${n} dager/uke`,
}))
const SESSION_DURATION = [
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "60 min" },
  { value: "75", label: "75 min" },
  { value: "90", label: "90 min" },
  { value: "0", label: "Ingen grense" },
]

type SheetKey =
  | {
      kind: "text"
      field: keyof FullProfile
      title: string
      unit?: string
      type?: "text" | "number"
    }
  | {
      kind: "choice"
      field: keyof FullProfile
      title: string
      choices: { value: string; label: string }[]
    }
  | { kind: "multi"; field: "goals"; title: string }
  | { kind: "injury"; injury: UserInjury | null }
  | { kind: "preference"; preference: UserPreference | null }
  | { kind: "constraint"; constraint: UserConstraint | null }
  | { kind: "equipment"; mode: "add" | "edit"; item: string | null }
  | null

export default function ProfileClient({
  initialProfile,
  accessToken,
}: {
  initialProfile: FullProfile
  accessToken: string
}) {
  const router = useRouter()
  const [profile] = useState<FullProfile>(initialProfile)
  const [sheet, setSheet] = useState<SheetKey>(null)

  const refresh = () => router.refresh()

  const saveField = async (field: keyof FullProfile, value: unknown) => {
    await updateProfile(accessToken, { [field]: value } as Partial<FullProfile>)
    refresh()
  }

  return (
    <div className="p-5 max-w-md mx-auto">
      <ProfileSection title="Identitet">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xl">
            👤
          </div>
          <div className="flex flex-col">
            <span className="text-white text-sm font-medium">
              {profile.first_name} {profile.last_name}
            </span>
            <span className="text-neutral-500 text-xs">{profile.email}</span>
          </div>
        </div>
      </ProfileSection>

      <ProfileSection title="Kropp">
        <ProfileField
          label="Vekt"
          value={profile.weight_kg ? `${profile.weight_kg} kg` : "—"}
          onClick={() =>
            setSheet({
              kind: "text",
              field: "weight_kg",
              title: "Vekt",
              unit: "kg",
              type: "number",
            })
          }
        />
        <ProfileField
          label="Høyde"
          value={profile.height_cm ? `${profile.height_cm} cm` : "—"}
          onClick={() =>
            setSheet({
              kind: "text",
              field: "height_cm",
              title: "Høyde",
              unit: "cm",
              type: "number",
            })
          }
        />
        <ProfileField
          label="Aktivitetsnivå"
          value={ACTIVITY.find((a) => a.value === profile.activity_level)?.label ?? "—"}
          onClick={() =>
            setSheet({
              kind: "choice",
              field: "activity_level",
              title: "Aktivitetsnivå",
              choices: ACTIVITY,
            })
          }
          isLast
        />
      </ProfileSection>

      <ProfileSection title="Treningsmål og erfaring">
        <ProfileField
          label="Mål"
          value={
            (profile.goals ?? [])
              .map((g) => GOALS.find((x) => x.value === g)?.label ?? g)
              .join(", ") || "—"
          }
          onClick={() => setSheet({ kind: "multi", field: "goals", title: "Mål" })}
        />
        <ProfileField
          label="Erfaringsnivå"
          value={EXPERIENCE.find((e) => e.value === profile.experience_level)?.label ?? "—"}
          onClick={() =>
            setSheet({
              kind: "choice",
              field: "experience_level",
              title: "Erfaringsnivå",
              choices: EXPERIENCE,
            })
          }
        />
        <ProfileField
          label="Antall år trent"
          value={profile.years_training !== null ? `${profile.years_training} år` : "—"}
          onClick={() =>
            setSheet({
              kind: "text",
              field: "years_training",
              title: "Antall år trent",
              unit: "år",
              type: "number",
            })
          }
          isLast
        />
      </ProfileSection>

      <ProfileSection title="Treningsrutine">
        <ProfileField
          label="Frekvens"
          value={
            profile.training_days_per_week ? `${profile.training_days_per_week} dager/uke` : "—"
          }
          onClick={() =>
            setSheet({
              kind: "choice",
              field: "training_days_per_week",
              title: "Frekvens",
              choices: FREQUENCY_CHOICES,
            })
          }
        />
        <ProfileField
          label="Foretrukket tid"
          value={
            TRAINING_TIME.find((t) => t.value === profile.preferred_training_time)?.label ?? "—"
          }
          onClick={() =>
            setSheet({
              kind: "choice",
              field: "preferred_training_time",
              title: "Foretrukket tid",
              choices: TRAINING_TIME,
            })
          }
        />
        <ProfileField
          label="Maks varighet"
          value={
            profile.max_session_duration_min
              ? `${profile.max_session_duration_min} min`
              : profile.max_session_duration_min === 0
                ? "Ingen grense"
                : "—"
          }
          onClick={() =>
            setSheet({
              kind: "choice",
              field: "max_session_duration_min",
              title: "Maks varighet",
              choices: SESSION_DURATION,
            })
          }
          isLast
        />
      </ProfileSection>

      <ProfileSection title="Utstyr">
        <ProfileList
          items={profile.equipment.map((eq) => ({ id: eq, primary: eq }))}
          addLabel="Legg til utstyr"
          onAdd={() => setSheet({ kind: "equipment", mode: "add", item: null })}
          onItemClick={(eq) => setSheet({ kind: "equipment", mode: "edit", item: eq })}
        />
      </ProfileSection>

      <ProfileSection title="Skader og begrensninger">
        <div className="px-4 py-2 text-xs uppercase text-neutral-500">Skader</div>
        <ProfileList
          items={profile.injuries.map((inj) => ({
            id: inj.id,
            primary: inj.body_part,
            secondary: inj.severity || inj.description || undefined,
          }))}
          addLabel="Legg til skade"
          onAdd={() => setSheet({ kind: "injury", injury: null })}
          onItemClick={(id) =>
            setSheet({ kind: "injury", injury: profile.injuries.find((i) => i.id === id) ?? null })
          }
        />
        <div className="px-4 py-2 text-xs uppercase text-neutral-500 mt-2">Begrensninger</div>
        <ProfileList
          items={profile.constraints.map((c) => ({
            id: c.id,
            primary: c.description,
            secondary: c.type,
          }))}
          addLabel="Legg til begrensning"
          onAdd={() => setSheet({ kind: "constraint", constraint: null })}
          onItemClick={(id) =>
            setSheet({
              kind: "constraint",
              constraint: profile.constraints.find((c) => c.id === id) ?? null,
            })
          }
        />
      </ProfileSection>

      <ProfileSection title="Preferanser">
        <ProfileList
          items={profile.preferences.map((p) => ({
            id: p.id,
            primary: p.preference,
            secondary: p.category,
          }))}
          addLabel="Legg til preferanse"
          onAdd={() => setSheet({ kind: "preference", preference: null })}
          onItemClick={(id) =>
            setSheet({
              kind: "preference",
              preference: profile.preferences.find((p) => p.id === id) ?? null,
            })
          }
        />
      </ProfileSection>

      <ProfileSection title="Konto">
        <div className="px-4 py-3">
          <LogoutButton />
        </div>
      </ProfileSection>

      {sheet?.kind === "text" && (
        <EditTextSheet
          open={true}
          onClose={() => setSheet(null)}
          title={sheet.title}
          initialValue={String(profile[sheet.field] ?? "")}
          unit={sheet.unit}
          type={sheet.type}
          onSave={async (v) => {
            const parsed = sheet.type === "number" ? Number(v) : v
            await saveField(sheet.field, parsed)
          }}
        />
      )}
      {sheet?.kind === "choice" && (
        <EditChoiceSheet
          open={true}
          onClose={() => setSheet(null)}
          title={sheet.title}
          choices={sheet.choices}
          initialValue={String(profile[sheet.field] ?? "")}
          onSave={async (v) => {
            const parsed =
              sheet.field === "training_days_per_week" || sheet.field === "max_session_duration_min"
                ? Number(v)
                : v
            await saveField(sheet.field, parsed)
          }}
        />
      )}
      {sheet?.kind === "multi" && (
        <EditMultiSelectSheet
          open={true}
          onClose={() => setSheet(null)}
          title={sheet.title}
          choices={GOALS}
          initialValues={profile.goals ?? []}
          onSave={async (vs) => {
            await saveField("goals", vs)
          }}
        />
      )}
      {sheet?.kind === "injury" && (
        <EditInjurySheet
          open={true}
          onClose={() => setSheet(null)}
          injury={sheet.injury}
          onSave={async (data) => {
            if (sheet.injury) {
              await updateInjury(accessToken, sheet.injury.id, data)
            } else {
              await addInjury(accessToken, data)
            }
            refresh()
          }}
          onDelete={async (id) => {
            await deleteInjury(accessToken, id)
            refresh()
          }}
        />
      )}
      {sheet?.kind === "preference" && (
        <EditPreferenceSheet
          open={true}
          onClose={() => setSheet(null)}
          preference={sheet.preference}
          onSave={async (data) => {
            if (sheet.preference) {
              await updatePreference(accessToken, sheet.preference.id, data)
            } else {
              await addPreference(accessToken, data)
            }
            refresh()
          }}
          onDelete={async (id) => {
            await deletePreference(accessToken, id)
            refresh()
          }}
        />
      )}
      {sheet?.kind === "constraint" && (
        <EditConstraintSheet
          open={true}
          onClose={() => setSheet(null)}
          constraint={sheet.constraint}
          onSave={async (data) => {
            if (sheet.constraint) {
              await updateConstraint(accessToken, sheet.constraint.id, data)
            } else {
              await addConstraint(accessToken, data)
            }
            refresh()
          }}
          onDelete={async (id) => {
            await deleteConstraint(accessToken, id)
            refresh()
          }}
        />
      )}
      {sheet?.kind === "equipment" && (
        <EquipmentSheet
          open={true}
          onClose={() => setSheet(null)}
          mode={sheet.mode}
          existing={profile.equipment}
          item={sheet.item}
          onAdd={async (eq) => {
            await addEquipment(accessToken, eq)
            refresh()
          }}
          onDelete={async (eq) => {
            await deleteEquipment(accessToken, eq)
            refresh()
          }}
        />
      )}
    </div>
  )
}
