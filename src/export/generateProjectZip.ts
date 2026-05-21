import JSZip from 'jszip'
import { generateProjectDrawingsPdf } from '@/export/generateProjectDrawingsPdf'
import { generateProjectPlatesExcel } from '@/export/generateProjectPlatesExcel'
import { generatePdf } from '@/export/generatePdf'
import { pdfExportOptionsForPlate, type PdfExportOptions } from '@/export/pdfExportTypes'
import {
  platePdfFilename,
  platesListExcelFilename,
  projectDrawingsPdfFilename,
} from '@/export/exportFilenames'
import { computeProfileMetrics } from '@/lib/profileMetrics'
import type { ProjectRecord } from '@/store/projectTypes'
import type { StoredUser } from '@/store/userTypes'

export type ProjectZipMode = 'drawings' | 'full'

/**
 * Full project package: plates list Excel, combined drawings PDF, and one PDF per plate.
 */
export async function generateProjectZip(
  project: ProjectRecord,
  mode: ProjectZipMode = 'full',
  options?: PdfExportOptions,
  user?: StoredUser,
): Promise<Blob> {
  const zip = new JSZip()

  if (mode !== 'full') {
    return generateProjectDrawingsPdf(project, options)
  }

  zip.file(platesListExcelFilename(), generateProjectPlatesExcel(project, options))
  zip.file(
    projectDrawingsPdfFilename(project, user),
    generateProjectDrawingsPdf(project, options),
  )

  for (const plate of project.plates) {
    const metrics = computeProfileMetrics(plate.profile)
    zip.file(
      platePdfFilename(project, plate),
      generatePdf(plate.profile, metrics, {
        clientName: options?.clientName,
        ...pdfExportOptionsForPlate(project, plate),
      }),
    )
  }

  return zip.generateAsync({ type: 'blob' })
}
