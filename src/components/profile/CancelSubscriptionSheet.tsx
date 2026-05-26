import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatSubscriptionPeriodEnd } from '@/store/userTypes'

interface CancelSubscriptionSheetProps {
  open: boolean
  periodEnd: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function CancelSubscriptionSheet({
  open,
  periodEnd,
  onOpenChange,
  onConfirm,
}: CancelSubscriptionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg border-border bg-background">
        <div className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
        <SheetHeader>
          <SheetTitle>Cancel subscription?</SheetTitle>
        </SheetHeader>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          You&apos;ll keep Pro access until{' '}
          <span className="font-medium text-foreground">
            {formatSubscriptionPeriodEnd(periodEnd)}
          </span>
          . After that, Projects and the Create button lock until you subscribe again. You
          can resume anytime before then.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1 rounded-2xl text-base font-semibold"
            onClick={() => onOpenChange(false)}
          >
            Keep Pro
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-12 flex-1 rounded-2xl text-base font-semibold"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            Cancel plan
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
