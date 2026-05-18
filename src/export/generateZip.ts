import JSZip from 'jszip'
import type { FoldedProfile } from '@/geometry/types'
import { generateExcel } from './generateExcel'
import { generatePdf } from './generatePdf'
import { generatePreviewPng } from './generatePreviewPng'

interface ProfileMetrics {
  flatWidth: number
  bendCount: number
  bounds: { width: number; height: number }
  area: number
  weight: number
}

export async function generateFabricationZip(
  profile: FoldedProfile,
  metrics: ProfileMetrics,
  templateId?: string | null,
): Promise<Blob> {
  const zip = new JSZip()

  const pdfBlob = generatePdf(profile, metrics)
  const xlsxBlob = generateExcel(profile, metrics, templateId)

  zip.file('drawing.pdf', pdfBlob)
  zip.file('cut-list.xlsx', xlsxBlob)

  const preview = await generatePreviewPng(profile)
  if (preview) {
    zip.file('preview.png', preview)
  }

  return zip.generateAsync({ type: 'blob' })
}
