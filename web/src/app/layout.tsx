import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })

export const metadata: Metadata = {
  title: "AI Coach",
  description: "Din personlige AI-trener",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" className={`${geist.variable} h-full antialiased`}>
      <body className="h-full bg-zinc-100 dark:bg-zinc-900 font-sans flex justify-center">
        <div className="relative w-full max-w-[390px] h-full bg-background text-foreground shadow-2xl overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  )
}
