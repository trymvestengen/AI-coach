"use client"
import { forwardRef, useRef, useState, type ReactNode } from "react"
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

type SectionId = "kropp" | "trening" | "annet"
type TabId = "konto" | "profil" | "innstillinger"

const TAB_LABELS: Record<TabId, string> = {
  konto: "Konto",
  profil: "Profil",
  innstillinger: "Innstillinger",
}

function TabPills({ active, onSelect }: { active: TabId; onSelect: (id: TabId) => void }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        background: "var(--brand-muted-bg, #f3f3ee)",
        borderRadius: 999,
        padding: 4,
        marginBottom: 14,
      }}
    >
      {(Object.keys(TAB_LABELS) as TabId[]).map((id) => {
        const isActive = active === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 999,
              border: "none",
              background: isActive ? "var(--brand-surface)" : "transparent",
              color: isActive ? "var(--brand-ink)" : "var(--brand-muted)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.05)" : "none",
            }}
          >
            {TAB_LABELS[id]}
          </button>
        )
      })}
    </div>
  )
}

const AccordionCard = forwardRef<
  HTMLDivElement,
  {
    id: SectionId
    title: string
    summary: string
    open: boolean
    onToggle: () => void
    children: ReactNode
  }
>(function AccordionCard({ title, summary, open, onToggle, children }, ref) {
  return (
    <div
      ref={ref}
      style={{
        background: "var(--brand-surface)",
        border: `1px solid ${open ? "var(--brand-orange)" : "var(--brand-border)"}`,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 10,
        scrollMarginTop: 12,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "13px 14px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: open ? "var(--brand-orange)" : "var(--brand-ink)",
            }}
          >
            {title}
          </span>
          {!open && (
            <span style={{ fontSize: 12, color: "var(--brand-muted)" }}>
              {summary || "Ingen registrert"}
            </span>
          )}
        </div>
        <span style={{ color: "var(--brand-faint)", fontSize: 16 }}>{open ? "▴" : "▾"}</span>
      </button>
      {open && <div style={{ borderTop: "1px solid var(--brand-border)" }}>{children}</div>}
    </div>
  )
})

function SubLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        color: "var(--brand-muted)",
        padding: "12px 14px 6px",
        borderTop: "1px solid var(--brand-border)",
      }}
    >
      {children}
    </div>
  )
}

function ChipRow({
  items,
  onItemClick,
  onAdd,
}: {
  items: string[]
  onItemClick: (item: string) => void
  onAdd: () => void
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 14px 14px" }}>
      {items.map((eq) => (
        <button
          key={eq}
          type="button"
          onClick={() => onItemClick(eq)}
          style={{
            background: "var(--brand-subtle)",
            color: "var(--brand-orange-deep)",
            padding: "5px 12px",
            borderRadius: 999,
            border: "none",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {eq}
        </button>
      ))}
      <button
        type="button"
        onClick={onAdd}
        style={{
          background: "transparent",
          color: "var(--brand-orange)",
          padding: "5px 12px",
          borderRadius: 999,
          border: "1px dashed var(--brand-orange)",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        + Legg til
      </button>
    </div>
  )
}

function SectionBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 22 }}>
      <h2
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 1.2,
          color: "var(--brand-muted)",
          fontWeight: 600,
          marginBottom: 8,
          paddingLeft: 4,
        }}
      >
        {title}
      </h2>
      <div
        style={{
          background: "var(--brand-surface)",
          border: "1px solid var(--brand-border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </section>
  )
}

function SettingRow({
  label,
  value,
  isLast,
  comingSoon,
  onClick,
}: {
  label: string
  value?: string
  isLast?: boolean
  comingSoon?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={comingSoon}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "13px 14px",
        textAlign: "left",
        background: "transparent",
        border: "none",
        borderBottom: isLast ? "none" : "1px solid var(--brand-border)",
        cursor: comingSoon || !onClick ? "default" : "pointer",
      }}
    >
      <span style={{ color: "var(--brand-ink)", fontSize: 14 }}>{label}</span>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          color: comingSoon ? "var(--brand-faint)" : "var(--brand-muted)",
        }}
      >
        {comingSoon ? "Kommer snart" : (value ?? "")}
        {onClick && !comingSoon && (
          <span style={{ color: "var(--brand-faint)", fontSize: 16 }}>›</span>
        )}
      </span>
    </button>
  )
}

