import type { ProjectRecord } from '@/store/projectTypes'

export function formatProjectDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function projectTotalQuantity(project: ProjectRecord): number {
  return project.plates.reduce((sum, plate) => sum + plate.profile.fabrication.quantity, 0)
}

/** Count of distinct plate shape types in the project (e.g. Z + Channel → 2). */
export function projectDistinctTypeCount(project: ProjectRecord): number {
  const types = new Set(
    project.plates.map((plate) => plate.selectedTemplate ?? 'custom'),
  )
  return types.size
}

export function projectWeightNumeric(project: ProjectRecord): number {
  return project.weightKg
}
