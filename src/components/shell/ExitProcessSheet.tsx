import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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

const sheetActionClass =
  'h-12 flex-1 rounded-2xl text-base font-semibold'

export function ExitProcessSheet({ open, onOpenChange, onConfirmExit }: ExitProcessSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        overlayClassName="bg-black/40 backdrop-blur-md"
        className="mx-auto max-w-lg border-border bg-background"
      >
        <div className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
        <SheetHeader>
          <SheetTitle>Leave this process?</SheetTitle>
        </SheetHeader>
        <p className="text-sm leading-relaxed text-muted">
          You&apos;re about to cancel this plate process. Your changes won&apos;t be saved.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className={cn(sheetActionClass, 'border-border bg-surface/40')}
            onClick={() => onOpenChange(false)}
          >
            Continue
          </Button>
          <Button
            type="button"
            variant="destructive"
            className={sheetActionClass}
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
