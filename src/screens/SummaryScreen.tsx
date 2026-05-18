import { ProfileCanvas } from '@/components/canvas/ProfileCanvas'
import { SaveToProjectButton } from '@/components/export/SaveToProjectButton'
import { FLAT_WIDTH_LABEL } from '@/geometry/types'
import { useProfileMetrics } from '@/hooks/useProfileMetrics'
import { formatKg, formatMm } from '@/lib/format'
import { useProfileStore } from '@/store/profileStore'

export function SummaryScreen() {
  const profile = useProfileStore((s) => s.profile)!
  const selectedTemplate = useProfileStore((s) => s.selectedTemplate)
  const activeItemId = useProfileStore((s) => s.activeItemId)
  const fab = profile.fabrication
  const metrics = useProfileMetrics(profile)

  return (
    <div className="space-y-5">
      <div className="fabrication-preview mx-auto w-full max-w-sm">
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-zinc-950">
          <ProfileCanvas
            profile={profile}
            activeItemId={activeItemId}
            showLabels
            className="h-full w-full bg-zinc-950"
          />
        </div>
      </div>

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

      <SaveToProjectButton profile={profile} selectedTemplate={selectedTemplate} />
    </div>
  )
}
