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
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Enter Dimensions</h2>
        <p className="text-sm text-zinc-400">One measurement at a time — profile updates live.</p>
      </div>

      <div className="min-h-[220px] flex-1">
        <ProfileCanvas profile={profile} activeItemId={activeItemId} className="h-full min-h-[220px]" />
      </div>

      <div className="rounded-t-2xl border border-zinc-800 bg-zinc-900 p-4">
        <SegmentInputPanel profile={profile} />
      </div>
    </div>
  )
}
