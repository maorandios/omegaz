import { Settings2 } from 'lucide-react'
import { useState } from 'react'
import { ProjectActionsSheet } from '@/components/projects/ProjectActionsSheet'
import { cn } from '@/lib/utils'

export function ProjectActionsDock() {
  const [actionsOpen, setActionsOpen] = useState(false)

  return (
    <>
      <nav aria-label="Project actions" className="bottom-dock border-t border-border">
        <div className="bottom-dock__inner mx-auto flex max-w-lg items-center justify-center px-4">
          <button
            type="button"
            onClick={() => setActionsOpen(true)}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg px-6 py-1 text-sm font-medium transition-colors',
              'text-primary hover:text-primary/90',
            )}
          >
            <Settings2 className="h-5 w-5 shrink-0 stroke-[1.75px]" aria-hidden />
            <span>Actions</span>
          </button>
        </div>
      </nav>
      <ProjectActionsSheet open={actionsOpen} onOpenChange={setActionsOpen} />
    </>
  )
}
