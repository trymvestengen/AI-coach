"use client"

export type SocialVariant = "google" | "apple" | "email"

interface Props {
  variant: SocialVariant
  onClick: () => void
  busy?: boolean
}

const LABELS: Record<SocialVariant, string> = {
  google: "Fortsett med Google",
  apple: "Fortsett med Apple",
  email: "Fortsett med e-post",
}

export default function SocialButton({ variant, onClick, busy }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="btn btn-ghost btn-block"
      style={{ marginBottom: 10, opacity: busy ? 0.7 : 1, fontSize: 14, fontWeight: 600 }}
    >
      <Icon variant={variant} />
      <span>{busy ? "Logger inn…" : LABELS[variant]}</span>
    </button>
  )
}

function Icon({ variant }: { variant: SocialVariant }) {
  if (variant === "apple") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M11.182.008c.015-.05.02-.057.03-.057-.073.59-.197 1.124-.572 1.586-.34.42-.857.79-1.501.79-.014-.45.16-.91.42-1.234.288-.36.79-.643 1.184-.71l.439-.375zM13.05 12.21c-.354.834-.79 1.624-1.385 2.31-.522.6-1.072 1.21-1.812 1.222-.736.012-.97-.43-1.81-.43-.84 0-1.1.418-1.795.442-.715.024-1.262-.65-1.789-1.249C2.42 13.27 1.255 10.385 2.358 8.43c.546-.966 1.527-1.578 2.59-1.593.704-.013 1.367.473 1.795.473.434 0 1.242-.586 2.094-.5.357.014 1.36.144 2.005 1.087-.05.033-1.197.7-1.183 2.085.012 1.66 1.453 2.213 1.47 2.221z" />
      </svg>
    )
  }
  if (variant === "google") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <path
          fill="#4285F4"
          d="M15.68 8.182c0-.566-.05-1.111-.146-1.636H8v3.091h4.305a3.68 3.68 0 0 1-1.594 2.413v2.005h2.582c1.51-1.39 2.387-3.435 2.387-5.873z"
        />
        <path
          fill="#34A853"
          d="M8 16c2.16 0 3.97-.715 5.293-1.945l-2.582-2.005c-.715.48-1.63.762-2.711.762-2.085 0-3.85-1.408-4.48-3.302H.857v2.069A8 8 0 0 0 8 16z"
        />
        <path
          fill="#FBBC05"
          d="M3.52 9.51A4.8 4.8 0 0 1 3.27 8c0-.523.09-1.03.25-1.51V4.422H.857A8 8 0 0 0 0 8c0 1.29.31 2.51.857 3.578L3.52 9.51z"
        />
        <path
          fill="#EA4335"
          d="M8 3.182c1.175 0 2.23.404 3.058 1.198l2.294-2.295C11.965.79 10.155 0 8 0A8 8 0 0 0 .857 4.422L3.52 6.49C4.15 4.596 5.915 3.182 8 3.182z"
        />
      </svg>
    )
  }
  // email
  return <span style={{ fontSize: 16 }}>✉️</span>
}
