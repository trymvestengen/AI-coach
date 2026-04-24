type IconProps = { size?: number; active?: boolean; dir?: "right" | "down" | "left" }

export const HomeIcon = ({ size = 22, active = false }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6h-6v6H5.5A1.5 1.5 0 0 1 4 19v-8.5Z"
      stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
      fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.18 : 0}/>
  </svg>
)

export const DumbbellIcon = ({ size = 22, active = false }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <path d="M3 10v4M6 7v10M18 7v10M21 10v4"/>
    <path d="M6 12h12" strokeWidth={active ? "3" : "1.6"}/>
  </svg>
)

export const CoachOrbIcon = ({ size = 22, active = false }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6"
      fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.25 : 0}/>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.55"/>
  </svg>
)

export const SocialIcon = ({ size = 22, active = false }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="9" r="3.2" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.2 : 0}/>
    <circle cx="17" cy="11" r="2.6"/>
    <path d="M3 20c0.6-3.2 3-5 6-5s5.4 1.8 6 5"/>
    <path d="M15 19.5c0.5-2.4 2-3.8 4-3.8"/>
  </svg>
)

export const ProfileIcon = ({ size = 22, active = false }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <circle cx="12" cy="8.5" r="3.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.2 : 0}/>
    <path d="M4.5 20c1.2-3.6 4.2-5.5 7.5-5.5s6.3 1.9 7.5 5.5" strokeLinecap="round"/>
  </svg>
)

export const MicIcon = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="3" width="6" height="12" rx="3"/>
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>
  </svg>
)

export const MicOffIcon = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4l16 16"/>
    <path d="M9 5a3 3 0 0 1 6 0v6M15 13.5a3 3 0 0 1-5.9.5"/>
    <path d="M5 11a7 7 0 0 0 12 4.9M19 11a7 7 0 0 1-.3 2M12 18v3"/>
  </svg>
)

export const KeyboardIcon = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="6" width="19" height="12" rx="2.5"/>
    <path d="M6 10h0M10 10h0M14 10h0M18 10h0M6 14h12"/>
  </svg>
)

export const XIcon = ({ size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M6 18L18 6"/>
  </svg>
)

export const ArrowUpIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 19V5M6 11l6-6 6 6"/>
  </svg>
)

export const FlameIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13.5 2.5c.8 3-1.5 4.5-2.8 6.5-1.3 2-1.5 4 .3 4 1.2 0 1.8-.9 2-2 .8 1 1.5 2.5 1.5 4a5 5 0 1 1-10 0c0-3 2-5 3.5-6.8C9.8 6 10.5 4 10 2c2 .2 3 .5 3.5.5Z"/>
  </svg>
)

export const BoltIcon = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>
  </svg>
)

export const ChevronIcon = ({ size = 16, dir = "right" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: dir === "down" ? "rotate(90deg)" : dir === "left" ? "rotate(180deg)" : "none" }} aria-hidden="true">
    <path d="M9 6l6 6-6 6"/>
  </svg>
)