function AppTab() {
  return (
    <>
      <SectionBlock title="Enheter">
        <SettingRow label="Vekt" value="kg" comingSoon />
        <SettingRow label="Lengde" value="cm" comingSoon isLast />
      </SectionBlock>

      <SectionBlock title="Varsler">
        <SettingRow label="Push-varsler" comingSoon />
        <SettingRow label="Daglig påminnelse" comingSoon isLast />
      </SectionBlock>

      <SectionBlock title="Trening">
        <SettingRow label="Standard hviletid" value="90 s" comingSoon />
        <SettingRow label="Tonnage-enhet" value="tonn" comingSoon isLast />
      </SectionBlock>

      <SectionBlock title="Visning">
        <SettingRow label="Tema" value="Lys" comingSoon />
        <SettingRow label="Språk" value="Norsk" comingSoon isLast />
      </SectionBlock>
    </>
  )
}

function KontoTab({
  firstName,
  lastName,
  email,
  avatarUrl,
  accessToken,
  onAvatarUpdated,
}: {
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  accessToken: string
  onAvatarUpdated: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase()

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const supabase = (await import("@/lib/supabase")).createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Ikke innlogget")
      const ext = file.name.split(".").pop() ?? "jpg"
      const path = `${user.id}/avatar.${ext}`
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true })
      if (upErr) throw new Error(upErr.message)
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path)
      // Update profile via PATCH (avatar_url isn't in ALLOWED_PATCH_FIELDS server-side
      // by default — but the upsert endpoint accepts it).
      await updateProfile(accessToken, { avatar_url: publicUrl } as Partial<FullProfile>)
      onAvatarUpdated()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Opplasting feilet")
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "8px 0 20px",
        }}
      >
        <div style={{ position: "relative", marginBottom: 12 }}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={`${firstName} ${lastName}`}
              style={{
                width: 80,
                height: 80,
                borderRadius: 999,
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 999,
                background: "var(--brand-orange)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              {initials || "👤"}
            </div>
          )}
          <label
            htmlFor="avatar-upload"
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              background: "var(--brand-ink)",
              color: "#fff",
              width: 28,
              height: 28,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              cursor: uploading ? "default" : "pointer",
              border: "2px solid var(--brand-canvas)",
            }}
          >
            {uploading ? "…" : "✎"}
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={handleAvatarUpload}
            style={{ display: "none" }}
          />
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--brand-ink)",
          }}
        >
          {firstName} {lastName}
        </div>
        <div style={{ color: "var(--brand-muted)", fontSize: 13, marginTop: 2 }}>{email}</div>
        {uploadError && (
          <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 8 }}>{uploadError}</div>
        )}
      </div>

      <SectionBlock title="Sikkerhet">
        <SettingRow label="Endre passord" comingSoon />
        <SettingRow label="Tofaktor-autentisering" comingSoon isLast />
      </SectionBlock>

      <SectionBlock title="Abonnement">
        <SettingRow label="Plan" value="Gratis" comingSoon isLast />
      </SectionBlock>

      <SectionBlock title="Hjelp og om">
        <SettingRow label="Kontakt support" comingSoon />
        <SettingRow label="Personvern" comingSoon />
        <SettingRow label="Vilkår" comingSoon />
        <SettingRow label="Versjon" value="0.1.0" isLast />
      </SectionBlock>

      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <LogoutButton />
      </div>

      <button
        type="button"
        disabled
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          color: "var(--brand-faint)",
          fontSize: 13,
          fontWeight: 500,
          padding: "10px 0",
          cursor: "default",
        }}
      >
        Slett konto (kommer snart)
      </button>
    </>
  )
}

