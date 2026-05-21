import { plateDisplayName, type PlateRecord, type ProjectRecord } from '@/store/projectTypes'
import type { StoredUser } from '@/store/userTypes'

export interface PdfExportOptions {
  /** Shown in the plate info block (defaults to —). */
  clientName?: string
  projectName?: string
  projectSerial?: string
  plateName?: string
  plateSerial?: string
}

export function pdfClientNameFromUser(user: StoredUser): string {
  return user.businessName?.trim() || user.fullName.trim() || '—'
}

export function pdfExportOptionsForPlate(
  project: ProjectRecord,
  plate: PlateRecord,
  user?: StoredUser,
): PdfExportOptions {
  return {
    clientName: user ? pdfClientNameFromUser(user) : undefined,
    projectName: project.name,
    projectSerial: project.serial,
    plateName: plateDisplayName(plate),
    plateSerial: plate.serial,
  }
}
