import { PlateSummaryContent } from '@/components/summary/PlateSummaryContent'
import { useViewingPlate } from '@/hooks/useViewingPlate'

export function PlateViewScreen() {
  const ctx = useViewingPlate()

  if (!ctx) {
    return (
      <p className="text-sm text-muted">Plate not found.</p>
    )
  }

  return (
    <PlateSummaryContent
      profile={ctx.plate.profile}
      selectedTemplate={ctx.plate.selectedTemplate}
      plateSerial={ctx.plate.serial}
    />
  )
}
