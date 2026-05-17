import { useEffect } from 'react'
import { ProfileCanvas } from '@/components/canvas/ProfileCanvas'
import { SegmentInputPanel } from '@/components/wizard/SegmentInputPanel'
import { buildWizardSteps } from '@/geometry/calculateProfilePoints'
import { useProfileStore } from '@/store/profileStore'

export function SegmentWizardScreen() {
  const profile = useProfileStore((s) => s.profile)
  const activeItemId = useProfileStore((s) => s.activeItemId)
  const wizardIndex = useProfileStore((s) => s.wizardIndex)

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
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-hidden px-1 pt-1">
        <ProfileCanvas profile={profile} activeItemId={activeItemId} className="h-full w-full" />
      </div>

      <div className="shrink-0 border-t border-zinc-700 bg-zinc-900 pb-[env(safe-area-inset-bottom)]">
        <SegmentInputPanel profile={profile} dock />
      </div>
    </div>
  )
}
