"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import TextStep from "./steps/TextStep"
import ChoiceStep from "./steps/ChoiceStep"
import NumberStep from "./steps/NumberStep"
import DateStep from "./steps/DateStep"
import DoneStep from "./steps/DoneStep"
import { saveDraft, loadDraft, clearDraft } from "./wizardStorage"
import {
  GOAL_OPTIONS,
  EXPERIENCE_OPTIONS,
  FREQUENCY_OPTIONS,
  EQUIPMENT_OPTIONS,
  GENDER_OPTIONS,
  TOTAL_PROGRESS_STEPS,
} from "./wizardConfig"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export interface InitialProfile {
  first_name: string | null
  last_name: string | null
  goals: string[] | null
  experience_level: string | null
  training_days_per_week: number | null
  gender: string | null
  birth_date: string | null
  height_cm: number | null
  weight_kg: number | null
  equipment: string[]
  injury_notes: string | null
  preference_notes: string | null
  onboarding_status: string
}

interface Props {
  initialProfile: InitialProfile | null
  firstNameFallback: string
}

interface State {
  firstName: string
  lastName: string
  email: string
  password: string
  goals: string[]
  experienceLevel: string
  trainingDaysPerWeek: string
  equipment: string[]
  gender: string
  birthDate: string
  heightCm: number | null
  weightKg: number | null
  injuryNotes: string
  preferenceNotes: string
}

function initialStateFromProfile(p: InitialProfile | null): State {
  if (!p) {
    return {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      goals: [],
      experienceLevel: "",
      trainingDaysPerWeek: "",
      equipment: [],
      gender: "",
      birthDate: "",
      heightCm: null,
      weightKg: null,
      injuryNotes: "",
      preferenceNotes: "",
    }
  }
  return {
    firstName: p.first_name ?? "",
    lastName: p.last_name ?? "",
    email: "",
    password: "",
    goals: p.goals ?? [],
    experienceLevel: p.experience_level ?? "",
    trainingDaysPerWeek: p.training_days_per_week != null ? String(p.training_days_per_week) : "",
    equipment: p.equipment ?? [],
    gender: p.gender ?? "",
    birthDate: p.birth_date ?? "",
    heightCm: p.height_cm,
    weightKg: p.weight_kg,
    injuryNotes: p.injury_notes ?? "",
    preferenceNotes: p.preference_notes ?? "",
  }
}

function firstIncompleteStep(p: InitialProfile | null): number {
  if (!p) return 1
  if (!p.goals || p.goals.length === 0) return 4
  if (!p.experience_level) return 5
  if (p.training_days_per_week == null) return 6
  if (!p.equipment || p.equipment.length === 0) return 7
  if (!p.gender) return 8
  if (!p.birth_date) return 9
  if (p.height_cm == null) return 10
  if (p.weight_kg == null) return 11
  return 12
}

