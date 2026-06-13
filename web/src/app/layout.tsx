import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { themeInitScript } from "@/components/theme/theme-init"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
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
    <html lang="no" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="h-full bg-background font-sans flex justify-center" suppressHydrationWarning>
        <div className="relative w-full max-w-[390px] h-full bg-background text-foreground shadow-2xl overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  )
}
