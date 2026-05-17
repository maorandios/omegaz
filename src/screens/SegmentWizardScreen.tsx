import { useEffect } from 'react'
import { ProfileCanvas } from '@/components/canvas/ProfileCanvas'
import { SegmentInputPanel } from '@/components/wizard/SegmentInputPanel'
import { useKeyboardInset } from '@/hooks/useKeyboardInset'
import { useProfileStore } from '@/store/profileStore'

export function SegmentWizardScreen() {
  const profile = useProfileStore((s) => s.profile)
  const activeItemId = useProfileStore((s) => s.activeItemId)
  const selectWizardItem = useProfileStore((s) => s.selectWizardItem)

  useKeyboardInset(true)

  useEffect(() => {
    document.documentElement.dataset.wizard = 'true'
    return () => {
      delete document.documentElement.dataset.wizard
    }
  }, [])


  if (!profile) return null

  return (
    <>
      <div className="wizard-preview-zone wizard-vv-sync">
        <div className="wizard-preview">
          <ProfileCanvas
            profile={profile}
            activeItemId={activeItemId}
            showLabels
            interactive
            onSelectItem={selectWizardItem}
            className="h-full w-full bg-zinc-950"
          />
        </div>
      </div>

      <div className="wizard-dock mx-auto flex max-w-lg justify-center">
        <SegmentInputPanel profile={profile} dock />
      </div>
    </>
  )
}
