import { FolderPlus, List } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProjectPickerSheet } from '@/components/projects/ProjectPickerSheet'
import { formatKg } from '@/lib/format'
import { useAppStore } from '@/store/appStore'

export function ProjectSetupCard() {
  const activeProject = useAppStore((s) => s.getActiveProject())
  const createProject = useAppStore((s) => s.createProject)
  const setActiveProject = useAppStore((s) => s.setActiveProject)
  const [name, setName] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  const handleCreate = () => {
    const id = createProject(name)
    if (id) setName('')
  }

  if (activeProject) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-500/90">
          Current project
        </p>
        <p className="mt-1 font-semibold text-zinc-100">{activeProject.name}</p>
        <p className="mt-0.5 text-sm text-zinc-400">
          <span className="font-mono text-zinc-300">{activeProject.serial}</span>
          <span className="mx-1.5 text-zinc-600">·</span>
          {activeProject.plates.length} plate{activeProject.plates.length === 1 ? '' : 's'}
          <span className="mx-1.5 text-zinc-600">·</span>
          {formatKg(activeProject.weightKg)}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 h-8 px-0 text-zinc-400 hover:text-zinc-200"
          onClick={() => setActiveProject(null)}
        >
          Switch project
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div>
          <h3 className="text-sm font-medium text-zinc-100">Start a project batch</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Name your project, then add one or more plates to it.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-name">Project name</Label>
          <Input
            id="project-name"
            placeholder="e.g. Warehouse Phase 2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="flex-1 gap-2"
            disabled={!name.trim()}
            onClick={handleCreate}
          >
            <FolderPlus className="h-4 w-4" aria-hidden />
            New project
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => setPickerOpen(true)}
          >
            <List className="h-4 w-4" aria-hidden />
            Add to existing
          </Button>
        </div>
      </div>

      <ProjectPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(id) => {
          setActiveProject(id)
          setPickerOpen(false)
        }}
      />
    </>
  )
}
