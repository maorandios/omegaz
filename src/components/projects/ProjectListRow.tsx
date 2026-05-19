import { Box, Calendar, MoveRight, Square, Weight } from 'lucide-react'
import { MetaItem } from '@/components/projects/MetaItem'
import { formatKg } from '@/lib/format'
import type { ProjectRecord } from '@/store/projectTypes'

interface ProjectListRowProps {
  project: ProjectRecord
  onClick: () => void
  showDate?: boolean
}

function formatProjectDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function ProjectListRow({ project, onClick, showDate = false }: ProjectListRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface/40 px-4 py-4.5 text-left transition-colors hover:border-border hover:bg-surface/55"
    >
      <Box className="h-6 w-6 shrink-0 stroke-[1.75px] text-primary" aria-hidden />

      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-1.5 truncate font-medium text-foreground">
          <span className="truncate">{project.name}</span>
          <span className="shrink-0 text-muted/60">·</span>
          <span className="shrink-0 font-mono text-sm text-muted">{project.serial}</span>
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <MetaItem icon={Square}>
            {project.plates.length} plate{project.plates.length === 1 ? '' : 's'}
          </MetaItem>
          <MetaItem icon={Weight}>{formatKg(project.weightKg)}</MetaItem>
          {showDate ? (
            <MetaItem icon={Calendar}>{formatProjectDate(project.updatedAt)}</MetaItem>
          ) : null}
        </p>
      </div>

      <MoveRight className="h-5 w-5 shrink-0 text-primary" aria-hidden />
    </button>
  )
}
