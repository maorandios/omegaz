import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface DeleteProjectSheetProps {
  open: boolean
  projectName: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteProjectSheet({
  open,
  projectName,
  onOpenChange,
  onConfirm,
}: DeleteProjectSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg border-border bg-background">
        <div className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
        <SheetHeader>
          <SheetTitle>Delete project?</SheetTitle>
        </SheetHeader>
        <p className="text-sm leading-relaxed text-muted">
          <span className="font-medium text-foreground">{projectName}</span> project and all plates
          in it will be permanently removed.
        </p>
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            Delete
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
