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
      <SheetContent side="bottom" className="mx-auto max-w-lg">
        <div className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-zinc-600" aria-hidden />
        <SheetHeader>
          <SheetTitle>Cancel subscription?</SheetTitle>
        </SheetHeader>
        <p className="text-sm leading-relaxed text-zinc-400">
          You&apos;ll keep Pro access until{' '}
          <span className="text-zinc-200">{formatSubscriptionPeriodEnd(periodEnd)}</span>. After
          that, your account moves to the Free plan.
        </p>
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Keep Pro
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
            Cancel plan
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
