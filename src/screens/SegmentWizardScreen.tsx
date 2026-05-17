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
      <div className="wizard-preview-zone">
        <div className="wizard-preview">
          <ProfileCanvas
            profile={profile}
            activeItemId={activeItemId}
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
