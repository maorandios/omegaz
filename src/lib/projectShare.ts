import { formatKg } from '@/lib/format'
import type { PackageMode } from '@/lib/packageMode'
import { computeProjectWeightKg, type ProjectRecord } from '@/store/projectTypes'

/** Placeholder package URL until projects are hosted in a real backend. */
export function getProjectPackageUrl(projectId: string): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://app.getsegments.co'
  return `${origin}/p/${projectId}`
}

function projectAttachmentLine(mode: PackageMode): string {
  return mode === 'drawings'
    ? 'Drawings only (one combined PDF).'
    : 'Full package (plates list, combined PDF, and one PDF per plate).'
}

export function buildProjectShareMessage(
  project: ProjectRecord,
  mode: PackageMode = 'full',
): string {
  const url = getProjectPackageUrl(project.id)
  const plateCount = project.plates.length
  const platesLine =
    plateCount === 0
      ? 'No plates in this batch yet.'
      : `${plateCount} plate${plateCount === 1 ? '' : 's'} · ${formatKg(computeProjectWeightKg(project.plates))} total`

  return [
    `Segments project: ${project.name} (${project.serial})`,
    platesLine,
    '',
    projectAttachmentLine(mode),
    `View project: ${url}`,
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
