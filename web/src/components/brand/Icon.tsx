/**
 * Brand icon library — see docs/brand-board.html
 * Use: <Icon name="okt" size={20} />
 */

export type IconName =
  | "okt"
  | "chart"
  | "trend"
  | "stopwatch"
  | "play"
  | "home"
  | "program"
  | "coach"
  | "profile"

interface Props {
  name: IconName
  size?: number
  className?: string
  filled?: boolean
}

export default function Icon({ name, size = 20, className, filled }: Props) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    className,
    "aria-hidden": true,
  } as const

  switch (name) {
    case "okt":
      return (
        <svg {...props} fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="40 60"
            strokeLinecap="round"
            transform="rotate(-90 12 12)"
          />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      )
    case "chart":
      return (
        <svg {...props}>
          <rect x="3" y="13" width="4" height="8" rx="0.5" />
          <rect x="10" y="9" width="4" height="12" rx="0.5" />
          <rect x="17" y="5" width="4" height="16" rx="0.5" />
        </svg>
      )
    case "trend":
      return (
        <svg {...props} fill="none">
          <path
            d="M3 17 L9 11 L13 15 L21 6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 6 L21 6 L21 12"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case "stopwatch":
      return (
        <svg {...props} fill="none">
          <circle cx="12" cy="14" r="7.5" stroke="currentColor" strokeWidth="2" />
          <rect x="10" y="2" width="4" height="2.5" rx="0.5" fill="currentColor" />
          <rect x="11" y="4" width="2" height="2" fill="currentColor" />
          <path
            d="M12 9 L12 14 L16 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )
    case "play":
      return (
        <svg {...props}>
          <polygon points="7 4 20 12 7 20" />
        </svg>
      )
    case "home":
      return (
        <svg {...props} fill={filled ? "currentColor" : "none"}>
          <path
            d="M3 11 L12 3 L21 11 L21 20 a1 1 0 0 1 -1 1 h-5 v-7 h-6 v7 h-5 a1 1 0 0 1 -1 -1 z"
            stroke="currentColor"
            strokeWidth={filled ? 0 : 1.8}
            strokeLinejoin="round"
            fill={filled ? "currentColor" : "none"}
          />
        </svg>
      )
    case "program":
      return (
        <svg {...props} fill="none">
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
          {filled && <rect x="3" y="5" width="18" height="5" fill="currentColor" />}
          <rect x="7" y="2" width="2" height="5" rx="0.5" fill="currentColor" />
          <rect x="15" y="2" width="2" height="5" rx="0.5" fill="currentColor" />
          <circle cx="8" cy="14" r="1" fill="currentColor" />
          <circle cx="12" cy="14" r="1" fill="currentColor" />
          <circle cx="16" cy="14" r="1" fill="currentColor" />
        </svg>
      )
    case "coach":
      return (
        <svg {...props} fill={filled ? "currentColor" : "none"}>
          <path
            d="M4 6 a2 2 0 0 1 2-2 h12 a2 2 0 0 1 2 2 v8 a2 2 0 0 1 -2 2 h-6 l-4 4 v-4 h-2 a2 2 0 0 1 -2 -2 z"
            stroke="currentColor"
            strokeWidth={filled ? 0 : 1.8}
            fill={filled ? "currentColor" : "none"}
          />
          <circle cx="9" cy="10" r="1" fill={filled ? "white" : "currentColor"} />
          <circle cx="12" cy="10" r="1" fill={filled ? "white" : "currentColor"} />
          <circle cx="15" cy="10" r="1" fill={filled ? "white" : "currentColor"} />
        </svg>
      )
    case "profile":
      return (
        <svg {...props} fill={filled ? "currentColor" : "none"}>
          <circle
            cx="12"
            cy="8"
            r="4"
            stroke="currentColor"
            strokeWidth={filled ? 0 : 1.8}
            fill={filled ? "currentColor" : "none"}
          />
          <path
            d="M4 21 a8 8 0 0 1 16 0"
            stroke="currentColor"
            strokeWidth={filled ? 0 : 1.8}
            fill={filled ? "currentColor" : "none"}
          />
        </svg>
      )
  }
}
