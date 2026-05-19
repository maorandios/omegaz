import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface MetaItemProps {
  icon: LucideIcon
  children: ReactNode
}

export function MetaItem({ icon: Icon, children }: MetaItemProps) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
      <span>{children}</span>
    </span>
  )
}
