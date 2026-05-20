import { Database, MoveRight, Weight } from 'lucide-react'
import { MetaItem } from '@/components/projects/MetaItem'
import { PlateShapeThumb } from '@/components/projects/PlateShapeThumb'
import { formatKg } from '@/lib/format'
import { plateDisplayName, type PlateRecord } from '@/store/projectTypes'

interface PlateListRowProps {
  plate: PlateRecord
  onOpen: () => void
}

export function PlateListRow({ plate, onOpen }: PlateListRowProps) {
  const { fabrication } = plate.profile

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface/40 px-4 py-4.5 text-left transition-colors hover:border-border hover:bg-surface/55"
    >
      <PlateShapeThumb templateId={plate.selectedTemplate} />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{plateDisplayName(plate)}</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <MetaItem icon={Weight}>{formatKg(plate.weightKg)}</MetaItem>
          <MetaItem icon={Database}>{fabrication.quantity}</MetaItem>
        </p>
      </div>

      <MoveRight className="h-5 w-5 shrink-0 text-primary" aria-hidden />
    </button>
  )
}
