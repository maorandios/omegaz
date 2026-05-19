import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface ProjectActionsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectActionsSheet({ open, onOpenChange }: ProjectActionsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg">
        <div className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
        <SheetHeader>
          <SheetTitle>Actions</SheetTitle>
        </SheetHeader>
        <p className="py-6 text-center text-sm text-muted">
          Project actions will appear here.
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => onOpenChange(false)}
        >
          Close
        </Button>
      </SheetContent>
    </Sheet>
  )
}
