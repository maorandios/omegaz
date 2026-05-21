import { getFabricationMaterialLabel } from '@/geometry/constants'
import { normalizeFabrication } from '@/geometry/types'
import { formatMmValue, slugify } from '@/lib/format'
import type { PlateRecord, ProjectRecord } from '@/store/projectTypes'
import type { StoredUser } from '@/store/userTypes'
import { pdfClientNameFromUser } from '@/export/pdfExportTypes'

export const PLATES_LIST_EXCEL_BASENAME = 'segments_PlatesList'

function part(value: string, fallback: string): string {
  return slugify(value) || fallback
}

/** PRJ01-style serial — keep casing, do not slugify. */
function projectSerialPart(serial: string): string {
  const cleaned = serial.trim().replace(/[^a-zA-Z0-9]/g, '')
  if (/^PRJ\d+$/i.test(cleaned)) {
    return cleaned.replace(/^prj/i, 'PRJ')
  }
  return cleaned || 'PRJ00'
}

function thicknessPart(mm: number): string {
  return `${formatMmValue(mm)}mm`
}

/** segments_[ProjectSerial]_[ProjectName]_[PlateId]_[Material]_[Thickness]mm */
export function plateExportBasename(project: ProjectRecord, plate: PlateRecord): string {
  const fab = normalizeFabrication(plate.profile.fabrication)
  const material = part(
    getFabricationMaterialLabel(fab.material, fab.materialCustom),
    'material',
  )
  return [
    'segments',
    projectSerialPart(project.serial),
    part(project.name, 'project'),
    part(plate.serial, 'plate'),
    material,
    thicknessPart(fab.thickness),
  ].join('_')
}

export function platePdfFilename(project: ProjectRecord, plate: PlateRecord): string {
  return `${plateExportBasename(project, plate)}.pdf`
}

export function plateCutListExcelFilename(project: ProjectRecord, plate: PlateRecord): string {
  return `${plateExportBasename(project, plate)}_cutlist.xlsx`
}

function exportUserPart(user?: StoredUser): string {
  if (!user) return 'Guest'
  return part(pdfClientNameFromUser(user), 'Guest')
}

/** segments_[ProjectSerial]_[ProjectName]_[UserName] */
export function projectExportBasename(project: ProjectRecord, user?: StoredUser): string {
  return [
    'segments',
    projectSerialPart(project.serial),
    part(project.name, 'project'),
    exportUserPart(user),
  ].join('_')
}

export function projectDrawingsPdfFilename(
  project: ProjectRecord,
  user?: StoredUser,
): string {
  return `${projectExportBasename(project, user)}.pdf`
}

export function projectPackageZipFilename(
  project: ProjectRecord,
  user?: StoredUser,
): string {
  return `${projectExportBasename(project, user)}.zip`
}

export function platesListExcelFilename(): string {
  return `${PLATES_LIST_EXCEL_BASENAME}.xlsx`
}

function draftBasenameFromProfile(profile: PlateRecord['profile']): string {
  const fab = normalizeFabrication(profile.fabrication)
  const material = part(
    getFabricationMaterialLabel(fab.material, fab.materialCustom),
    'material',
  )
  return [
    'segments',
    'draft',
    part(fab.partName || profile.name, 'plate'),
    material,
    thicknessPart(fab.thickness),
  ].join('_')
}

/** Workflow export before a plate is saved to a project. */
export function draftPlateExportBasename(plate: PlateRecord): string {
  return draftBasenameFromProfile(plate.profile)
}

export function draftPlateExportBasenameFromProfile(
  profile: PlateRecord['profile'],
): string {
  return draftBasenameFromProfile(profile)
}
