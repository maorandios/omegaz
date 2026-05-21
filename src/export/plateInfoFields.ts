import { calculateGeometricFlatWidth } from '@/geometry/calculateGeometricFlatWidth'
import { getFabricationMaterialLabel } from '@/geometry/constants'
import { getFabricationGrade, normalizeFabrication, type FoldedProfile } from '@/geometry/types'
import type { PdfExportOptions } from '@/export/pdfExportTypes'
import type { ProfileMetrics } from '@/lib/profileMetrics'
import { formatInteger, formatMmValue, formatNumber, formatPdfDate } from '@/lib/format'

export interface PlateInfoField {
  label: string
  value: string | number
}

/** Plate info fields in PDF grid order: left column, center, right, then Notes. */
export function buildPlateInfoFields(
  profile: FoldedProfile,
  metrics: ProfileMetrics,
  options?: PdfExportOptions,
): PlateInfoField[] {
  const fab = normalizeFabrication(profile.fabrication)
  const flatWidth = calculateGeometricFlatWidth(profile.segments)
  const qty = Math.max(0, fab.quantity)
  const weightPerUnit = metrics.weight
  const totalWeight = weightPerUnit * qty
  const sqmPerUnit = metrics.area / 1_000_000
  const totalSqm = sqmPerUnit * qty
  const client = options?.clientName?.trim() || '—'
  const notes = fab.notes.trim() ? fab.notes.trim() : 'None'

  return [
    { label: 'Material', value: getFabricationMaterialLabel(fab.material, fab.materialCustom) },
    { label: 'Grade', value: getFabricationGrade(fab) },
    { label: 'Thickness', value: `${formatMmValue(fab.thickness)} mm` },
    { label: 'Quantity', value: formatInteger(qty) },
    { label: 'Finish', value: fab.finish || '—' },
    { label: 'Est. flat width (mm)', value: `${formatMmValue(flatWidth)} mm` },
    { label: 'Est. weight per unit (kg)', value: `${formatNumber(weightPerUnit, 2)} kg` },
    { label: 'Est. sqm per unit (m²)', value: `${formatNumber(sqmPerUnit, 3)} m²` },
    { label: 'Est. total weight (kg)', value: `${formatNumber(totalWeight, 2)} kg` },
    { label: 'Est. total sqm (m²)', value: `${formatNumber(totalSqm, 3)} m²` },
    { label: 'Client name', value: client },
    { label: 'Date', value: formatPdfDate() },
    { label: 'Hem', value: fab.hem ? 'Yes' : 'No' },
    { label: 'Checker Plate', value: fab.checkerPlate ? 'Yes' : 'No' },
    { label: 'Bend counts', value: formatInteger(metrics.bendCount) },
    { label: 'Notes', value: notes },
  ]
}
