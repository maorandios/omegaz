import { useMemo } from 'react'
import {
  buildThicknessSteps,
  MATERIAL_THICKNESS_MAX_MM,
  type FabricationMaterial,
} from '@/geometry/constants'
import { Label } from '@/components/ui/label'

interface ThicknessSliderProps {
  material: string
  value: number
  onChange: (thickness: number) => void
}

export function ThicknessSlider({ material, value, onChange }: ThicknessSliderProps) {
  const maxMm =
    MATERIAL_THICKNESS_MAX_MM[material as FabricationMaterial] ??
    MATERIAL_THICKNESS_MAX_MM['Galvanized Steel']

  const steps = useMemo(() => buildThicknessSteps(maxMm), [maxMm])

  const index = useMemo(() => {
    let best = 0
    let bestDiff = Infinity
    steps.forEach((s, i) => {
      const d = Math.abs(s - value)
      if (d < bestDiff) {
        bestDiff = d
        best = i
      }
    })
    return best
  }, [steps, value])

  const display = steps[index] ?? value

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Thickness *</Label>
        <span className="text-sm font-semibold tabular-nums text-primary">{display} mm</span>
      </div>
      <input
        type="range"
        min={0}
        max={Math.max(0, steps.length - 1)}
        step={1}
        value={index}
        onChange={(e) => {
          const i = parseInt(e.target.value, 10)
          const next = steps[i]
          if (next !== undefined) onChange(next)
        }}
        className="h-2 w-full cursor-pointer accent-primary"
        aria-valuemin={steps[0]}
        aria-valuemax={steps[steps.length - 1]}
        aria-valuenow={display}
        aria-label="Thickness in millimeters"
      />
      <div className="flex justify-between text-xs text-muted">
        <span>{steps[0]} mm</span>
        <span>up to {maxMm} mm</span>
      </div>
    </div>
  )
}
