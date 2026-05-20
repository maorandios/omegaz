import * as XLSX from 'xlsx'
import { buildWizardSteps } from '@/geometry/calculateProfilePoints'
import { getFabricationMaterialLabel } from '@/geometry/constants'
import { FLAT_WIDTH_LABEL, type FoldedProfile } from '@/geometry/types'

interface ProfileMetrics {
  flatWidth: number
  bendCount: number
  area: number
  weight: number
}

export function generateExcel(
  profile: FoldedProfile,
  metrics: ProfileMetrics,
  templateId?: string | null,
): Blob {
  const fab = profile.fabrication

  const summaryData = [
    ['Field', 'Value'],
    ['Part Name', fab.partName || profile.name],
    ['Material', getFabricationMaterialLabel(fab.material, fab.materialCustom)],
    ['Thickness (mm)', fab.thickness],
    ['Part Length (mm)', fab.partLength],
    ['Quantity', fab.quantity],
    ['Hem', fab.hem ? 'Yes' : 'No'],
    ['Checker plate', fab.checkerPlate ? 'Yes' : 'No'],
    ['Finish', fab.finish],
    ['Notes', fab.notes],
    [FLAT_WIDTH_LABEL + ' (mm)', metrics.flatWidth],
    ['Bend Count', metrics.bendCount],
    ['Estimated Area (mm²)', metrics.area],
    ['Estimated Weight (kg)', metrics.weight],
  ]

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
