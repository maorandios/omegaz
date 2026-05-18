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
        <div className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
        <SheetHeader>
          <SheetTitle>Add to existing project</SheetTitle>
        </SheetHeader>
        {projects.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No projects yet. Create one first.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  className="flex w-full flex-col rounded-lg border border-border bg-surface/80 px-4 py-3 text-left transition-colors hover:border-border hover:bg-surface"
                  onClick={() => onSelect(project.id)}
                >
                  <span className="font-medium text-foreground">{project.name}</span>
                  <span className="mt-1 text-xs text-muted">
                    <span className="font-mono text-foreground/90">{project.serial}</span>
                    <span className="mx-1.5 text-muted/60">·</span>
                    {project.plates.length} plate{project.plates.length === 1 ? '' : 's'}
                    <span className="mx-1.5 text-muted/60">·</span>
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
