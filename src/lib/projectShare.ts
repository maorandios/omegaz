import { formatKg } from '@/lib/format'
import type { ProjectRecord } from '@/store/projectTypes'

/** Placeholder package URL until projects are hosted in a real backend. */
export function getProjectPackageUrl(projectId: string): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://folds.app'
  return `${origin}/p/${projectId}`
}

export function buildProjectShareMessage(project: ProjectRecord): string {
  const url = getProjectPackageUrl(project.id)
  const plateCount = project.plates.length
  const platesLine =
    plateCount === 0
      ? 'No plates in this batch yet.'
      : `${plateCount} plate${plateCount === 1 ? '' : 's'} · ${formatKg(project.weightKg)} total`

  return [
    `FOLDS project: ${project.name} (${project.serial})`,
    platesLine,
    '',
    `View and download the full package:`,
    url,
  ].join('\n')
}

export function buildProjectMailto(project: ProjectRecord): { subject: string; body: string } {
  return {
    subject: `FOLDS project — ${project.name} (${project.serial})`,
    body: buildProjectShareMessage(project),
  }
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
