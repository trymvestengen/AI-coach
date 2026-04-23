"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ClipboardList, PlusCircle, Users, User } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/home", icon: Home, label: "Hjem" },
  { href: "/program", icon: ClipboardList, label: "Program" },
  { href: "/log", icon: PlusCircle, label: "Logg" },
  { href: "/social", icon: Users, label: "Sosialt" },
  { href: "/profile", icon: User, label: "Profil" },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center justify-around px-2 z-50">
      {tabs.map(({ href, icon: Icon, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
