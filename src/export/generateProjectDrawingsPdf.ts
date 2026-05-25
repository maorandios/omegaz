import { jsPDF } from 'jspdf'
import { appendPlateDrawingPage } from '@/export/generatePdf'
import { pdfExportOptionsForPlate, type PdfExportOptions } from '@/export/pdfExportTypes'
import { computeProfileMetrics } from '@/lib/profileMetrics'
import type { ProjectRecord } from '@/store/projectTypes'

/** All plate drawings in one multi-page PDF (one page per plate). */
export async function generateProjectDrawingsPdf(
  project: ProjectRecord,
  options?: PdfExportOptions,
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  if (project.plates.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text('No plates in this project.', 14, 20)
    return doc.output('blob')
  }

  for (const [index, plate] of project.plates.entries()) {
    if (index > 0) doc.addPage()
    const metrics = computeProfileMetrics(plate.profile)
    // Spread plate options first, then let caller-provided clientName win so
    // an explicit "—" fallback from pdfExportOptionsForPlate (when no user was
    // passed) does not erase the user-derived clientName.
    await appendPlateDrawingPage(doc, plate.profile, metrics, {
      ...pdfExportOptionsForPlate(project, plate),
      clientName: options?.clientName,
    })
  }

  return doc.output('blob')
}
