import { MoveRight } from 'lucide-react'
import { PlateShapeThumb } from '@/components/projects/PlateShapeThumb'
import { getFabricationMaterialLabel } from '@/geometry/constants'
import { formatMmValue } from '@/lib/format'
import type { PlateFavoriteRecord } from '@/store/favoriteTypes'

interface FavoritePlateCardProps {
  favorite: PlateFavoriteRecord
  onClick: () => void
}

export function FavoritePlateCard({ favorite, onClick }: FavoritePlateCardProps) {
  const fab = favorite.profile.fabrication
  const material = getFabricationMaterialLabel(fab.material, fab.materialCustom)
  const subtitle = `${material} · ${formatMmValue(fab.thickness)} mm`

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface/40 px-4 py-3.5 text-left transition-colors hover:border-border hover:bg-surface/55 active:scale-[0.99]"
    >
      <PlateShapeThumb templateId={favorite.selectedTemplate} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-foreground">{favorite.name}</span>
        <span className="block truncate text-xs text-muted">{subtitle}</span>
      </span>
      <MoveRight className="h-5 w-5 shrink-0 text-primary" aria-hidden />
    </button>
  )
}
