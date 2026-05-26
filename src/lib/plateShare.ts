import type { PackageMode } from '@/lib/packageMode'
import { formatInteger, formatKg, formatMmValue } from '@/lib/format'
import { getFabricationMaterialLabel } from '@/geometry/constants'
import { normalizeFabrication } from '@/geometry/types'
import { getTemplateDisplayName } from '@/templates/definitions'
import {
  computePlateWeightKg,
  plateDisplayName,
  type PlateRecord,
  type ProjectRecord,
} from '@/store/projectTypes'

const APP_URL = 'https://www.getsegments.co'

export function buildPlateShareMessage(
  project: ProjectRecord,
  plate: PlateRecord,
  _mode: PackageMode = 'full',
): string {
  const fab = normalizeFabrication(plate.profile.fabrication)
  const type = getTemplateDisplayName(plate.selectedTemplate)
  const material = getFabricationMaterialLabel(fab.material, fab.materialCustom)
  const quantity = formatInteger(fab.quantity)
  const thickness = `${formatMmValue(fab.thickness)} mm`
  const weight = formatKg(computePlateWeightKg(plate.profile))

  return [
    `Project Name: ${project.name}`,
    `Type: ${type}`,
    `Material: ${material}`,
    `Quantity: ${quantity}`,
    `Thickness: ${thickness}`,
    `Est. Weight: ${weight}`,
    '',
    `Generated with ${APP_URL}`,
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
