import { useEffect } from 'react'
import { ProfileCanvas } from '@/components/canvas/ProfileCanvas'
import { SegmentInputPanel } from '@/components/wizard/SegmentInputPanel'
import { buildWizardSteps } from '@/geometry/calculateProfilePoints'
import { useKeyboardInset, useWizardHeaderHeight } from '@/hooks/useKeyboardInset'
import { useProfileStore } from '@/store/profileStore'

export function SegmentWizardScreen() {
  const profile = useProfileStore((s) => s.profile)
  const activeItemId = useProfileStore((s) => s.activeItemId)
  const wizardIndex = useProfileStore((s) => s.wizardIndex)

  useKeyboardInset(true)
  useWizardHeaderHeight(true)

  useEffect(() => {
    document.documentElement.dataset.wizard = 'true'
    return () => {
      delete document.documentElement.dataset.wizard
    }
  }, [])

  useEffect(() => {
    if (!profile) return
    const steps = buildWizardSteps(profile)
    const step = steps[wizardIndex]
    if (step) {
      useProfileStore.setState({ activeItemId: step.id })
    }
  }, [profile, wizardIndex])

  if (!profile) return null

  return (
    <>
      <div
        className="flex min-h-0 flex-1 flex-col items-center px-1 pt-1"
        style={{ paddingBottom: 'calc(var(--wizard-dock-h) + var(--keyboard-inset, 0px))' }}
      >
        <div className="wizard-preview max-w-lg">
          <ProfileCanvas profile={profile} activeItemId={activeItemId} className="h-full w-full !min-h-0" />
        </div>
      </div>

      <div className="wizard-dock mx-auto flex max-w-lg justify-center">
        <SegmentInputPanel profile={profile} dock />
      </div>
    </>
  )
}
