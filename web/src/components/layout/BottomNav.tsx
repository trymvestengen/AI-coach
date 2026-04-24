"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HomeIcon, DumbbellIcon, CoachOrbIcon, SocialIcon, ProfileIcon } from "@/components/ui/icons"

const tabs = [
  { href: "/home",    label: "Home",    Icon: HomeIcon },
  { href: "/program", label: "Workout", Icon: DumbbellIcon },
  { href: "/coach",   label: "Coach",   Icon: CoachOrbIcon },
  { href: "/social",  label: "Social",  Icon: SocialIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <div style={{
      position: "absolute",
      bottom: 0, left: 0, right: 0,
      paddingTop: 8, paddingBottom: 28,
      background: "linear-gradient(to top, #0A0A0B 55%, rgba(10,10,11,0) 100%)",
      display: "flex",
      justifyContent: "space-around",
      zIndex: 10,
    }}>
      {tabs.map(({ href, label, Icon }) => {
        const active = pathname === href || (href === "/coach" && pathname.startsWith("/coach"))
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "6px 0",
              color: active ? "var(--ai-accent)" : "var(--fg-3)",
              textDecoration: "none",
              border: "none",
              background: "none",
            }}
          >
            <Icon size={24} active={active} />
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.2 }}>{label}</span>
          </Link>
        )
      })}
    </div>
  )
}
