import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface ExitProcessSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmExit: () => void
}

export function ExitProcessSheet({ open, onOpenChange, onConfirmExit }: ExitProcessSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg">
        <div className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
        <SheetHeader>
          <SheetTitle>Leave this process?</SheetTitle>
        </SheetHeader>
        <p className="text-sm leading-relaxed text-muted">
          You&apos;re about to cancel this plate process. Your changes won&apos;t be saved.
        </p>
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Continue
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            onClick={() => {
              onOpenChange(false)
              onConfirmExit()
            }}
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
