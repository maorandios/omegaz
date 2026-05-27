import { Star } from 'lucide-react'
import { ProfileCanvas } from '@/components/canvas/ProfileCanvas'
import { PlateShapeThumb } from '@/components/projects/PlateShapeThumb'
import { getFabricationMaterialLabel } from '@/geometry/constants'
import { getFabricationGrade, type FoldedProfile } from '@/geometry/types'
import { useProfileMetrics } from '@/hooks/useProfileMetrics'
import { formatInteger, formatMmValue, formatNumber, formatWeightParts } from '@/lib/format'
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
  /** Plate serial within the project (e.g. p01); shown in the title when set. */
  plateSerial?: string
  isFavorite?: boolean
  favoriteBusy?: boolean
  onToggleFavorite?: () => void
}

export function PlateSummaryContent({
  profile,
  selectedTemplate,
  plateSerial,
  isFavorite = false,
  favoriteBusy = false,
  onToggleFavorite,
}: PlateSummaryContentProps) {
  const fab = profile.fabrication
  const metrics = useProfileMetrics(profile)
  const qty = Math.max(0, fab.quantity)
  const weightPerPart = formatWeightParts(metrics.weight)
  const weightTotal = formatWeightParts(metrics.weight * qty)
  const sqmPerUnit = metrics.area / 1_000_000
  const totalSqm = sqmPerUnit * qty

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
          <h2
            id="summary-review-title"
            className="summary-review__title flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5"
          >
            <span className="truncate">{fab.partName || profile.name}</span>
            {plateSerial?.trim() ? (
              <>
                <span className="shrink-0 text-muted/60" aria-hidden>
                  ·
                </span>
                <span className="shrink-0 font-mono font-semibold text-muted">
                  {plateSerial.trim()}
                </span>
              </>
            ) : null}
          </h2>
          {onToggleFavorite ? (
            <button
              type="button"
              onClick={onToggleFavorite}
              disabled={favoriteBusy}
              className={cn(
                'ml-auto flex max-w-[11rem] shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5 transition-colors',
                'hover:bg-surface/55 disabled:opacity-50',
                isFavorite && 'border-warning/40 bg-warning/10',
              )}
              aria-label={
                isFavorite ? 'Remove from favourites' : 'Save to favourites'
              }
            >
              <Star
                className={cn(
                  'h-4 w-4 shrink-0 stroke-[1.75px]',
                  isFavorite
                    ? 'fill-warning text-warning'
                    : 'text-muted',
                )}
                aria-hidden
              />
              <span
                className={cn(
                  'text-left text-[11px] font-semibold leading-tight',
                  isFavorite ? 'text-warning' : 'text-muted',
                )}
              >
                {isFavorite ? 'Remove from favourites' : 'Save to favourites'}
              </span>
            </button>
          ) : null}
        </header>

        <div className="summary-review__body">
          <ReviewRow
            label="Material"
            value={getFabricationMaterialLabel(fab.material, fab.materialCustom)}
          />
          <ReviewRow label="Grade" value={getFabricationGrade(fab)} />
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
            label="Est. sqm per unit (m²)"
            value={formatNumber(sqmPerUnit, 3)}
            highlight
          />
          <ReviewRow
            label={`Est. weight total (${weightTotal.unit})`}
            value={weightTotal.value}
            highlight
          />
          <ReviewRow
            label="Est. total sqm (m²)"
            value={formatNumber(totalSqm, 3)}
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
