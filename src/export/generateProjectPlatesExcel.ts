import * as XLSX from 'xlsx'
import { createTemplateProfile } from '@/geometry/createTemplateProfile'
import { buildPlateInfoFieldsForExcel } from '@/export/plateInfoFields'
import { pdfExportOptionsForPlate, type PdfExportOptions } from '@/export/pdfExportTypes'
import { formatPdfDate } from '@/lib/format'
import { computeProfileMetrics } from '@/lib/profileMetrics'
import { plateDisplayName, type PlateRecord, type ProjectRecord } from '@/store/projectTypes'

const ID_HEADERS = ['Plate name', 'Plate number'] as const

function computeProjectTotalSqm(plates: PlateRecord[]): number {
  return plates.reduce((sum, plate) => {
    const metrics = computeProfileMetrics(plate.profile)
    const sqmPerUnit = metrics.area / 1_000_000
    const qty = Math.max(0, plate.profile.fabrication.quantity)
    return sum + sqmPerUnit * qty
  }, 0)
}

function projectInfoRows(project: ProjectRecord): (string | number)[][] {
  const totalSqm = computeProjectTotalSqm(project.plates)
  return [
    ['Project name', project.name],
    ['Project serial', project.serial],
    ['Date', formatPdfDate()],
    ['Plates qty', project.plates.length],
    ['Est. total weight (kg)', Math.round(project.weightKg * 100) / 100],
    ['Est. total sqm (m²)', Math.round(totalSqm * 1000) / 1000],
  ]
}

function plateInfoHeaderRow(project: ProjectRecord, options?: PdfExportOptions): string[] {
  const plate = project.plates[0]
  const profile = plate?.profile ?? createTemplateProfile('channel')
  const metrics = computeProfileMetrics(profile)
  const fields = buildPlateInfoFieldsForExcel(
    profile,
    metrics,
    plate
      ? { ...options, ...pdfExportOptionsForPlate(project, plate) }
      : options,
  )
  return [...ID_HEADERS, ...fields.map((f) => f.label)]
}

function plateInfoValueRow(
  project: ProjectRecord,
  plate: PlateRecord,
  options?: PdfExportOptions,
): (string | number)[] {
  const metrics = computeProfileMetrics(plate.profile)
  const fields = buildPlateInfoFieldsForExcel(plate.profile, metrics, {
    ...options,
    ...pdfExportOptionsForPlate(project, plate),
  })
  return [plateDisplayName(plate), plate.serial, ...fields.map((f) => f.value)]
}

export function generateProjectPlatesExcel(
  project: ProjectRecord,
  options?: PdfExportOptions,
): Blob {
  const specHeaders = plateInfoHeaderRow(project, options).slice(ID_HEADERS.length)

  const rows: (string | number)[][] = [
    ...projectInfoRows(project),
    [],
    plateInfoHeaderRow(project, options),
  ]

  for (const plate of project.plates) {
    rows.push(plateInfoValueRow(project, plate, options))
  }

  if (project.plates.length === 0) {
    rows.push(['—', '—', ...specHeaders.map(() => '—')])
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Plates')

  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
