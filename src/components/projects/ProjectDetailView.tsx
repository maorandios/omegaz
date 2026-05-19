import { Database, Plus, SquareCenterlineDashedHorizontal, Trash2, Weight } from 'lucide-react'
import { useState } from 'react'
import { DeleteProjectSheet } from '@/components/projects/DeleteProjectSheet'
import { PlateListRow } from '@/components/projects/PlateListRow'
import { ProjectMetricCard } from '@/components/projects/ProjectMetricCard'
import {
  formatProjectDate,
  projectDistinctTypeCount,
  projectTotalQuantity,
  projectWeightNumeric,
} from '@/components/projects/projectDetailUtils'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/appStore'
import { useProfileStore } from '@/store/profileStore'

export function ProjectDetailView() {
  const project = useAppStore((s) => s.getSelectedProject())
  const setSelectedProject = useAppStore((s) => s.setSelectedProject)
  const setActiveProject = useAppStore((s) => s.setActiveProject)
  const setMainTab = useAppStore((s) => s.setMainTab)
  const openPlateForEdit = useAppStore((s) => s.openPlateForEdit)
  const deleteProject = useAppStore((s) => s.deleteProject)
  const restart = useProfileStore((s) => s.restart)

  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!project) {
    return <p className="text-sm text-muted">Project not found.</p>
  }

  const handleAddPlate = () => {
    restart()
    setActiveProject(project.id)
    setMainTab('create', { keepActiveProject: true })
  }

  const totalQuantity = projectTotalQuantity(project)
  const typeCount = projectDistinctTypeCount(project)
  const weightValue = projectWeightNumeric(project)

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-sm text-primary">
          {project.serial}
          <span className="mx-1.5 text-muted/60">·</span>
          <span className="font-sans text-muted">{formatProjectDate(project.updatedAt)}</span>
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-foreground">{project.name}</h2>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <ProjectMetricCard icon={Weight} value={weightValue} label="Weight" unit="kg" />
        <ProjectMetricCard icon={SquareCenterlineDashedHorizontal} value={typeCount} label="Type" />
        <ProjectMetricCard icon={Database} value={totalQuantity} label="Quantity" />
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
              <PlateListRow
                plate={plate}
                onOpen={() => openPlateForEdit(project.id, plate.id)}
              />
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

