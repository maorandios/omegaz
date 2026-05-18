import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { DeleteProjectSheet } from '@/components/projects/DeleteProjectSheet'
import { Button } from '@/components/ui/button'
import { getPlateShapeLabel } from '@/templates/definitions'
import { formatKg, formatMm } from '@/lib/format'
import { useAppStore } from '@/store/appStore'
import { plateDisplayName } from '@/store/projectTypes'
import { useProfileStore } from '@/store/profileStore'

function formatProjectDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function ProjectDetailView() {
  const project = useAppStore((s) => s.getSelectedProject())
  const setSelectedProject = useAppStore((s) => s.setSelectedProject)
  const setActiveProject = useAppStore((s) => s.setActiveProject)
  const setMainTab = useAppStore((s) => s.setMainTab)
  const openPlateForEdit = useAppStore((s) => s.openPlateForEdit)
  const deleteProject = useAppStore((s) => s.deleteProject)
  const deletePlate = useAppStore((s) => s.deletePlate)
  const restart = useProfileStore((s) => s.restart)

  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!project) {
    return (
      <p className="text-sm text-muted">Project not found.</p>
    )
  }

  const handleAddPlate = () => {
    restart()
    setActiveProject(project.id)
    setMainTab('create', { keepActiveProject: true })
  }

  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1 text-muted hover:text-foreground"
        onClick={() => setSelectedProject(null)}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All projects
      </Button>

      <div>
        <p className="font-mono text-sm text-primary">{project.serial}</p>
        <h2 className="mt-1 text-2xl font-semibold text-foreground">{project.name}</h2>
        <p className="mt-2 text-sm text-muted">
          {formatKg(project.weightKg)} total
          <span className="mx-1.5 text-muted/60">·</span>
          {project.plates.length} plate{project.plates.length === 1 ? '' : 's'}
          <span className="mx-1.5 text-muted/60">·</span>
          Updated {formatProjectDate(project.updatedAt)}
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="button" className="flex-1 gap-2" onClick={handleAddPlate}>
          <Plus className="h-4 w-4" aria-hidden />
          Add plate
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 text-red-400 hover:bg-red-950/40 hover:text-red-300"
          aria-label="Delete project"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {project.plates.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          No plates yet. Tap Add plate to start this batch.
        </p>
      ) : (
        <ul className="space-y-2">
          {project.plates.map((plate) => (
            <li key={plate.id}>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openPlateForEdit(project.id, plate.id)}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-surface/80 px-4 py-3 text-left transition-colors hover:border-border hover:bg-surface"
                >
                  <p className="truncate font-medium text-foreground">
                    {plateDisplayName(plate)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {plate.selectedTemplate
                      ? getPlateShapeLabel(plate.selectedTemplate)
                      : 'Custom'}
                    <span className="mx-1.5 text-muted/60">·</span>
                    {formatKg(plate.weightKg)}
                    <span className="mx-1.5 text-muted/60">·</span>
                    Qty {plate.profile.fabrication.quantity}
                    <span className="mx-1.5 text-muted/60">·</span>
                    {formatMm(plate.profile.fabrication.partLength)}
                  </p>
                </button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 self-center text-muted hover:text-red-400"
                  aria-label={`Remove ${plateDisplayName(plate)}`}
                  onClick={() => deletePlate(project.id, plate.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <DeleteProjectSheet
        open={deleteOpen}
        projectName={project.name}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          deleteProject(project.id)
          setSelectedProject(null)
        }}
      />
    </div>
  )
}
