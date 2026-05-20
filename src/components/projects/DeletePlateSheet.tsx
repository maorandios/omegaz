import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { plateDisplayName, type PlateRecord } from '@/store/projectTypes'

interface DeletePlateSheetProps {
  open: boolean
  plate: PlateRecord | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeletePlateSheet({
  open,
  plate,
  onOpenChange,
  onConfirm,
}: DeletePlateSheetProps) {
  const name = plate ? plateDisplayName(plate) : 'this plate'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg border-border bg-background">
        <div className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
        <SheetHeader>
          <SheetTitle>Delete plate?</SheetTitle>
        </SheetHeader>
        <p className="text-sm leading-relaxed text-muted">
          <span className="font-medium text-foreground">{name}</span> will be permanently
          removed from this project.
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
