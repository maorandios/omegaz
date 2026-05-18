import { useEffect } from 'react'
import { ProfileCanvas } from '@/components/canvas/ProfileCanvas'
import { ShareDownloadButton } from '@/components/export/ShareDownloadButton'
import { SegmentBendTable } from '@/components/summary/SegmentBendTable'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { buildWizardSteps } from '@/geometry/calculateProfilePoints'
import { FLAT_WIDTH_LABEL } from '@/geometry/types'
import { useProfileMetrics } from '@/hooks/useProfileMetrics'
import { formatKg, formatMm } from '@/lib/format'
import { useAppStore } from '@/store/appStore'
import { useProfileStore } from '@/store/profileStore'

export function SummaryScreen() {
  const profile = useProfileStore((s) => s.profile)!
  const selectedTemplate = useProfileStore((s) => s.selectedTemplate)
  const saveProjectFromProfile = useAppStore((s) => s.saveProjectFromProfile)

  useEffect(() => {
    saveProjectFromProfile(profile, selectedTemplate)
  }, [profile, selectedTemplate, saveProjectFromProfile])
  const activeItemId = useProfileStore((s) => s.activeItemId)
  const setStep = useProfileStore((s) => s.setStep)
  const setWizardIndex = useProfileStore((s) => s.setWizardIndex)
  const fab = profile.fabrication
  const metrics = useProfileMetrics(profile)

  const steps = buildWizardSteps(profile)
  const activeStep = steps.find((s) => s.id === activeItemId)
  let detailText = 'Tap a row to inspect segment or bend details.'
  if (activeStep?.type === 'segment') {
    const seg = profile.segments.find((s) => s.id === activeStep.id)!
    const idx = profile.segments.findIndex((s) => s.id === activeStep.id) + 1
    detailText = `Segment ${idx}: straight leg, length ${formatMm(seg.length)}.`
  } else if (activeStep?.type === 'bend') {
    const bend = profile.bends.find((b) => b.id === activeStep.id)!
    const idx = profile.bends.findIndex((b) => b.id === activeStep.id) + 1
    detailText = `Bend ${idx}: interior angle ${bend.angle}° between adjacent segments.`
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Review Order</h2>
        <p className="text-sm text-zinc-400">Confirm dimensions and specs before exporting.</p>
      </div>

      <ProfileCanvas profile={profile} activeItemId={activeItemId} showLabels className="h-52" />

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-sm">
        <p className="font-medium text-zinc-100">{fab.partName || profile.name}</p>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-zinc-300">
          <dt className="text-zinc-500">Material</dt>
          <dd>{fab.material}</dd>
          <dt className="text-zinc-500">Thickness</dt>
          <dd>{formatMm(fab.thickness)}</dd>
          <dt className="text-zinc-500">Part Length</dt>
          <dd>{formatMm(fab.partLength)}</dd>
          <dt className="text-zinc-500">Quantity</dt>
          <dd>{fab.quantity}</dd>
          <dt className="text-zinc-500">Finish</dt>
          <dd>{fab.finish}</dd>
          <dt className="text-zinc-500">{FLAT_WIDTH_LABEL}</dt>
          <dd>{formatMm(metrics.flatWidth)}</dd>
          <dt className="text-zinc-500">Est. Weight</dt>
          <dd>{formatKg(metrics.weight)}</dd>
        </dl>
        {fab.notes && (
          <p className="mt-2 text-zinc-400">
            <span className="text-zinc-500">Notes: </span>
            {fab.notes}
          </p>
        )}
      </div>

      <SegmentBendTable profile={profile} />

      <p className="rounded-md bg-zinc-900/80 px-3 py-2 text-sm text-amber-400/90">{detailText}</p>

      <Separator />

      <div className="grid gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setWizardIndex(0)
            setStep('segment-wizard')
          }}
        >
          Edit Geometry
        </Button>
        <Button variant="outline" onClick={() => setStep('fabrication')}>
          Edit Fabrication Details
        </Button>
        <ShareDownloadButton profile={profile} />
      </div>
    </div>
  )
}
