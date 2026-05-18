import { useState } from 'react'
import { SketchCanvas } from '@/components/canvas/SketchCanvas'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/appStore'
import { useProfileStore } from '@/store/profileStore'

export function SketchScreen() {
  const sketchPoints = useProfileStore((s) => s.sketchPoints)
  const setSketchPoints = useProfileStore((s) => s.setSketchPoints)
  const applyCleanedSketch = useProfileStore((s) => s.applyCleanedSketch)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Freehand Sketch</h2>
        <p className="text-sm text-muted">
          Draw your folded profile on the white canvas. We&apos;ll convert it to straight segments.
        </p>
      </div>

      <SketchCanvas points={sketchPoints} onPointsChange={setSketchPoints} />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setSketchPoints([])
            setError(null)
          }}
        >
          Clear
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setSketchPoints([])
            setError(null)
            useProfileStore.setState({ currentStep: null })
            useAppStore.getState().setMainTab('create')
          }}
        >
          Cancel
        </Button>
      </div>

      <Button
        size="lg"
        disabled={sketchPoints.length < 4}
        onClick={() => {
          const ok = applyCleanedSketch()
          if (!ok) {
            setError('Could not detect a valid profile. Try drawing clearer corners.')
          }
        }}
      >
        Clean Shape
      </Button>
    </div>
  )
}
