import { Database, SquareCenterlineDashedHorizontal, Weight } from 'lucide-react'
import { PlateListRow } from '@/components/projects/PlateListRow'
import { ProjectMetricCard } from '@/components/projects/ProjectMetricCard'
import {
  formatProjectDate,
  projectDistinctTypeCount,
  projectTotalQuantity,
  projectWeightNumeric,
} from '@/components/projects/projectDetailUtils'
import { useAppStore } from '@/store/appStore'

export function ProjectDetailView() {
  const project = useAppStore((s) => s.getSelectedProject())
  const openPlateForEdit = useAppStore((s) => s.openPlateForEdit)

  if (!project) {
    return <p className="text-sm text-muted">Project not found.</p>
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

      {project.plates.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          No plates yet. Open Actions below to add your first plate.
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
    </div>
  )
}