export default function OnboardingWizard({ initialProfile, firstNameFallback }: Props) {
  const router = useRouter()
  const [state, setState] = useState<State>(() => {
    const fromProfile = initialStateFromProfile(initialProfile)
    if (!initialProfile && typeof window !== "undefined") {
      const draft = loadDraft()
      if (draft) {
        return {
          ...fromProfile,
          firstName: draft.firstName ?? "",
          lastName: draft.lastName ?? "",
          email: draft.email ?? "",
        }
      }
    }
    return fromProfile
  })
  const [step, setStep] = useState<number>(() => firstIncompleteStep(initialProfile))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const draftSnapshotRef = useRef("")

  // Persist draft in localStorage during signup phase only.
  useEffect(() => {
    if (step <= 3 && !initialProfile) {
      const snapshot = JSON.stringify({
        firstName: state.firstName,
        lastName: state.lastName,
        email: state.email,
      })
      if (snapshot !== draftSnapshotRef.current) {
        draftSnapshotRef.current = snapshot
        saveDraft({
          firstName: state.firstName,
          lastName: state.lastName,
          email: state.email,
        })
      }
    }
  }, [state.firstName, state.lastName, state.email, step, initialProfile])

  // Step 4 cannot go back to signup (account already created).
  const back = step > 1 && step !== 4 ? () => setStep((s) => s - 1) : null

  const patchProfile = async (body: Record<string, unknown>) => {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw new Error("Ikke innlogget")
    const res = await fetch(`${API_BASE}/api/users/profile`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    if (!res.ok && res.status !== 204) {
      throw new Error(`PATCH failed: ${res.status}`)
    }
  }
  const renderStep = () => {
    // ----- Step 1: Name (two fields, inline form — TextStep only takes one input) -----
    if (step === 1) {
      const canProgress = state.firstName.trim().length > 0 && state.lastName.trim().length > 0
      return (
        <div className="flex flex-col h-full" style={{ background: "var(--brand-canvas)" }}>
          <div className="flex-1 flex flex-col justify-center px-6">
            <div className="flex flex-col gap-3">
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--brand-ink)",
                }}
              >
                Hva heter du?
              </h1>
              <input
                type="text"
                placeholder="Fornavn"
                value={state.firstName}
                onChange={(e) => setState((s) => ({ ...s, firstName: e.target.value }))}
                autoFocus
                style={{
                  background: "var(--brand-surface)",
                  border: "1px solid var(--brand-border)",
                  borderRadius: 12,
                  padding: "13px 14px",
                  fontSize: 15,
                  color: "var(--brand-ink)",
                  outline: "none",
                }}
              />
              <input
                type="text"
                placeholder="Etternavn"
                value={state.lastName}
                onChange={(e) => setState((s) => ({ ...s, lastName: e.target.value }))}
                style={{
                  background: "var(--brand-surface)",
                  border: "1px solid var(--brand-border)",
                  borderRadius: 12,
                  padding: "13px 14px",
                  fontSize: 15,
                  color: "var(--brand-ink)",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canProgress}
                style={{
                  marginTop: 8,
                  padding: "13px 16px",
                  borderRadius: 12,
                  border: "none",
                  background: "var(--brand-orange)",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: canProgress ? "pointer" : "default",
                  opacity: canProgress ? 1 : 0.4,
                }}
              >
                Neste
              </button>
            </div>
          </div>
        </div>
      )
    }

    // ----- Step 2: Email -----
    if (step === 2) {
      return (
        <TextStep
          title="E-postadresse"
          placeholder="din@epost.no"
          value={state.email}
          onChange={(v) => setState((s) => ({ ...s, email: v }))}
          onNext={() => setStep(3)}
          onBack={back}
          validate={(v) => /\S+@\S+\.\S+/.test(v)}
          type="email"
        />
      )
    }

    // ----- Step 3: Password + signUp -----
    if (step === 3) {
      const handleSignUp = async () => {
        setBusy(true)
        setError(null)
        try {
          const supabase = createClient()
          const { error: signUpError } = await supabase.auth.signUp({
            email: state.email,
            password: state.password,
            options: {
              data: { first_name: state.firstName, last_name: state.lastName },
            },
          })
          if (signUpError) {
            setError(signUpError.message)
            setBusy(false)
            return
          }
          // Bootstrap users row so subsequent PATCH calls find a record.
          // The relaxed POST endpoint accepts just email + names; other fields
          // stay NULL and are filled in by PATCH calls during steps 4-13.
          const {
            data: { session },
          } = await supabase.auth.getSession()
          if (session) {
            await fetch(`${API_BASE}/api/users/profile`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: state.email,
                first_name: state.firstName,
                last_name: state.lastName,
              }),
            })
          }
          clearDraft()
          setStep(4)
        } catch (e) {
          setError((e as Error).message)
        } finally {
          setBusy(false)
        }
      }

      return (
        <TextStep
          title="Velg passord"
          subtitle="Minst 6 tegn"
          placeholder="Passord"
          value={state.password}
          onChange={(v) => setState((s) => ({ ...s, password: v }))}
          onNext={handleSignUp}
          onBack={back}
          validate={(v) => v.length >= 6}
          type="password"
          nextLabel="Opprett konto"
          busy={busy}
        />
      )
    }

    // ----- Step 4: Goals -----
    if (step === 4) {
      return (
        <ChoiceStep
          title="Hva er målet ditt?"
          options={GOAL_OPTIONS}
          value={state.goals}
          onChange={(v) => setState((s) => ({ ...s, goals: v }))}
          onNext={async () => {
            setBusy(true)
            try {
              await patchProfile({ goals: state.goals })
              setStep(5)
            } catch (e) {
              setError((e as Error).message)
            } finally {
              setBusy(false)
            }
          }}
          onBack={null}
          multi
          currentStep={1}
          totalSteps={TOTAL_PROGRESS_STEPS}
          busy={busy}
        />
      )
    }

    // ----- Step 5: Experience -----
    if (step === 5) {
      return (
        <ChoiceStep
          title="Treningserfaring"
          options={EXPERIENCE_OPTIONS}
          value={state.experienceLevel ? [state.experienceLevel] : []}
          onChange={(v) => setState((s) => ({ ...s, experienceLevel: v[0] ?? "" }))}
          onNext={async () => {
            setBusy(true)
            try {
              await patchProfile({ experience_level: state.experienceLevel })
              setStep(6)
            } catch (e) {
              setError((e as Error).message)
            } finally {
              setBusy(false)
            }
          }}
          onBack={() => setStep(4)}
          currentStep={2}
          totalSteps={TOTAL_PROGRESS_STEPS}
          busy={busy}
        />
      )
    }

    // ----- Step 6: Frequency -----
    if (step === 6) {
      return (
        <ChoiceStep
          title="Hvor mange dager i uka kan du trene?"
          options={FREQUENCY_OPTIONS}
          value={state.trainingDaysPerWeek ? [state.trainingDaysPerWeek] : []}
          onChange={(v) => setState((s) => ({ ...s, trainingDaysPerWeek: v[0] ?? "" }))}
          onNext={async () => {
            setBusy(true)
            try {
              await patchProfile({
                training_days_per_week: parseInt(state.trainingDaysPerWeek, 10),
              })
              setStep(7)
            } catch (e) {
              setError((e as Error).message)
            } finally {
              setBusy(false)
            }
          }}
          onBack={() => setStep(5)}
          currentStep={3}
          totalSteps={TOTAL_PROGRESS_STEPS}
          busy={busy}
        />
      )
    }

    // ----- Step 7: Equipment (POSTs to user_equipment per item) -----
    if (step === 7) {
      const saveEquipment = async () => {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) throw new Error("Ikke innlogget")
        for (const item of state.equipment) {
          await fetch(`${API_BASE}/api/users/equipment`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ equipment: item }),
          })
        }
      }
      return (
        <ChoiceStep
          title="Hvor trener du?"
          subtitle="Velg ett eller flere"
          options={EQUIPMENT_OPTIONS}
          value={state.equipment}
          onChange={(v) => setState((s) => ({ ...s, equipment: v }))}
          onNext={async () => {
            setBusy(true)
            try {
              await saveEquipment()
              setStep(8)
            } catch (e) {
              setError((e as Error).message)
            } finally {
              setBusy(false)
            }
          }}
          onBack={() => setStep(6)}
          multi
          currentStep={4}
          totalSteps={TOTAL_PROGRESS_STEPS}
          busy={busy}
        />
      )
    }

    // ----- Step 8: Gender -----
    if (step === 8) {
      return (
        <ChoiceStep
          title="Kjønn"
          options={GENDER_OPTIONS}
          value={state.gender ? [state.gender] : []}
          onChange={(v) => setState((s) => ({ ...s, gender: v[0] ?? "" }))}
          onNext={async () => {
            setBusy(true)
            try {
              await patchProfile({ gender: state.gender })
              setStep(9)
            } catch (e) {
              setError((e as Error).message)
            } finally {
              setBusy(false)
            }
          }}
          onBack={() => setStep(7)}
          currentStep={5}
          totalSteps={TOTAL_PROGRESS_STEPS}
          busy={busy}
        />
      )
    }

    // ----- Step 9: Birth date -----
    if (step === 9) {
      return (
        <DateStep
          title="Når er du født?"
          value={state.birthDate}
          onChange={(v) => setState((s) => ({ ...s, birthDate: v }))}
          onNext={async () => {
            setBusy(true)
            try {
              await patchProfile({ birth_date: state.birthDate })
              setStep(10)
            } catch (e) {
              setError((e as Error).message)
            } finally {
              setBusy(false)
            }
          }}
          onBack={() => setStep(8)}
          currentStep={6}
          totalSteps={TOTAL_PROGRESS_STEPS}
          busy={busy}
        />
      )
    }

    // ----- Step 10: Height -----
    if (step === 10) {
      return (
        <NumberStep
          title="Hvor høy er du?"
          unit="cm"
          placeholder="180"
          value={state.heightCm}
          onChange={(v) => setState((s) => ({ ...s, heightCm: v }))}
          onNext={async () => {
            setBusy(true)
            try {
              await patchProfile({ height_cm: state.heightCm })
              setStep(11)
            } catch (e) {
              setError((e as Error).message)
            } finally {
              setBusy(false)
            }
          }}
          onBack={() => setStep(9)}
          min={100}
          max={250}
          currentStep={7}
          totalSteps={TOTAL_PROGRESS_STEPS}
          busy={busy}
        />
      )
    }

    // ----- Step 11: Weight -----
    if (step === 11) {
      return (
        <NumberStep
          title="Hvor mye veier du?"
          unit="kg"
          placeholder="80"
          value={state.weightKg}
          onChange={(v) => setState((s) => ({ ...s, weightKg: v }))}
          onNext={async () => {
            setBusy(true)
            try {
              await patchProfile({ weight_kg: state.weightKg })
              setStep(12)
            } catch (e) {
              setError((e as Error).message)
            } finally {
              setBusy(false)
            }
          }}
          onBack={() => setStep(10)}
          min={30}
          max={250}
          currentStep={8}
          totalSteps={TOTAL_PROGRESS_STEPS}
          busy={busy}
        />
      )
    }

    // ----- Step 12: Injuries (optional) -----
    if (step === 12) {
      const handleNext = async () => {
        setBusy(true)
        try {
          await patchProfile({ injury_notes: state.injuryNotes })
          setStep(13)
        } catch (e) {
          setError((e as Error).message)
        } finally {
          setBusy(false)
        }
      }
      const handleSkip = () => setStep(13)
      return (
        <TextStep
          title="Har du noen skader eller begrensninger?"
          subtitle="Kort beskrivelse — eller hopp over"
          placeholder="F.eks. sår skulder, ryggsmerter..."
          value={state.injuryNotes}
          onChange={(v) => setState((s) => ({ ...s, injuryNotes: v }))}
          onNext={handleNext}
          onBack={() => setStep(11)}
          validate={(v) => v.trim().length > 0}
          multiline
          onSkip={handleSkip}
          currentStep={9}
          totalSteps={TOTAL_PROGRESS_STEPS}
          busy={busy}
        />
      )
    }

    // ----- Step 13: Preferences (optional) -----
    if (step === 13) {
      const handleNext = async () => {
        setBusy(true)
        try {
          await patchProfile({ preference_notes: state.preferenceNotes })
          setStep(14)
        } catch (e) {
          setError((e as Error).message)
        } finally {
          setBusy(false)
        }
      }
      const handleSkip = () => setStep(14)
      return (
        <TextStep
          title="Preferanser: hva liker du / hater du?"
          subtitle="F.eks. 'elsker styrkeløft, hater løping' — eller hopp over"
          placeholder="Skriv fritt..."
          value={state.preferenceNotes}
          onChange={(v) => setState((s) => ({ ...s, preferenceNotes: v }))}
          onNext={handleNext}
          onBack={() => setStep(12)}
          validate={(v) => v.trim().length > 0}
          multiline
          onSkip={handleSkip}
          currentStep={10}
          totalSteps={TOTAL_PROGRESS_STEPS}
          busy={busy}
        />
      )
    }

    // ----- Step 14: Done -----
    if (step === 14) {
      const summary: Record<string, string> = {
        Mål: state.goals
          .map((g) => GOAL_OPTIONS.find((o) => o.value === g)?.label)
          .filter(Boolean)
          .join(", "),
        Erfaring: EXPERIENCE_OPTIONS.find((o) => o.value === state.experienceLevel)?.label ?? "",
        Trening:
          (FREQUENCY_OPTIONS.find((o) => o.value === state.trainingDaysPerWeek)?.label ?? "") +
          " dager/uke",
        Kropp: `${state.heightCm} cm · ${state.weightKg} kg`,
      }
      const handleFinish = async () => {
        setBusy(true)
        try {
          const supabase = createClient()
          const {
            data: { session },
          } = await supabase.auth.getSession()
          if (!session) throw new Error("Ikke innlogget")
          const res = await fetch(`${API_BASE}/api/users/onboarding/complete`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          })
          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(body.detail || `Kunne ikke fullføre (status ${res.status})`)
          }
          router.push("/home")
        } catch (e) {
          setError((e as Error).message)
          setBusy(false)
        }
      }
      return (
        <DoneStep
          firstName={state.firstName || firstNameFallback}
          summary={summary}
          onFinish={handleFinish}
          busy={busy}
        />
      )
    }

    return <div className="p-6 text-white">Ukjent steg: {step}</div>
  }

  return (
    <>
      {renderStep()}
      {error && (
        <div
          role="alert"
          onClick={() => setError(null)}
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: 16,
            zIndex: 50,
            padding: "12px 14px",
            borderRadius: 12,
            background: "#dc2626",
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            cursor: "pointer",
          }}
        >
          {error} — trykk for å lukke
        </div>
      )}
    </>
  )
}
