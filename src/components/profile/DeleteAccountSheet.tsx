import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface DeleteAccountSheetProps {
  open: boolean
  loading?: boolean
  error?: string | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteAccountSheet({
  open,
  loading = false,
  error = null,
  onOpenChange,
  onConfirm,
}: DeleteAccountSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg border-border bg-background">
        <div className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
        <SheetHeader>
          <SheetTitle>Delete account?</SheetTitle>
        </SheetHeader>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          This permanently removes your account, all your projects, and every plate you&apos;ve
          saved. This action cannot be undone.
        </p>
        {error ? (
          <p className="mt-3 text-sm leading-relaxed text-destructive">{error}</p>
        ) : null}
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1 rounded-2xl text-base font-semibold"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-12 flex-1 rounded-2xl text-base font-semibold"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting…' : 'Delete account'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
