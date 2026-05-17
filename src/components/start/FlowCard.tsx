import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface FlowCardProps {
  title: string
  description: string
  icon: ReactNode
  onClick: () => void
  className?: string
}

export function FlowCard({ title, description, icon, onClick, className }: FlowCardProps) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <Card
        className={cn(
          'cursor-pointer transition-colors hover:border-amber-500/50 hover:bg-zinc-800/80 active:scale-[0.99]',
          className,
        )}
      >
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
            {icon}
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="sr-only">Select {title}</CardContent>
      </Card>
    </button>
  )
}
