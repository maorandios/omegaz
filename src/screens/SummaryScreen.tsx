import { SaveToProjectButton } from '@/components/export/SaveToProjectButton'
import { PlateSummaryContent } from '@/components/summary/PlateSummaryContent'
import { useProfileStore } from '@/store/profileStore'

export function SummaryScreen() {
  const profile = useProfileStore((s) => s.profile)!
  const selectedTemplate = useProfileStore((s) => s.selectedTemplate)

  return (
    <>
      <PlateSummaryContent profile={profile} selectedTemplate={selectedTemplate} />
      <div className="summary-cta">
        <SaveToProjectButton profile={profile} selectedTemplate={selectedTemplate} />
      </div>
    </>
  )
}
