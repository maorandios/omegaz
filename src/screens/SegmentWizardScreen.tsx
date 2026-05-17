import { ProfileCanvas } from '@/components/canvas/ProfileCanvas'
import { SegmentInputPanel } from '@/components/wizard/SegmentInputPanel'
import { useProfileStore } from '@/store/profileStore'

export function SegmentWizardScreen() {
  const profile = useProfileStore((s) => s.profile)
  const activeItemId = useProfileStore((s) => s.activeItemId)
  const selectWizardItem = useProfileStore((s) => s.selectWizardItem)

  if (!profile) return null

  return (
    <div className="wizard-workspace">
      <div className="wizard-preview-area">
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

      <div className="wizard-dock-bar">
        <SegmentInputPanel profile={profile} dock />
      </div>
    </div>
  )
}
