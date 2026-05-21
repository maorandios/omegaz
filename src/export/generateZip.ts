import JSZip from 'jszip'
import type { FoldedProfile } from '@/geometry/types'
import type { ProfileMetrics } from '@/lib/profileMetrics'
import { generateExcel } from './generateExcel'
import { generatePdf } from './generatePdf'
import type { PdfExportOptions } from './pdfExportTypes'
import { generatePreviewPng } from './generatePreviewPng'

export type PlateZipMode = 'drawings' | 'full'

export async function generateFabricationZip(
  profile: FoldedProfile,
  metrics: ProfileMetrics,
  templateId?: string | null,
  mode: PlateZipMode = 'full',
  options?: PdfExportOptions,
  /** File stem inside the zip (no extension), e.g. segments_proj_plate_p01_… */
  archiveBasename?: string,
): Promise<Blob> {
  if (mode === 'drawings') {
    return generatePdf(profile, metrics, options)
  }

  const zip = new JSZip()
  const stem = archiveBasename ?? 'segments_plate'

  const pdfBlob = generatePdf(profile, metrics, options)
  const xlsxBlob = generateExcel(profile, metrics, templateId, options)

  zip.file(`${stem}.pdf`, pdfBlob)
  zip.file(`${stem}_cutlist.xlsx`, xlsxBlob)

  const preview = await generatePreviewPng(profile)
  if (preview) {
    zip.file('preview.png', preview)
  }

  return zip.generateAsync({ type: 'blob' })
}
