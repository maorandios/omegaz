import { jsPDF } from 'jspdf'
import { appendPlateDrawingPage } from '@/export/generatePdf'
import { pdfExportOptionsForPlate, type PdfExportOptions } from '@/export/pdfExportTypes'
import { computeProfileMetrics } from '@/lib/profileMetrics'
import type { ProjectRecord } from '@/store/projectTypes'

/** All plate drawings in one multi-page PDF (one page per plate). */
export function generateProjectDrawingsPdf(
  project: ProjectRecord,
  options?: PdfExportOptions,
): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  if (project.plates.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text('No plates in this project.', 14, 20)
    return doc.output('blob')
  }

  project.plates.forEach((plate, index) => {
    if (index > 0) doc.addPage()
    const metrics = computeProfileMetrics(plate.profile)
    appendPlateDrawingPage(doc, plate.profile, metrics, {
      clientName: options?.clientName,
      ...pdfExportOptionsForPlate(project, plate),
    })
  })

  return doc.output('blob')
}
