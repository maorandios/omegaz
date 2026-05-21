import JSZip from 'jszip'
import { generateExcel } from '@/export/generateExcel'
import { generateProjectPlatesExcel } from '@/export/generateProjectPlatesExcel'
import { generatePdf } from '@/export/generatePdf'
import { pdfExportOptionsForPlate, type PdfExportOptions } from '@/export/pdfExportTypes'
import { generatePreviewPng } from '@/export/generatePreviewPng'
import { buildProjectShareMessage } from '@/lib/projectShare'
import { computeProfileMetrics } from '@/lib/profileMetrics'
import {
  plateCutListExcelFilename,
  platePdfFilename,
  platesListExcelFilename,
} from '@/export/exportFilenames'
import { slugify } from '@/lib/format'
import { plateDisplayName, type ProjectRecord } from '@/store/projectTypes'

export type ProjectZipMode = 'drawings' | 'full'

export async function generateProjectZip(
  project: ProjectRecord,
  mode: ProjectZipMode = 'full',
  options?: PdfExportOptions,
): Promise<Blob> {
  const zip = new JSZip()
  const rootName = slugify(`${project.name}-${project.serial}`)
  const root = zip.folder(rootName) ?? zip

  for (const plate of project.plates) {
    const plateSlug = slugify(plateDisplayName(plate)) || 'plate'
    const folder = root.folder(plateSlug) ?? root
    const metrics = computeProfileMetrics(plate.profile)

    folder.file(
      platePdfFilename(project, plate),
      generatePdf(plate.profile, metrics, {
        clientName: options?.clientName,
        ...pdfExportOptionsForPlate(project, plate),
      }),
    )

    if (mode === 'drawings') continue

    folder.file(
      plateCutListExcelFilename(project, plate),
      generateExcel(plate.profile, metrics, plate.selectedTemplate, options),
    )

    const preview = await generatePreviewPng(plate.profile)
    if (preview) {
      folder.file('preview.png', preview)
    }
  }

  if (mode === 'full') {
    root.file('README.txt', `${buildProjectShareMessage(project)}\n`)
    root.file(platesListExcelFilename(), generateProjectPlatesExcel(project))
  }

  return zip.generateAsync({ type: 'blob' })
}
