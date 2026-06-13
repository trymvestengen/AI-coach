"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { FullProfile } from "@/lib/profile"
import { createClient } from "@/lib/supabase"
import ThemeToggle from "@/components/theme/ThemeToggle"
import ProfileSettings from "./ProfileSettings"

export interface WorkoutSummary {
  id: string
  completed_at: string
  set_count: number
  rpe: number | null
}

export interface ActiveProgram {
  name: string
  dayCount: number
}

interface Props {
  initialProfile: FullProfile
  accessToken: string
  stats: {
    totalWorkouts: number
    streak: number
    totalVolumeT: number
  }
  recentWorkouts: WorkoutSummary[]
  activeProgram: ActiveProgram | null
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Nybegynner",
  intermediate: "Erfaren",
  advanced: "Avansert",
}

export default function ProfileClient({ initialProfile, accessToken, stats }: Props) {
  const router = useRouter()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const profile = initialProfile
  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase()
  const level = profile.experience_level ? LEVEL_LABELS[profile.experience_level] : null

  const today = new Date().toLocaleDateString("no-NO", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const logout = async () => {
    await createClient().auth.signOut()
    router.refresh()
    router.push("/login")
  }

  return (
    <>
      <div
        className="screen forge"
        style={{ background: "var(--brand-canvas)", color: "var(--brand-ink)" }}
      >
        <div className="app-topbar" style={{ padding: "16px 20px 4px" }}>
          <div className="datebar">
            <span className="tick" />
            {today}
          </div>
          <ThemeToggle />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 24px" }}>
          <div className="eyebrow" style={{ marginTop: 6 }}>
            Profil
          </div>

          {/* identity card */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="panel"
            style={{
              width: "100%",
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              gap: 14,
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div className="avatar" style={{ width: 54, height: 54, fontSize: 17 }}>
              {initials || "👤"}
            </div>
            <div className="row-main">
              <div className="row-name" style={{ fontSize: 19 }}>
                {profile.first_name} {profile.last_name}
              </div>
              <div
                className="row-meta"
                style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}
              >
                {level ?? "Innstillinger og profil"}
                {stats.streak > 0 && (
                  <>
                    <span className="streak" style={{ padding: "3px 9px 3px 7px" }}>
                      <span className="flame" style={{ fontSize: 13 }}>
                        🔥
                      </span>
                      <span className="num tnum" style={{ fontSize: 12 }}>
                        {stats.streak}
                      </span>
                    </span>
                    dagers streak
                  </>
                )}
              </div>
            </div>
            <span className="row-trail">›</span>
          </button>

          {/* key stats */}
          <div className="stat-grid" style={{ marginTop: 14 }}>
            <div className="stat-tile accent">
              <div className="v tnum">{stats.totalWorkouts}</div>
              <div className="l">Økter totalt</div>
            </div>
            <div className="stat-tile">
              <div className="v tnum">{stats.streak}</div>
              <div className="l">Streak-dager</div>
            </div>
            <div className="stat-tile">
              <div className="v tnum">{stats.totalVolumeT.toFixed(0)}&thinsp;t</div>
              <div className="l">Total tonnage</div>
            </div>
          </div>

          {/* settings */}
          <section>
            <div className="section-head">
              <div className="section-label">Innstillinger</div>
            </div>
            <div className="panel-list">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="list-row"
                style={{ cursor: "pointer", textAlign: "left", width: "100%" }}
              >
                <div className="plate-icon" aria-hidden>
                  ⚙
                </div>
                <div className="row-main">
                  <div className="row-name">Personlig info</div>
                  <div className="row-meta">Navn, mål, nivå, utstyr, preferanser</div>
                </div>
                <span className="row-trail">›</span>
              </button>

              <Link href="/historikk" className="list-row">
                <div className="plate-icon" aria-hidden>
                  📋
                </div>
                <div className="row-main">
                  <div className="row-name">Historikk</div>
                  <div className="row-meta">Alle fullførte økter</div>
                </div>
                <span className="row-trail">›</span>
              </Link>

              <Link href="/body" className="list-row">
                <div className="plate-icon" aria-hidden>
                  ⚖
                </div>
                <div className="row-main">
                  <div className="row-name">Kropp</div>
                  <div className="row-meta">Vekt og mål over tid</div>
                </div>
                <span className="row-trail">›</span>
              </Link>

              <button
                type="button"
                onClick={logout}
                className="list-row"
                style={{ cursor: "pointer", textAlign: "left", width: "100%" }}
              >
                <div className="plate-icon" aria-hidden>
                  ⏻
                </div>
                <div className="row-main">
                  <div className="row-name">Logg ut</div>
                  <div className="row-meta">{profile.email ?? ""}</div>
                </div>
                <span className="row-trail">›</span>
              </button>
            </div>
          </section>

          <div className="footnote">AI Coach · forged daily</div>
        </div>
      </div>

      <ProfileSettings
        initialProfile={initialProfile}
        accessToken={accessToken}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  )
}
