import { ProfileCanvas } from '@/components/canvas/ProfileCanvas'
import { PlateShapeThumb } from '@/components/projects/PlateShapeThumb'
import { getFabricationMaterialLabel } from '@/geometry/constants'
import type { FoldedProfile } from '@/geometry/types'
import { useProfileMetrics } from '@/hooks/useProfileMetrics'
import { formatInteger, formatMmValue, formatWeightParts } from '@/lib/format'
import { cn } from '@/lib/utils'

function ReviewRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={cn('summary-review__row', highlight && 'summary-review__row--highlight')}>
      <span className="summary-review__label">{label}</span>
      <span className="summary-review__value">{value}</span>
    </div>
  )
}

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No'
}

interface PlateSummaryContentProps {
  profile: FoldedProfile
  selectedTemplate: string | null
}

export function PlateSummaryContent({ profile, selectedTemplate }: PlateSummaryContentProps) {
  const fab = profile.fabrication
  const metrics = useProfileMetrics(profile)
  const weightPerPart = formatWeightParts(metrics.weight)
  const weightTotal = formatWeightParts(metrics.weight * fab.quantity)

  return (
    <div className="summary-screen">
      <div className="fabrication-preview mx-auto w-full max-w-sm">
        <div className="aspect-square w-full overflow-hidden rounded-2xl bg-background">
          <ProfileCanvas
            profile={profile}
            showLabels
            accentPreview
            className="h-full w-full bg-background"
          />
        </div>
      </div>

      <section className="summary-review" aria-labelledby="summary-review-title">
        <header className="summary-review__header">
          <PlateShapeThumb templateId={selectedTemplate} size="sm" />
          <h2 id="summary-review-title" className="summary-review__title">
            {fab.partName || profile.name}
          </h2>
        </header>

        <div className="summary-review__body">
          <ReviewRow
            label="Material"
            value={getFabricationMaterialLabel(fab.material, fab.materialCustom)}
          />
          <ReviewRow label="Thickness (mm)" value={formatMmValue(fab.thickness)} />
          <ReviewRow label="Part length (mm)" value={formatMmValue(fab.partLength)} />
          <ReviewRow label="Quantity" value={formatInteger(fab.quantity)} />
          <ReviewRow label="Finish" value={fab.finish} />
          <ReviewRow label="Hem" value={yesNo(fab.hem)} />
          <ReviewRow label="Checker plate" value={yesNo(fab.checkerPlate)} />
          <ReviewRow
            label="Est. flat width (mm)"
            value={formatMmValue(metrics.flatWidth)}
            highlight
          />
          <ReviewRow
            label={`Est. weight per part (${weightPerPart.unit})`}
            value={weightPerPart.value}
            highlight
          />
          <ReviewRow
            label={`Est. weight total (${weightTotal.unit})`}
            value={weightTotal.value}
            highlight
          />
        </div>

        {fab.notes.trim() ? (
          <div className="summary-review__notes">
            <p className="summary-review__label">Notes</p>
            <p className="summary-review__notes-text">{fab.notes}</p>
          </div>
        ) : null}
      </section>
    </div>
  )
}
