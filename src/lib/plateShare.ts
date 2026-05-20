import { formatKg } from '@/lib/format'
import { getProjectPackageUrl } from '@/lib/projectShare'
import {
  computePlateWeightKg,
  plateDisplayName,
  type PlateRecord,
  type ProjectRecord,
} from '@/store/projectTypes'

export function buildPlateShareMessage(project: ProjectRecord, plate: PlateRecord): string {
  const url = getProjectPackageUrl(project.id)
  const name = plateDisplayName(plate)
  const weight = formatKg(computePlateWeightKg(plate.profile))

  return [
    `FOLDS plate: ${name}`,
    `Project: ${project.name} (${project.serial})`,
    `Est. weight (qty × part): ${weight}`,
    '',
    `View project package:`,
    url,
  ].join('\n')
}

export function buildPlateMailto(
  project: ProjectRecord,
  plate: PlateRecord,
): { subject: string; body: string } {
  const name = plateDisplayName(plate)
  return {
    subject: `FOLDS plate — ${name} (${project.serial})`,
    body: buildPlateShareMessage(project, plate),
  }
}
