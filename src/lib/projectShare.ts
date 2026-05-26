import { calculateAreaEstimate } from '@/geometry/calculateAreaEstimate'
import { calculateGeometricFlatWidth } from '@/geometry/calculateGeometricFlatWidth'
import { formatAreaM2, formatInteger, formatKg } from '@/lib/format'
import type { PackageMode } from '@/lib/packageMode'
import { getTemplateDisplayName } from '@/templates/definitions'
import {
  computeProjectWeightKg,
  type PlateRecord,
  type ProjectRecord,
} from '@/store/projectTypes'

const APP_URL = 'https://www.getsegments.co'

/** Placeholder package URL until projects are hosted in a real backend. */
export function getProjectPackageUrl(projectId: string): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://app.getsegments.co'
  return `${origin}/p/${projectId}`
}

function summarizeProfileTypes(plates: PlateRecord[]): string {
  if (plates.length === 0) return '—'
  const names = new Set<string>()
  for (const plate of plates) names.add(getTemplateDisplayName(plate.selectedTemplate))
  return Array.from(names).join(', ')
}

function totalProjectQuantity(plates: PlateRecord[]): number {
  return plates.reduce((sum, plate) => {
    const qty = Math.max(0, plate.profile.fabrication.quantity)
    return sum + qty
  }, 0)
}

/** Total fabricated area across every plate (mm² × quantity). */
function totalProjectAreaMm2(plates: PlateRecord[]): number {
  return plates.reduce((sum, plate) => {
    const { profile } = plate
    const qty = Math.max(0, profile.fabrication.quantity)
    const flatWidth = calculateGeometricFlatWidth(profile.segments)
    const perPart = calculateAreaEstimate(flatWidth, profile.fabrication.partLength)
    return sum + perPart * qty
  }, 0)
}

export function buildProjectShareMessage(
  project: ProjectRecord,
  _mode: PackageMode = 'full',
): string {
  const profileType = summarizeProfileTypes(project.plates)
  const quantity = formatInteger(totalProjectQuantity(project.plates))
  const weight = formatKg(computeProjectWeightKg(project.plates))
  const sqm = formatAreaM2(totalProjectAreaMm2(project.plates))

  return [
    `Project Name: ${project.name}`,
    `Profile Type: ${profileType}`,
    `Quantity: ${quantity}`,
    `Est. Weight: ${weight}`,
    `Est. Sqm: ${sqm}`,
    '',
    `Generated with ${APP_URL}`,
  ].join('\n')
}

export function buildProjectSharePayload(
  project: ProjectRecord,
  mode: PackageMode,
): { title: string; text: string; mailtoSubject: string; mailtoBody: string } {
  const text = buildProjectShareMessage(project, mode)
  const subject = `Segments project — ${project.name} (${project.serial})`
  return {
    title: `${project.name} (${project.serial})`,
    text,
    mailtoSubject: subject,
    mailtoBody: text,
  }
}

export function buildProjectMailto(
  project: ProjectRecord,
  mode: PackageMode = 'full',
): { subject: string; body: string } {
  const payload = buildProjectSharePayload(project, mode)
  return { subject: payload.mailtoSubject, body: payload.mailtoBody }
}

export function openWhatsAppShare(text: string): void {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
}

export function openEmailShare(subject: string, body: string): void {
  const params = new URLSearchParams({
    subject,
    body,
  })
  window.location.href = `mailto:?${params.toString()}`
}
