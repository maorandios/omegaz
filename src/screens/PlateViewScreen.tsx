import { useState } from 'react'
import { PlateSummaryContent } from '@/components/summary/PlateSummaryContent'
import { TopToast } from '@/components/ui/TopToast'
import { useViewingPlate } from '@/hooks/useViewingPlate'
import { useAppStore } from '@/store/appStore'

export function PlateViewScreen() {
  const ctx = useViewingPlate()
  const findPlateFavorite = useAppStore((s) => s.findPlateFavorite)
  const togglePlateFavorite = useAppStore((s) => s.togglePlateFavorite)
  const [favoriteBusy, setFavoriteBusy] = useState(false)
  const [showFavoriteToast, setShowFavoriteToast] = useState(false)
  const [favoriteToastMessage, setFavoriteToastMessage] = useState('Saved to favourites')

  if (!ctx) {
    return (
      <p className="text-sm text-muted">Plate not found.</p>
    )
  }

  const { plate } = ctx
  const isFavorite = Boolean(
    findPlateFavorite(plate.profile, plate.selectedTemplate),
  )

  const handleToggleFavorite = async () => {
    const removing = isFavorite
    setFavoriteBusy(true)
    try {
      await togglePlateFavorite(plate.profile, plate.selectedTemplate)
      setFavoriteToastMessage(removing ? 'Removed from favourites' : 'Saved to favourites')
      setShowFavoriteToast(false)
      window.requestAnimationFrame(() => setShowFavoriteToast(true))
    } finally {
      setFavoriteBusy(false)
    }
  }

  return (
    <>
      <TopToast
        show={showFavoriteToast}
        message={favoriteToastMessage}
        onHidden={() => setShowFavoriteToast(false)}
      />
      <PlateSummaryContent
        profile={plate.profile}
        selectedTemplate={plate.selectedTemplate}
        plateSerial={plate.serial}
        isFavorite={isFavorite}
        favoriteBusy={favoriteBusy}
        onToggleFavorite={handleToggleFavorite}
      />
    </>
  )
}
