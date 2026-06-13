"use client"
import { useState } from "react"
import Link from "next/link"
import type { FullProfile } from "@/lib/profile"
import Icon from "@/components/brand/Icon"
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

function dayLabel(iso: string): string {
  const then = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - then.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days === 0) return "I dag"
  if (days === 1) return "I går"
  if (days < 7) return `${days} d siden`
  return then.toLocaleDateString("no-NO", { day: "numeric", month: "short" })
}

function StatTile({
  emoji,
  iconName,
  value,
  suffix,
  label,
}: {
  emoji?: string
  iconName?: "chart" | "trend"
  value: string
  suffix?: string
  label: string
}) {
  return (
    <div
      style={{
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        borderRadius: 12,
        padding: "14px 12px",
      }}
    >
      <div style={{ height: 22, marginBottom: 10, color: "var(--brand-orange)" }}>
        {emoji ? (
          <span style={{ fontSize: 20, lineHeight: 1 }}>{emoji}</span>
        ) : iconName ? (
          <Icon name={iconName} size={22} />
        ) : null}
      </div>
      <div
        className="tnum"
        style={{
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: "var(--brand-ink)",
        }}
      >
        {value}
        {suffix && (
          <span
            style={{
              fontSize: 12,
              color: "var(--brand-muted)",
              fontWeight: 500,
              marginLeft: 3,
              letterSpacing: 0,
            }}
          >
            {suffix}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--brand-muted)",
          fontWeight: 500,
          marginTop: 6,
          letterSpacing: 0.05,
        }}
      >
        {label}
      </div>
    </div>
  )
}

export default function ProfileClient({
  initialProfile,
  accessToken,
  stats,
  recentWorkouts,
  activeProgram,
}: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const profile = initialProfile
  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase()

  return (
    <>
      <div
        style={{
          padding: 20,
          background: "var(--brand-canvas)",
          color: "var(--brand-ink)",
          minHeight: "100%",
        }}
      >
        {/* Tappable header */}
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          style={{
            width: "100%",
            background: "var(--brand-surface)",
            border: "1px solid var(--brand-border)",
            borderRadius: 14,
            padding: 14,
            display: "flex",
            alignItems: "center",
            gap: 14,
            cursor: "pointer",
            textAlign: "left",
            marginBottom: 18,
          }}
        >
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={`${profile.first_name} ${profile.last_name}`}
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                background: "var(--brand-orange)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 19,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                flexShrink: 0,
              }}
            >
              {initials || "👤"}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--brand-ink)",
              }}
            >
              {profile.first_name} {profile.last_name}
            </span>
            <span
              style={{
                color: "var(--brand-muted)",
                fontSize: 12,
                marginTop: 2,
              }}
            >
              Innstillinger og profil →
            </span>
          </div>
          <span style={{ color: "var(--brand-faint)", fontSize: 18 }}>›</span>
        </button>

        {/* Stat tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 22,
          }}
        >
          <StatTile emoji="💪" value={stats.totalWorkouts.toString()} label="Økter totalt" />
          <StatTile emoji="🔥" value={stats.streak.toString()} suffix="d" label="Streak" />
          <StatTile
            iconName="chart"
            value={stats.totalVolumeT.toFixed(1)}
            suffix="t"
            label="Total tonnage"
          />
        </div>

        {/* Active program */}
        {activeProgram && (
          <div style={{ marginBottom: 22 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: "var(--brand-muted)",
                marginBottom: 8,
                paddingLeft: 4,
              }}
            >
              Aktivt program
            </div>
            <div
              style={{
                background: "var(--brand-surface)",
                border: "1px solid var(--brand-border)",
                borderRadius: 12,
                padding: 14,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  background: "var(--brand-subtle)",
                  color: "var(--brand-orange)",
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name="program" size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--brand-ink)" }}>
                  {activeProgram.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--brand-muted)", marginTop: 2 }}>
                  {activeProgram.dayCount}-dagers program
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick links to tracking sub-pages */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 22 }}
        >
          <Link href="/historikk" style={quickLinkStyle}>
            <span style={{ fontSize: 20 }}>📋</span>
            <span style={quickLinkLabelStyle}>Historikk</span>
          </Link>
          <Link href="/kalender" style={quickLinkStyle}>
            <span style={{ fontSize: 20 }}>📅</span>
            <span style={quickLinkLabelStyle}>Kalender</span>
          </Link>
          <Link href="/body" style={quickLinkStyle}>
            <span style={{ fontSize: 20 }}>⚖️</span>
            <span style={quickLinkLabelStyle}>Kropp</span>
          </Link>
        </div>

        {/* Recent workouts */}
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: "var(--brand-muted)",
              marginBottom: 8,
              paddingLeft: 4,
            }}
          >
            Siste økter
          </div>
          {recentWorkouts.length === 0 ? (
            <div
              style={{
                background: "var(--brand-surface)",
                border: "1px dashed var(--brand-border)",
                borderRadius: 12,
                padding: 24,
                textAlign: "center",
                color: "var(--brand-muted)",
                fontSize: 13,
              }}
            >
              Ingen økter logget enda
            </div>
          ) : (
            <div
              style={{
                background: "var(--brand-surface)",
                border: "1px solid var(--brand-border)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {recentWorkouts.map((w, i) => (
                <div
                  key={w.id}
                  style={{
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    borderTop: i === 0 ? "none" : "1px solid var(--brand-border)",
                  }}
                >
                  <div
                    style={{
                      background: "var(--brand-subtle)",
                      color: "var(--brand-orange)",
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="okt" size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--brand-ink)" }}>
                      {dayLabel(w.completed_at)}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--brand-muted)", marginTop: 2 }}>
                      {w.set_count} sett{w.rpe ? ` · RPE ${w.rpe}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

const quickLinkStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
  padding: "14px 8px",
  background: "var(--brand-surface)",
  border: "1px solid var(--brand-border)",
  borderRadius: 12,
  textDecoration: "none",
  color: "inherit",
}

const quickLinkLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--brand-ink)",
  letterSpacing: 0.3,
}
