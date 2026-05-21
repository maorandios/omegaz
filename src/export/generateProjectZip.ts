import JSZip from 'jszip'
import { generateExcel } from '@/export/generateExcel'
import { generateProjectPlatesExcel } from '@/export/generateProjectPlatesExcel'
import { generatePdf } from '@/export/generatePdf'
import { generatePreviewPng } from '@/export/generatePreviewPng'
import { buildProjectShareMessage } from '@/lib/projectShare'
import { computeProfileMetrics } from '@/lib/profileMetrics'
import { slugify } from '@/lib/format'
import { plateDisplayName, type ProjectRecord } from '@/store/projectTypes'

export type ProjectZipMode = 'drawings' | 'full'

export async function generateProjectZip(
  project: ProjectRecord,
  mode: ProjectZipMode = 'full',
): Promise<Blob> {
  const zip = new JSZip()
  const rootName = slugify(`${project.name}-${project.serial}`)
  const root = zip.folder(rootName) ?? zip

  for (const plate of project.plates) {
    const plateSlug = slugify(plateDisplayName(plate)) || 'plate'
    const folder = root.folder(plateSlug) ?? root
    const metrics = computeProfileMetrics(plate.profile)

    folder.file('drawing.pdf', generatePdf(plate.profile, metrics))

    if (mode === 'drawings') continue

    folder.file('cut-list.xlsx', generateExcel(plate.profile, metrics, plate.selectedTemplate))

    const preview = await generatePreviewPng(plate.profile)
    if (preview) {
      folder.file('preview.png', preview)
    }
  }

  if (mode === 'full') {
    root.file('README.txt', `${buildProjectShareMessage(project)}\n`)
    root.file('plates-list.xlsx', generateProjectPlatesExcel(project))
  }

  return zip.generateAsync({ type: 'blob' })
}
