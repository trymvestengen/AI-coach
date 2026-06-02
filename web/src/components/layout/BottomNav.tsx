"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Icon, { type IconName } from "@/components/brand/Icon"

interface Tab {
  href: string
  label: string
  icon: IconName
}

const tabs: Tab[] = [
  { href: "/home", label: "Hjem", icon: "home" },
  { href: "/program", label: "Program", icon: "program" },
  { href: "/coach", label: "Coach", icon: "coach" },
  { href: "/profile", label: "Profil", icon: "profile" },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--brand-surface)",
        borderTop: "1px solid var(--brand-border)",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        paddingTop: 10,
        paddingBottom: "max(14px, env(safe-area-inset-bottom))",
        zIndex: 10,
      }}
    >
      {tabs.map(({ href, label, icon }) => {
        const active = pathname === href || (href !== "/home" && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              color: active ? "var(--brand-orange)" : "var(--brand-muted)",
              textDecoration: "none",
            }}
          >
            <Icon name={icon} size={22} filled={active} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 0.05,
                textTransform: "uppercase",
              }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
