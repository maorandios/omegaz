import { getPlateShapeLabel } from '@/templates/definitions'
import { plateDisplayName, type ProjectRecord } from '@/store/projectTypes'

export interface ProjectFilters {
  query: string
  shapeIds: string[]
}

function projectSearchHaystack(project: ProjectRecord): string {
  const parts = [
    project.name,
    project.serial,
    ...project.plates.map((plate) => plateDisplayName(plate)),
    ...project.plates.map((plate) => getPlateShapeLabel(plate.selectedTemplate)),
  ]
  return parts.join(' ').toLowerCase()
}

function matchesQuery(project: ProjectRecord, query: string): boolean {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true
  const haystack = projectSearchHaystack(project)
  return tokens.every((token) => haystack.includes(token))
}

function matchesShapes(project: ProjectRecord, shapeIds: string[]): boolean {
  if (shapeIds.length === 0) return true
  const projectShapes = new Set(
    project.plates.map((plate) => plate.selectedTemplate ?? 'custom'),
  )
  return shapeIds.some((id) => projectShapes.has(id))
}

export function filterProjects(
  projects: ProjectRecord[],
  filters: ProjectFilters,
): ProjectRecord[] {
  return projects.filter(
    (project) => matchesQuery(project, filters.query) && matchesShapes(project, filters.shapeIds),
  )
}