export default function ProfileSettings({
  initialProfile,
  accessToken,
  open,
  onClose,
}: {
  initialProfile: FullProfile
  accessToken: string
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const profile = initialProfile
  const [sheet, setSheet] = useState<SheetKey>(null)
  const [openSection, setOpenSection] = useState<SectionId | null>("kropp")
  const [activeTab, setActiveTab] = useState<TabId>("konto")
  const kroppRef = useRef<HTMLDivElement>(null)
  const treningRef = useRef<HTMLDivElement>(null)
  const annetRef = useRef<HTMLDivElement>(null)

  const toggle = (id: SectionId) => {
    setOpenSection((current) => (current === id ? null : id))
  }

  // Computed summaries shown on collapsed accordion headers
  const kroppSummary = [
    profile.weight_kg ? `${profile.weight_kg} kg` : null,
    profile.height_cm ? `${profile.height_cm} cm` : null,
    ACTIVITY.find((a) => a.value === profile.activity_level)?.label ?? null,
  ]
    .filter(Boolean)
    .join(" · ")
  const treningSummary = [
    EXPERIENCE.find((e) => e.value === profile.experience_level)?.label ?? null,
    profile.training_days_per_week ? `${profile.training_days_per_week} d/uke` : null,
    profile.equipment.length > 0 ? `${profile.equipment.length} utstyr` : null,
  ]
    .filter(Boolean)
    .join(" · ")
  const annetCount =
    profile.injuries.length + profile.constraints.length + profile.preferences.length
  const annetSummary =
    annetCount === 0 ? "Ingen registrert" : `${annetCount} oppføring${annetCount === 1 ? "" : "er"}`

  const refresh = () => router.refresh()

  const saveField = async (field: keyof FullProfile, value: unknown) => {
    await updateProfile(accessToken, { [field]: value } as Partial<FullProfile>)
    refresh()
  }

  if (!open) return null

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--brand-canvas)",
        color: "var(--brand-ink)",
        zIndex: 30,
        overflowY: "auto",
        padding: "16px 20px 20px",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 0 20px",
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--brand-ink)",
          }}
        >
          Innstillinger
        </h1>
        <button
          type="button"
          onClick={onClose}
          aria-label="Lukk"
          style={{
            background: "var(--brand-surface)",
            border: "1px solid var(--brand-border)",
            borderRadius: 999,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--brand-ink)",
            fontSize: 16,
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </header>

      <TabPills active={activeTab} onSelect={setActiveTab} />

      {activeTab === "innstillinger" && <AppTab />}
      {activeTab === "konto" && (
        <KontoTab
          firstName={profile.first_name}
          lastName={profile.last_name}
          email={profile.email}
          avatarUrl={profile.avatar_url}
          accessToken={accessToken}
          onAvatarUpdated={() => router.refresh()}
        />
      )}

      <div style={{ display: activeTab === "profil" ? "block" : "none" }}>
        <AccordionCard
          ref={kroppRef}
          id="kropp"
          title="Vekt, høyde og aktivitet"
          summary={kroppSummary}
          open={openSection === "kropp"}
          onToggle={() => toggle("kropp")}
        >
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
        </AccordionCard>

        <AccordionCard
          ref={treningRef}
          id="trening"
          title="Mål, rutine og utstyr"
          summary={treningSummary}
          open={openSection === "trening"}
          onToggle={() => toggle("trening")}
        >
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
            label="År trent"
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
          />
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

          <SubLabel>Utstyr</SubLabel>
          <ChipRow
            items={profile.equipment}
            onItemClick={(eq) => setSheet({ kind: "equipment", mode: "edit", item: eq })}
            onAdd={() => setSheet({ kind: "equipment", mode: "add", item: null })}
          />
        </AccordionCard>

        <AccordionCard
          ref={annetRef}
          id="annet"
          title="Skader og preferanser"
          summary={annetSummary}
          open={openSection === "annet"}
          onToggle={() => toggle("annet")}
        >
          <SubLabel>Skader</SubLabel>
          <ProfileList
            items={profile.injuries.map((inj) => ({
              id: inj.id,
              primary: inj.body_part,
              secondary: inj.severity || inj.description || undefined,
            }))}
            addLabel="Legg til skade"
            onAdd={() => setSheet({ kind: "injury", injury: null })}
            onItemClick={(id) =>
              setSheet({
                kind: "injury",
                injury: profile.injuries.find((i) => i.id === id) ?? null,
              })
            }
          />

          <SubLabel>Begrensninger</SubLabel>
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

          <SubLabel>Preferanser</SubLabel>
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
        </AccordionCard>
      </div>

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
