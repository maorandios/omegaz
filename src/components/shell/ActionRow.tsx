import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ActionRowProps {
  icon: LucideIcon
  title: string
  description: string
  destructive?: boolean
  disabled?: boolean
  onSelect: () => void
}

export function ActionRow({
  icon: Icon,
  title,
  description,
  destructive,
  disabled,
  onSelect,
}: ActionRowProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border border-border bg-surface/40 px-4 py-4 text-left transition-colors',
        'hover:border-border hover:bg-surface/55 active:bg-surface/55',
        'disabled:pointer-events-none disabled:opacity-50',
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 shrink-0 stroke-[1.75px]',
          destructive ? 'text-destructive' : 'text-primary',
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block text-sm font-medium',
            destructive ? 'text-destructive' : 'text-foreground',
          )}
        >
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-muted">{description}</span>
      </span>
    </button>
  )
}
