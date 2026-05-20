import { useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import type { PlateRecord, ProjectRecord } from '@/store/projectTypes'

export function useViewingPlate(): { project: ProjectRecord; plate: PlateRecord } | null {
  const viewingPlateId = useAppStore((s) => s.viewingPlateId)
  const selectedProjectId = useAppStore((s) => s.selectedProjectId)
  const projects = useAppStore((s) => s.projects)

  return useMemo(() => {
    if (!viewingPlateId || !selectedProjectId) return null
    const project = projects.find((p) => p.id === selectedProjectId)
    const plate = project?.plates.find((p) => p.id === viewingPlateId)
    if (!project || !plate) return null
    return { project, plate }
  }, [viewingPlateId, selectedProjectId, projects])
}
