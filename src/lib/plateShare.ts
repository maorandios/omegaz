import type { PackageMode } from '@/lib/packageMode'
import { formatKg } from '@/lib/format'
import { getProjectPackageUrl } from '@/lib/projectShare'
import {
  computePlateWeightKg,
  plateDisplayName,
  type PlateRecord,
  type ProjectRecord,
} from '@/store/projectTypes'

function plateAttachmentLine(mode: PackageMode): string {
  return mode === 'drawings'
    ? 'Drawing only (PDF).'
    : 'Full plate package (drawing, cut list, preview).'
}

export function buildPlateShareMessage(
  project: ProjectRecord,
  plate: PlateRecord,
  mode: PackageMode = 'full',
): string {
  const url = getProjectPackageUrl(project.id)
  const name = plateDisplayName(plate)
  const weight = formatKg(computePlateWeightKg(plate.profile))

  return [
    `Segments plate: ${name}`,
    `Project: ${project.name} (${project.serial})`,
    `Est. weight (qty × part): ${weight}`,
    '',
    plateAttachmentLine(mode),
    `View project: ${url}`,
  ].join('\n')
}

export function buildPlateSharePayload(
  project: ProjectRecord,
  plate: PlateRecord,
  mode: PackageMode,
): { title: string; text: string; mailtoSubject: string; mailtoBody: string } {
  const name = plateDisplayName(plate)
  const text = buildPlateShareMessage(project, plate, mode)
  const subject = `Segments plate — ${name} (${project.serial})`
  return {
    title: name,
    text,
    mailtoSubject: subject,
    mailtoBody: text,
  }
}

export function buildPlateMailto(
  project: ProjectRecord,
  plate: PlateRecord,
  mode: PackageMode = 'full',
): { subject: string; body: string } {
  const payload = buildPlateSharePayload(project, plate, mode)
  return { subject: payload.mailtoSubject, body: payload.mailtoBody }
}
