import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { generateFabricationZip } from '@/export/generateZip'
import type { FoldedProfile } from '@/geometry/types'
import { slugify, todayIsoDate } from '@/lib/format'
import { useProfileMetrics } from '@/hooks/useProfileMetrics'
import { useProfileStore } from '@/store/profileStore'

interface ShareDownloadButtonProps {
  profile: FoldedProfile
}

export function ShareDownloadButton({ profile }: ShareDownloadButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedTemplate = useProfileStore((s) => s.selectedTemplate)
  const metrics = useProfileMetrics(profile)

  const handleExport = async () => {
    setLoading(true)
    setError(null)
    try {
      const blob = await generateFabricationZip(profile, metrics, selectedTemplate)
      const partSlug = slugify(profile.fabrication.partName || profile.name)
      const filename = `${partSlug}-${todayIsoDate()}.zip`
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
