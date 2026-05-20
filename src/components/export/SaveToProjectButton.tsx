import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TopToast } from '@/components/ui/TopToast'
import type { FoldedProfile } from '@/geometry/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import { useProfileStore } from '@/store/profileStore'

interface SaveToProjectButtonProps {
  profile: FoldedProfile
  selectedTemplate: string | null
}

const actionBtnClass = 'h-12 w-full rounded-2xl text-base font-semibold'

export function SaveToProjectButton({ profile, selectedTemplate }: SaveToProjectButtonProps) {
  const activeProject = useAppStore((s) => s.getActiveProject())
  const savePlateToActiveProject = useAppStore((s) => s.savePlateToActiveProject)
  const setMainTab = useAppStore((s) => s.setMainTab)
  const openCreatePlateSheet = useAppStore((s) => s.openCreatePlateSheet)
  const setSelectedProject = useAppStore((s) => s.setSelectedProject)
  const editingPlateId = useAppStore((s) => s.editingPlateId)
  const restart = useProfileStore((s) => s.restart)

  const [saved, setSaved] = useState(false)
  const [showToast, setShowToast] = useState(false)

  if (!activeProject) {
    return (
      <p className="text-center text-sm text-primary/90">
        No active project. Open Create and start or select a project first.
      </p>
    )
  }

  const handleSave = () => {
    const ok = savePlateToActiveProject(profile, selectedTemplate)
    if (!ok) return
    setSaved(true)
    setShowToast(true)
  }

  const handleViewProject = () => {
    const projectId = activeProject.id
    restart()
    setSelectedProject(projectId)
    setMainTab('projects')
  }

  const handleAddAnother = () => {
    restart()
    openCreatePlateSheet('templates')
  }

  if (saved) {
    return (
      <>
        <TopToast show={showToast} />
        <div className="space-y-2">
          <p className="text-center text-sm text-primary">
            Plate saved to {activeProject.name} ({activeProject.serial})
          </p>
          <Button
            type="button"
            className={cn(actionBtnClass, 'border-border bg-surface/40')}
            size="lg"
            variant="outline"
            onClick={handleAddAnother}
          >
            Add another plate
          </Button>
          <Button type="button" className={actionBtnClass} size="lg" onClick={handleViewProject}>
            View project
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <TopToast show={showToast} />
      <Button className={actionBtnClass} size="lg" onClick={handleSave}>
        {editingPlateId ? 'Update plate in project' : 'Save plate to project'}
      </Button>
    </>
  )
}
