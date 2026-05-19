import * as XLSX from 'xlsx'
import { getPlateShapeLabel } from '@/templates/definitions'
import { plateDisplayName, type ProjectRecord } from '@/store/projectTypes'

export function generateProjectPlatesExcel(project: ProjectRecord): Blob {
  const rows: (string | number)[][] = [
    ['Project', project.name],
    ['Serial', project.serial],
    ['Total weight (kg)', project.weightKg],
    ['Plate count', project.plates.length],
    [],
    ['Plate', 'Shape', 'Weight (kg)', 'Quantity', 'Length (mm)'],
  ]

  for (const plate of project.plates) {
    rows.push([
      plateDisplayName(plate),
      plate.selectedTemplate ? getPlateShapeLabel(plate.selectedTemplate) : 'Custom',
      plate.weightKg,
      plate.profile.fabrication.quantity,
      plate.profile.fabrication.partLength,
    ])
  }

  if (project.plates.length === 0) {
    rows.push(['—', '—', '—', '—', '—'])
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Plates')

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
