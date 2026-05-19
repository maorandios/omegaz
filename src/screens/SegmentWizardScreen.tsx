import { ProfileCanvas } from '@/components/canvas/ProfileCanvas'
import { PlateWizardPanel } from '@/components/wizard/PlateWizardPanel'
import { useProfileStore } from '@/store/profileStore'

export function SegmentWizardScreen() {
  const profile = useProfileStore((s) => s.profile)
  const activeItemId = useProfileStore((s) => s.activeItemId)
  const selectWizardItem = useProfileStore((s) => s.selectWizardItem)

  if (!profile) return null

  return (
    <div className="wizard-workspace flex min-h-0 flex-1 flex-col">
      <div className="wizard-preview-area">
        <div className="wizard-preview">
          <ProfileCanvas
            profile={profile}
            activeItemId={activeItemId}
            showLabels
            interactive
            onSelectItem={selectWizardItem}
            className="h-full w-full bg-background"
          />
        </div>
      </div>

      <PlateWizardPanel profile={profile} />
    </div>
  )
}
