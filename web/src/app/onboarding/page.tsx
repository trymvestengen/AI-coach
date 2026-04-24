"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const TOTAL_STEPS = 11

const GOAL_OPTIONS = [
  { value: "build_muscle", label: "Bygg muskler" },
  { value: "lose_weight", label: "Gå ned i vekt" },
  { value: "get_stronger", label: "Bli sterkere" },
  { value: "improve_endurance", label: "Bedre kondis" },
  { value: "maintain", label: "Holde formen" },
]

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "🌱 Nybegynner", sub: "Under 1 år" },
  { value: "intermediate", label: "💪 Middels", sub: "1–3 år" },
  { value: "advanced", label: "🏆 Erfaren", sub: "3+ år" },
]

const FREQUENCY_OPTIONS = [
  { value: 2, label: "1–2", sub: "dager/uke" },
  { value: 4, label: "3–4", sub: "dager/uke" },
  { value: 6, label: "5–6", sub: "dager/uke" },
  { value: 7, label: "7", sub: "dager/uke" },
]

const GENDER_OPTIONS = [
  { value: "male", label: "Mann" },
  { value: "female", label: "Kvinne" },
  { value: "other", label: "Vil ikke si" },
]

type FormData = {
  firstName: string
  lastName: string
  email: string
  password: string
  goals: string[]
  experienceLevel: string
  trainingDaysPerWeek: number | null
  gender: string
  birthDate: string
  heightCm: string
  weightKg: string
  avatarUrl: string | null
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>({
    firstName: "", lastName: "", email: "", password: "",
    goals: [], experienceLevel: "", trainingDaysPerWeek: null,
    gender: "", birthDate: "", heightCm: "", weightKg: "",
    avatarUrl: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accountCreated, setAccountCreated] = useState(false)

  function next() { setError(null); setStep((s) => s + 1) }
  function back() { setError(null); setStep((s) => s - 1) }

  async function handleSignUp() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { first_name: form.firstName, last_name: form.lastName } },
    })
    setLoading(false)
    if (signUpError) { setError(signUpError.message); return }
    setAccountCreated(true)
    next()
  }

  async function handleAvatarUpload(file: File) {
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError("Ikke innlogget"); return }
    const ext = file.name.split(".").pop() ?? "jpg"
    const path = `${user.id}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true })
    if (uploadError) {
      setError("Kunne ikke laste opp bilde. Prøv igjen eller hopp over.")
      return
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path)
    setForm((f) => ({ ...f, avatarUrl: publicUrl }))
    next()
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setError("Ikke innlogget"); setLoading(false); return }
    const heightCm = parseInt(form.heightCm, 10)
    const weightKg = parseFloat(form.weightKg)
    if (isNaN(heightCm) || isNaN(weightKg)) {
      setError("Ugyldig høyde eller vekt.")
      setLoading(false)
      return
    }
    const res = await fetch(`${API_BASE}/api/users/profile`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: form.email,
        first_name: form.firstName,
        last_name: form.lastName,
        goals: form.goals,
        experience_level: form.experienceLevel,
        training_days_per_week: form.trainingDaysPerWeek,
        gender: form.gender,
        birth_date: form.birthDate,
        height_cm: heightCm,
        weight_kg: weightKg,
        avatar_url: form.avatarUrl,
      }),
    })
    setLoading(false)
    if (!res.ok) { setError("Noe gikk galt. Prøv igjen."); return }
    router.push("/home")
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#0d0d0d" }}>
      {/* Progress bar */}
      <div className="flex gap-1 px-6 pt-5">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-colors duration-300"
            style={{ height: 3, background: i <= step ? "var(--ai-accent, #ff6b35)" : "#2a2a2a" }}
          />
        ))}
      </div>

      {/* Back button */}
      {step > 0 && !(accountCreated && step <= 3) && (
        <button onClick={back} className="self-start px-6 pt-3 text-sm" style={{ color: "#666" }}>
          ← Tilbake
        </button>
      )}

      <div className="flex-1 flex flex-col justify-center px-6">

        {/* Step 0: Name */}
        {step === 0 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">Hva heter du?</h1>
            <input
              type="text"
              placeholder="Fornavn"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              autoFocus
              className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            />
            <input
              type="text"
              placeholder="Etternavn"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            />
            <button
              onClick={next}
              disabled={!form.firstName || !form.lastName}
              className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40 mt-2"
              style={{ background: "var(--ai-accent, #ff6b35)" }}
            >
              Neste
            </button>
          </div>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">E-postadresse</h1>
            <input
              type="email"
              placeholder="din@epost.no"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              autoFocus
              className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            />
            <button
              onClick={next}
              disabled={!form.email}
              className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "var(--ai-accent, #ff6b35)" }}
            >
              Neste
            </button>
          </div>
        )}

        {/* Step 2: Password — calls signUp */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">Velg passord</h1>
            <p className="text-sm" style={{ color: "#666" }}>Minst 6 tegn</p>
            <input
              type="password"
              placeholder="Passord"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              autoFocus
              minLength={6}
              className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              onClick={handleSignUp}
              disabled={form.password.length < 6 || loading}
              className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "var(--ai-accent, #ff6b35)" }}
            >
              {loading ? "Oppretter konto..." : "Opprett konto"}
            </button>
          </div>
        )}

        {/* Step 3: Goals (multi-select) */}
        {step === 3 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">Hva er målet ditt?</h1>
            <p className="text-sm" style={{ color: "#666" }}>Velg ett eller flere</p>
            <div className="flex flex-col gap-2">
              {GOAL_OPTIONS.map((opt) => {
                const selected = form.goals.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        goals: selected
                          ? f.goals.filter((g) => g !== opt.value)
                          : [...f.goals, opt.value],
                      }))
                    }
                    className="rounded-xl px-4 py-3 text-sm text-left font-medium"
                    style={{
                      background: "#1a1a1a",
                      border: `1px solid ${selected ? "var(--ai-accent, #ff6b35)" : "#2a2a2a"}`,
                      color: selected ? "var(--ai-accent, #ff6b35)" : "#aaa",
                    }}
                  >
                    {selected ? "✓ " : ""}{opt.label}
                  </button>
                )
              })}
            </div>
            <button
              onClick={next}
              disabled={form.goals.length === 0}
              className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40 mt-1"
              style={{ background: "var(--ai-accent, #ff6b35)" }}
            >
              Neste
            </button>
          </div>
        )}

        {/* Step 4: Experience — tapping a card advances automatically */}
        {step === 4 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">Treningserfaring</h1>
            <div className="flex flex-col gap-2">
              {EXPERIENCE_OPTIONS.map((opt) => {
                const selected = form.experienceLevel === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setForm((f) => ({ ...f, experienceLevel: opt.value })); next() }}
                    className="rounded-xl px-4 py-3 text-left"
                    style={{
                      background: "#1a1a1a",
                      border: `1px solid ${selected ? "var(--ai-accent, #ff6b35)" : "#2a2a2a"}`,
                    }}
                  >
                    <div className="text-sm font-bold" style={{ color: selected ? "var(--ai-accent, #ff6b35)" : "white" }}>
                      {opt.label}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "#666" }}>{opt.sub}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 5: Frequency — tapping a card advances automatically */}
        {step === 5 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">Hvor ofte trener du?</h1>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCY_OPTIONS.map((opt) => {
                const selected = form.trainingDaysPerWeek === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setForm((f) => ({ ...f, trainingDaysPerWeek: opt.value })); next() }}
                    className="rounded-xl py-5 text-center"
                    style={{
                      background: "#1a1a1a",
                      border: `1px solid ${selected ? "var(--ai-accent, #ff6b35)" : "#2a2a2a"}`,
                    }}
                  >
                    <div className="text-2xl font-bold" style={{ color: selected ? "var(--ai-accent, #ff6b35)" : "white" }}>
                      {opt.label}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "#666" }}>{opt.sub}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 6: Gender — tapping advances automatically */}
        {step === 6 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">Kjønn</h1>
            <div className="flex flex-col gap-2">
              {GENDER_OPTIONS.map((opt) => {
                const selected = form.gender === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setForm((f) => ({ ...f, gender: opt.value })); next() }}
                    className="rounded-xl py-3 text-sm font-medium"
                    style={{
                      background: "#1a1a1a",
                      border: `1px solid ${selected ? "var(--ai-accent, #ff6b35)" : "#2a2a2a"}`,
                      color: selected ? "var(--ai-accent, #ff6b35)" : "#aaa",
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 7: Birth date */}
        {step === 7 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">Når er du født?</h1>
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
              max={new Date().toISOString().split("T")[0]}
              className="rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", colorScheme: "dark" }}
            />
            <button
              onClick={next}
              disabled={!form.birthDate}
              className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "var(--ai-accent, #ff6b35)" }}
            >
              Neste
            </button>
          </div>
        )}

        {/* Step 8: Height + weight */}
        {step === 8 && (
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">Høyde og vekt</h1>
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs" style={{ color: "#666" }}>Høyde</label>
                <div
                  className="flex items-center rounded-xl"
                  style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                >
                  <input
                    type="number"
                    placeholder="180"
                    value={form.heightCm}
                    onChange={(e) => setForm((f) => ({ ...f, heightCm: e.target.value }))}
                    className="flex-1 px-4 py-3 text-sm text-white bg-transparent outline-none"
                  />
                  <span className="pr-3 text-xs" style={{ color: "#666" }}>cm</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs" style={{ color: "#666" }}>Vekt</label>
                <div
                  className="flex items-center rounded-xl"
                  style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                >
                  <input
                    type="number"
                    placeholder="80"
                    value={form.weightKg}
                    onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
                    className="flex-1 px-4 py-3 text-sm text-white bg-transparent outline-none"
                  />
                  <span className="pr-3 text-xs" style={{ color: "#666" }}>kg</span>
                </div>
              </div>
            </div>
            <button
              onClick={next}
              disabled={!form.heightCm || !form.weightKg}
              className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "var(--ai-accent, #ff6b35)" }}
            >
              Neste
            </button>
          </div>
        )}

        {/* Step 9: Profile picture (skippable) */}
        {step === 9 && (
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-white text-2xl font-bold text-center">Profilbilde</h1>
            <p className="text-sm" style={{ color: "#666" }}>Valgfritt</p>
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: "#1a1a1a",
                border: "2px dashed #333",
                overflow: "hidden",
              }}
            >
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Profilbilde" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl" style={{ color: "#444" }}>+</span>
              )}
            </div>
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <label
              className="rounded-xl py-3 px-8 text-sm font-bold text-white cursor-pointer"
              style={{ background: "var(--ai-accent, #ff6b35)" }}
            >
              Last opp bilde
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleAvatarUpload(file)
                }}
              />
            </label>
            <button onClick={next} className="text-sm" style={{ color: "#555" }}>
              Hopp over →
            </button>
          </div>
        )}

        {/* Step 10: Summary + submit */}
        {step === 10 && (
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h1 className="text-white text-2xl font-bold">Alt er klart!</h1>
              <p className="text-sm mt-1" style={{ color: "#666" }}>Hei, {form.firstName}!</p>
            </div>
            <div
              className="rounded-xl p-4 flex flex-col gap-2 text-sm"
              style={{ background: "#111", border: "1px solid #1e1e1e" }}
            >
              <div style={{ color: "#666" }}>
                Mål:{" "}
                <span style={{ color: "#aaa" }}>
                  {form.goals
                    .map((g) => GOAL_OPTIONS.find((o) => o.value === g)?.label)
                    .join(", ")}
                </span>
              </div>
              <div style={{ color: "#666" }}>
                Erfaring:{" "}
                <span style={{ color: "#aaa" }}>
                  {EXPERIENCE_OPTIONS.find((o) => o.value === form.experienceLevel)?.label}
                </span>
              </div>
              <div style={{ color: "#666" }}>
                Trening:{" "}
                <span style={{ color: "#aaa" }}>
                  {FREQUENCY_OPTIONS.find((o) => o.value === form.trainingDaysPerWeek)?.label} dager/uke
                </span>
              </div>
              <div style={{ color: "#666" }}>
                Kropp:{" "}
                <span style={{ color: "#aaa" }}>
                  {form.heightCm} cm · {form.weightKg} kg
                </span>
              </div>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "var(--ai-accent, #ff6b35)" }}
            >
              {loading ? "Lagrer..." : "Kom i gang 🚀"}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
