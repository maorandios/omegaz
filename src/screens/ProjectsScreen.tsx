import type { ReactNode } from 'react'
import { Calendar, MoveRight, Square, Weight } from 'lucide-react'
import { ProjectDetailView } from '@/components/projects/ProjectDetailView'
import { formatKg } from '@/lib/format'
import { useAppStore } from '@/store/appStore'

function formatProjectDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function MetaItem({
  icon: Icon,
  children,
}: {
  icon: typeof Square
  children: ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
      <span>{children}</span>
    </span>
  )
}

export function ProjectsScreen() {
  const user = useAppStore((s) => s.user)
  const projects = useAppStore((s) => s.projects)
  const selectedProjectId = useAppStore((s) => s.selectedProjectId)
  const setSelectedProject = useAppStore((s) => s.setSelectedProject)

  if (selectedProjectId) {
    return <ProjectDetailView />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[1.2rem] font-semibold leading-tight text-foreground">
          Hello, {user.fullName.trim() || 'there'}
        </h2>
      </div>

      {projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          No projects yet. Go to Create, name a project, and add your first plate.
        </p>
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li key={project.id}>
              <button
                type="button"
                onClick={() => setSelectedProject(project.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface/80 px-4 py-3 text-left transition-colors hover:border-border hover:bg-surface"
              >
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
                    <MetaItem icon={Calendar}>{formatProjectDate(project.updatedAt)}</MetaItem>
                  </p>
                </div>
                <MoveRight className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
