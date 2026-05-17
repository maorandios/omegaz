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
      <SheetContent side="top" className="mx-auto max-w-lg">
        <SheetHeader>
          <SheetTitle>Leave this process?</SheetTitle>
        </SheetHeader>
        <p className="text-sm leading-relaxed text-zinc-400">
          You&apos;re about to cancel this plate process. Your changes won&apos;t be saved.
        </p>
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Stay
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
