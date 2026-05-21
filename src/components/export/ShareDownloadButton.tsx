import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { draftPlateExportBasenameFromProfile } from '@/export/exportFilenames'
import { generateFabricationZip } from '@/export/generateZip'
import { pdfClientNameFromUser } from '@/export/pdfExportTypes'
import type { FoldedProfile } from '@/geometry/types'
import { useProfileMetrics } from '@/hooks/useProfileMetrics'
import { useAppStore } from '@/store/appStore'
import { useProfileStore } from '@/store/profileStore'

interface ShareDownloadButtonProps {
  profile: FoldedProfile
}

export function ShareDownloadButton({ profile }: ShareDownloadButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedTemplate = useProfileStore((s) => s.selectedTemplate)
  const user = useAppStore((s) => s.user)
  const metrics = useProfileMetrics(profile)

  const handleExport = async () => {
    setLoading(true)
    setError(null)
    try {
      const archiveBasename = draftPlateExportBasenameFromProfile(profile)
      const blob = await generateFabricationZip(
        profile,
        metrics,
        selectedTemplate,
        'full',
        { clientName: pdfClientNameFromUser(user) },
        archiveBasename,
      )
      const filename = `${archiveBasename}.zip`
      const file = new File([blob], filename, { type: 'application/zip' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: profile.fabrication.partName || profile.name,
          text: 'Fabrication package from FOLDS',
        })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" size="lg" onClick={handleExport} disabled={loading}>
        {loading ? 'Generating…' : 'Share / Download Package'}
      </Button>
      {error && <p className="text-center text-sm text-red-400">{error}</p>}
    </div>
  )
}
