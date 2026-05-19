import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectMetricCardProps {
  icon: LucideIcon
  value: number
  label: string
  unit?: string
  className?: string
}

function formatMetricValue(value: number): string {
  if (!Number.isFinite(value)) return '0'
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(2)
}

export function ProjectMetricCard({ icon: Icon, value, label, unit, className }: ProjectMetricCardProps) {
  return (
    <div
      className={cn(
        'flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-surface/40 px-2 py-3 text-center',
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
      <span className="w-full text-[1.75rem] font-semibold leading-none tabular-nums text-foreground">
        {formatMetricValue(value)}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
        <span>{label}</span>
        {unit ? <span className="normal-case"> [{unit}]</span> : null}
      </span>
    </div>
  )
}
