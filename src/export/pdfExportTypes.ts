import type { StoredUser } from '@/store/userTypes'

export interface PdfExportOptions {
  /** Shown in the plate info block (defaults to —). */
  clientName?: string
}

export function pdfClientNameFromUser(user: StoredUser): string {
  return user.businessName?.trim() || user.fullName.trim() || '—'
}
