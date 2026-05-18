import { MoveRight, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ProjectDetailView } from '@/components/projects/ProjectDetailView'
import { DeleteProjectSheet } from '@/components/projects/DeleteProjectSheet'
import { Button } from '@/components/ui/button'
import { formatKg } from '@/lib/format'
import { useAppStore } from '@/store/appStore'
import { userDisplayName } from '@/store/userTypes'

function formatProjectDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function ProjectsScreen() {
  const user = useAppStore((s) => s.user)
  const projects = useAppStore((s) => s.projects)
  const selectedProjectId = useAppStore((s) => s.selectedProjectId)
  const setSelectedProject = useAppStore((s) => s.setSelectedProject)
  const deleteProject = useAppStore((s) => s.deleteProject)

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  if (selectedProjectId) {
    return <ProjectDetailView />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-100">
          Hello, {userDisplayName(user)}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">Your fabrication project batches</p>
      </div>

      {projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-700 px-4 py-8 text-center text-sm text-zinc-500">
          No projects yet. Go to Create, name a project, and add your first plate.
        </p>
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li key={project.id} className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedProject(project.id)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-900"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-100">{project.name}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    <span className="font-mono text-zinc-300">{project.serial}</span>
                    <span className="mx-1.5 text-zinc-600">·</span>
                    {project.plates.length} plate{project.plates.length === 1 ? '' : 's'}
                    <span className="mx-1.5 text-zinc-600">·</span>
                    {formatKg(project.weightKg)}
                    <span className="mx-1.5 text-zinc-600">·</span>
                    {formatProjectDate(project.updatedAt)}
                  </p>
                </div>
                <MoveRight
                  className="h-5 w-5 shrink-0 text-amber-400"
                  aria-hidden
                />
              </button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 self-center text-zinc-500 hover:text-red-400"
                aria-label={`Delete ${project.name}`}
                onClick={() => setDeleteTarget({ id: project.id, name: project.name })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {deleteTarget && (
        <DeleteProjectSheet
          open
          projectName={deleteTarget.name}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null)
          }}
          onConfirm={() => deleteProject(deleteTarget.id)}
        />
      )}
    </div>
  )
}
