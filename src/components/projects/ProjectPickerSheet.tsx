import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatKg } from '@/lib/format'
import { useAppStore } from '@/store/appStore'

interface ProjectPickerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (projectId: string) => void
}

export function ProjectPickerSheet({ open, onOpenChange, onSelect }: ProjectPickerSheetProps) {
  const projects = useAppStore((s) => s.projects)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[70dvh] max-w-lg overflow-y-auto">
        <div className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-zinc-600" aria-hidden />
        <SheetHeader>
          <SheetTitle>Add to existing project</SheetTitle>
        </SheetHeader>
        {projects.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">No projects yet. Create one first.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  className="flex w-full flex-col rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-900"
                  onClick={() => onSelect(project.id)}
                >
                  <span className="font-medium text-zinc-100">{project.name}</span>
                  <span className="mt-1 text-xs text-zinc-400">
                    <span className="font-mono text-zinc-300">{project.serial}</span>
                    <span className="mx-1.5 text-zinc-600">·</span>
                    {project.plates.length} plate{project.plates.length === 1 ? '' : 's'}
                    <span className="mx-1.5 text-zinc-600">·</span>
                    {formatKg(project.weightKg)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
      </SheetContent>
    </Sheet>
  )
}
