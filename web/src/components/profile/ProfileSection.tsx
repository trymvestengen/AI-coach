import { ReactNode } from "react"

interface Props {
  title: string
  children: ReactNode
}

export default function ProfileSection({ title, children }: Props) {
  return (
    <section className="mb-8">
      <h2 className="text-[11px] uppercase tracking-widest text-neutral-500 mb-3">{title}</h2>
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {children}
      </div>
    </section>
  )
}
