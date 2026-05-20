import type { LucideIcon } from 'lucide-react'
import { formatNumber, metricCardValueClass } from '@/lib/format'
import { cn } from '@/lib/utils'

interface ProjectMetricCardProps {
  icon: LucideIcon
  value: number
  label: string
  unit?: string
  /** Decimal places; omit for auto (integers plain, else up to 2). */
  decimals?: number
  className?: string
}

export function ProjectMetricCard({
  icon: Icon,
  value,
  label,
  unit,
  decimals,
  className,
}: ProjectMetricCardProps) {
  const formatted = formatNumber(value, decimals)

  return (
    <div
      className={cn(
        'flex aspect-square min-w-0 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-border bg-surface/40 px-1.5 py-3 text-center',
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
      <span
        className={cn(
          'w-full max-w-full shrink px-0.5 font-semibold tabular-nums text-foreground',
          metricCardValueClass(formatted),
        )}
        title={formatted}
      >
        {formatted}
      </span>
      <span className="px-0.5 text-[10px] font-medium uppercase leading-tight tracking-wider text-muted">
        <span>{label}</span>
        {unit ? <span className="normal-case"> [{unit}]</span> : null}
      </span>
    </div>
  )
}
