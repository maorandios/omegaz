import { useState } from 'react'
import { GridDrawCanvas } from '@/components/canvas/GridDrawCanvas'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/appStore'
import { useProfileStore } from '@/store/profileStore'

export function DrawShapeScreen() {
  const drawPoints = useProfileStore((s) => s.drawPoints)
  const setDrawPoints = useProfileStore((s) => s.setDrawPoints)
  const applyDrawnShape = useProfileStore((s) => s.applyDrawnShape)
  const [error, setError] = useState<string | null>(null)

  const canContinue = drawPoints.length >= 2

  const handleUndo = () => {
    setError(null)
    if (drawPoints.length === 0) return
    setDrawPoints(
      drawPoints.slice(0, -1),
      useProfileStore.getState().drawPixelsPerCell,
    )
  }

  const handleClear = () => {
    setError(null)
    setDrawPoints([], useProfileStore.getState().drawPixelsPerCell)
  }

  const handleCancel = () => {
    setError(null)
    setDrawPoints([], 0)
    useProfileStore.setState({ currentStep: null })
    const app = useAppStore.getState()
    if (app.getActiveProject()) {
      app.openCreatePlateSheet('templates')
    } else {
      app.openCreatePlateSheet('choose')
    }
  }

  const handleNext = () => {
    const ok = applyDrawnShape()
    if (!ok) {
      setError('Place at least two points before continuing.')
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 px-4 py-3">
      <p className="text-center text-sm text-muted">
        Tap on the grid to place vertices. Each tap connects to the previous one
        with a straight line. You&apos;ll set the real dimensions in the next step.
      </p>

      <div className="min-h-0 flex-1">
        <GridDrawCanvas points={drawPoints} onPointsChange={setDrawPoints} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl text-base font-semibold"
            onClick={handleUndo}
            disabled={drawPoints.length === 0}
          >
            Undo
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl text-base font-semibold"
            onClick={handleClear}
            disabled={drawPoints.length === 0}
          >
            Clear
          </Button>
        </div>

        <div className="grid grid-cols-[2fr_3fr] gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl text-base font-semibold"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-12 rounded-2xl text-base font-semibold"
            disabled={!canContinue}
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
