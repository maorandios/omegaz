import { ProfileCanvas } from '@/components/canvas/ProfileCanvas'
import { SaveToProjectButton } from '@/components/export/SaveToProjectButton'
import { FLAT_WIDTH_LABEL } from '@/geometry/types'
import { useProfileMetrics } from '@/hooks/useProfileMetrics'
import { formatKg, formatMm } from '@/lib/format'
import { useProfileStore } from '@/store/profileStore'

export function SummaryScreen() {
  const profile = useProfileStore((s) => s.profile)!
  const selectedTemplate = useProfileStore((s) => s.selectedTemplate)
  const fab = profile.fabrication
  const metrics = useProfileMetrics(profile)

  return (
    <div className="space-y-5">
      <div className="fabrication-preview mx-auto w-full max-w-sm">
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-background">
          <ProfileCanvas
            profile={profile}
            showLabels
            accentPreview
            className="h-full w-full bg-background"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface/80 p-4 text-sm">
        <p className="font-medium text-foreground">{fab.partName || profile.name}</p>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-foreground/90">
          <dt className="text-muted">Material</dt>
          <dd>{fab.material}</dd>
          <dt className="text-muted">Thickness</dt>
          <dd>{formatMm(fab.thickness)}</dd>
          <dt className="text-muted">Part Length</dt>
          <dd>{formatMm(fab.partLength)}</dd>
          <dt className="text-muted">Quantity</dt>
          <dd>{fab.quantity}</dd>
          <dt className="text-muted">Hem</dt>
          <dd>{fab.hem ? 'Yes' : 'No'}</dd>
          <dt className="text-muted">Finish</dt>
          <dd>{fab.finish}</dd>
          <dt className="text-muted">{FLAT_WIDTH_LABEL}</dt>
          <dd>{formatMm(metrics.flatWidth)}</dd>
          <dt className="text-muted">Est. Weight</dt>
          <dd>{formatKg(metrics.weight)}</dd>
        </dl>
        {fab.notes && (
          <p className="mt-2 text-muted">
            <span className="text-muted">Notes: </span>
            {fab.notes}
          </p>
        )}
      </div>

      <SaveToProjectButton profile={profile} selectedTemplate={selectedTemplate} />
    </div>
  )
}
