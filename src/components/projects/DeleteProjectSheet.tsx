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
      <SheetContent side="bottom" className="mx-auto max-w-lg">
        <div className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-zinc-600" aria-hidden />
        <SheetHeader>
          <SheetTitle>Delete project?</SheetTitle>
        </SheetHeader>
        <p className="text-sm leading-relaxed text-zinc-400">
          <span className="font-medium text-zinc-200">{projectName}</span> and all plates in
          this batch will be permanently removed.
        </p>
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
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
