import { Button } from '@/components/ui/button'
import type { FoldedProfile } from '@/geometry/types'
import { useAppStore } from '@/store/appStore'
import { useProfileStore } from '@/store/profileStore'

interface SaveToProjectButtonProps {
  profile: FoldedProfile
  selectedTemplate: string | null
}

export function SaveToProjectButton({ profile, selectedTemplate }: SaveToProjectButtonProps) {
  const saveProjectFromProfile = useAppStore((s) => s.saveProjectFromProfile)
  const setMainTab = useAppStore((s) => s.setMainTab)
  const restart = useProfileStore((s) => s.restart)

  const handleSave = () => {
    saveProjectFromProfile(profile, selectedTemplate)
    setMainTab('projects')
    restart()
  }

  return (
    <Button className="w-full" size="lg" onClick={handleSave}>
      Save to Project
    </Button>
  )
}
