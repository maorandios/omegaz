import { Shapes } from 'lucide-react'
import { TemplateCard } from '@/components/start/TemplateCard'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { getTemplatePreviewPath, TEMPLATE_DEFINITIONS } from '@/templates/definitions'
import { cn } from '@/lib/utils'

interface ShapeFilterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedShapeIds: string[]
  onToggleShape: (shapeId: string) => void
  onClear: () => void
}

export function ShapeFilterSheet({
  open,
  onOpenChange,
  selectedShapeIds,
  onToggleShape,
  onClear,
}: ShapeFilterSheetProps) {
  const hasSelection = selectedShapeIds.length > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        overlayClassName="bg-black/40 backdrop-blur-md"
        className="mx-auto max-h-[85dvh] max-w-lg gap-0 overflow-y-auto border-border bg-background p-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="px-6 pt-4">
          <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
          <SheetHeader className="text-left">
            <div className="flex items-center gap-2">
              <Shapes className="h-5 w-5 shrink-0 stroke-[1.75px] text-primary" aria-hidden />
              <SheetTitle className="mb-0">Filter by shape</SheetTitle>
            </div>
          </SheetHeader>
          <p className="mt-2 text-sm text-muted">
            Show projects that include at least one plate of the selected shape.
          </p>
        </div>

        <ul className="mt-4 space-y-2 px-4">
          {TEMPLATE_DEFINITIONS.map((template) => {
            const selected = selectedShapeIds.includes(template.id)
            return (
              <li key={template.id}>
                <div
                  className={cn(
                    'rounded-2xl transition-colors',
                    selected && 'ring-1 ring-primary',
                  )}
                >
                  <TemplateCard
                    name={template.name}
                    previewSrc={getTemplatePreviewPath(template.id)}
                    onClick={() => onToggleShape(template.id)}
                  />
                </div>
              </li>
            )
          })}
        </ul>

        <div className="mt-4 flex gap-2 px-4 pb-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-2xl border-border bg-surface/40"
            disabled={!hasSelection}
            onClick={onClear}
          >
            Clear
          </Button>
          <Button
            type="button"
            className="flex-1 rounded-2xl"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
