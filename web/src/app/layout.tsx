import type { Metadata } from "next"
import Script from "next/script"
import { Inter, Archivo, Space_Mono } from "next/font/google"
import "./globals.css"
import { themeInitScript } from "@/components/theme/theme-init"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

// Display: Archivo med bredde-akse (~Archivo Expanded). Industriell, breddet —
// brukes på overskrifter (frontend-design/Ember). font-stretch settes i CSS.
const display = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["wdth"],
  display: "swap",
})

// Mono: alle tall (tabular readout)
const mono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  weight: ["400", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "AI Coach",
  description: "Din smarte treningskompis",
  applicationName: "AI Coach",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI Coach",
  },
  formatDetection: { telephone: false },
}

export const viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover" as const,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="no"
      className={`${inter.variable} ${display.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full bg-background font-sans flex justify-center" suppressHydrationWarning>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <div className="relative w-full max-w-[390px] h-full bg-background text-foreground shadow-2xl overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  )
}
