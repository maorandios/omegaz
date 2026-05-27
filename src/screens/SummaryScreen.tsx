import { useState } from 'react'
import { SaveToProjectButton } from '@/components/export/SaveToProjectButton'
import { PlateSummaryContent } from '@/components/summary/PlateSummaryContent'
import { TopToast } from '@/components/ui/TopToast'
import { useAppStore } from '@/store/appStore'
import { useProfileStore } from '@/store/profileStore'

export function SummaryScreen() {
  const profile = useProfileStore((s) => s.profile)!
  const selectedTemplate = useProfileStore((s) => s.selectedTemplate)
  const findPlateFavorite = useAppStore((s) => s.findPlateFavorite)
  const togglePlateFavorite = useAppStore((s) => s.togglePlateFavorite)
  const [favoriteBusy, setFavoriteBusy] = useState(false)
  const [showFavoriteToast, setShowFavoriteToast] = useState(false)
  const [favoriteToastMessage, setFavoriteToastMessage] = useState('Saved to favourites')
  const isFavorite = Boolean(findPlateFavorite(profile, selectedTemplate))

  const handleToggleFavorite = async () => {
    const removing = isFavorite
    setFavoriteBusy(true)
    try {
      await togglePlateFavorite(profile, selectedTemplate)
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
        profile={profile}
        selectedTemplate={selectedTemplate}
        isFavorite={isFavorite}
        favoriteBusy={favoriteBusy}
        onToggleFavorite={handleToggleFavorite}
      />
      <div className="summary-cta">
        <SaveToProjectButton profile={profile} selectedTemplate={selectedTemplate} />
      </div>
    </>
  )
}
