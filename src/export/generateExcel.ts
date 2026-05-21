import * as XLSX from 'xlsx'
import { buildWizardSteps } from '@/geometry/calculateProfilePoints'
import type { FoldedProfile } from '@/geometry/types'
import { buildPlateInfoFieldsForExcel } from '@/export/plateInfoFields'
import type { PdfExportOptions } from '@/export/pdfExportTypes'
import type { ProfileMetrics } from '@/lib/profileMetrics'

export function generateExcel(
  profile: FoldedProfile,
  metrics: ProfileMetrics,
  templateId?: string | null,
  options?: PdfExportOptions,
): Blob {
  const fields = buildPlateInfoFieldsForExcel(profile, metrics, options)
  const summaryData = [fields.map((f) => f.label), fields.map((f) => f.value)]

  const cutList: (string | number)[][] = [
    ['Order', 'Type', 'Value', 'Unit', 'Notes'],
  ]

  const steps = buildWizardSteps(profile, templateId)
  let segNum = 0
  let bendNum = 0

  steps.forEach((step, order) => {
    if (step.type === 'segment') {
      segNum++
      const seg = profile.segments.find((s) => s.id === step.id)!
      cutList.push([order + 1, `Segment ${segNum}`, seg.length, 'mm', ''])
    } else {
      bendNum++
      const bend = profile.bends.find((b) => b.id === step.id)!
      cutList.push([
        order + 1,
        `Bend ${bendNum}`,
        bend.interiorAngle ?? bend.angle,
        'deg',
        '',
      ])
    }
  })

  const wb = XLSX.utils.book_new()
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
  const ws2 = XLSX.utils.aoa_to_sheet(cutList)
  XLSX.utils.book_append_sheet(wb, ws1, 'Job Summary')
  XLSX.utils.book_append_sheet(wb, ws2, 'Cut List')

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
