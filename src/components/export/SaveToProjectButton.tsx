import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { FoldedProfile } from '@/geometry/types'
import { useAppStore } from '@/store/appStore'
import { useProfileStore } from '@/store/profileStore'

interface SaveToProjectButtonProps {
  profile: FoldedProfile
  selectedTemplate: string | null
}

export function SaveToProjectButton({ profile, selectedTemplate }: SaveToProjectButtonProps) {
  const activeProject = useAppStore((s) => s.getActiveProject())
  const savePlateToActiveProject = useAppStore((s) => s.savePlateToActiveProject)
  const setMainTab = useAppStore((s) => s.setMainTab)
  const setSelectedProject = useAppStore((s) => s.setSelectedProject)
  const editingPlateId = useAppStore((s) => s.editingPlateId)
  const restart = useProfileStore((s) => s.restart)

  const [saved, setSaved] = useState(false)

  if (!activeProject) {
    return (
      <p className="text-center text-sm text-amber-500/90">
        No active project. Go to Create and start or select a project first.
      </p>
    )
  }

  const handleSave = () => {
    const ok = savePlateToActiveProject(profile, selectedTemplate)
    if (!ok) return
    setSaved(true)
  }

  const handleViewProject = () => {
    const projectId = activeProject.id
    restart()
    setSelectedProject(projectId)
    setMainTab('projects')
  }

  const handleAddAnother = () => {
    restart()
    setMainTab('create')
  }

  if (saved) {
    return (
      <div className="space-y-2">
        <p className="text-center text-sm text-emerald-400">
          Plate saved to {activeProject.name} ({activeProject.serial})
        </p>
        <Button type="button" className="w-full" size="lg" variant="outline" onClick={handleAddAnother}>
          Add another plate
        </Button>
        <Button type="button" className="w-full" size="lg" onClick={handleViewProject}>
          View project
        </Button>
      </div>
    )
  }

  return (
    <Button className="w-full" size="lg" onClick={handleSave}>
      {editingPlateId ? 'Update plate in project' : 'Save plate to project'}
    </Button>
  )
}
