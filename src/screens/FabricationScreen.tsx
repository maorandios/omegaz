import { useEffect, useState } from 'react'
import { ProfileCanvas } from '@/components/canvas/ProfileCanvas'
import { ThicknessSlider } from '@/components/fabrication/ThicknessSlider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  clampThicknessForMaterial,
  defaultMaterialThickness,
  FABRICATION_FINISH_OPTIONS,
  FABRICATION_MATERIAL_OPTIONS,
} from '@/geometry/constants'
import { useProfileStore } from '@/store/profileStore'

export function FabricationScreen() {
  const profile = useProfileStore((s) => s.profile)!
  const activeItemId = useProfileStore((s) => s.activeItemId)
  const setFabricationField = useProfileStore((s) => s.setFabricationField)
  const setStep = useProfileStore((s) => s.setStep)
  const fab = profile.fabrication
  const [errors, setErrors] = useState<string[]>([])

  const material =
    FABRICATION_MATERIAL_OPTIONS.includes(
      fab.material as (typeof FABRICATION_MATERIAL_OPTIONS)[number],
    )
      ? fab.material
      : FABRICATION_MATERIAL_OPTIONS[0]

  const finish =
    FABRICATION_FINISH_OPTIONS.includes(
      fab.finish as (typeof FABRICATION_FINISH_OPTIONS)[number],
    )
      ? fab.finish
      : FABRICATION_FINISH_OPTIONS[0]

  useEffect(() => {
    if (fab.material !== material) {
      setFabricationField('material', material)
    }
    if (fab.finish !== finish) {
      setFabricationField('finish', finish)
    }
    const clamped = clampThicknessForMaterial(fab.thickness, material)
    if (fab.thickness !== clamped) {
      setFabricationField('thickness', clamped)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync invalid persisted values once
  }, [])

  const handleMaterialChange = (next: string) => {
    setFabricationField('material', next)
    const thickness = clampThicknessForMaterial(
      fab.thickness || defaultMaterialThickness(next),
      next,
    )
    setFabricationField('thickness', thickness)
  }

  const validate = () => {
    const errs: string[] = []
    if (!fab.partName.trim()) errs.push('Part name is required')
    if (fab.thickness <= 0) errs.push('Thickness is required')
    if (fab.partLength <= 0) errs.push('Part length is required')
    if (fab.quantity < 1) errs.push('Quantity must be at least 1')
    setErrors(errs)
    return errs.length === 0
  }

  return (
    <div className="space-y-5">
      <div className="fabrication-preview mx-auto w-full max-w-sm">
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-zinc-950">
          <ProfileCanvas
            profile={profile}
            activeItemId={activeItemId}
            showLabels
            className="h-full w-full bg-zinc-950"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Part Name *</Label>
          <Input
            value={fab.partName}
            onChange={(e) => setFabricationField('partName', e.target.value)}
            placeholder="e.g. Gutter bracket left"
          />
        </div>

        <div className="space-y-2">
          <Label>Material *</Label>
          <Select value={material} onValueChange={handleMaterialChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FABRICATION_MATERIAL_OPTIONS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ThicknessSlider
          material={material}
          value={fab.thickness}
          onChange={(t) => setFabricationField('thickness', t)}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Part Length (mm) *</Label>
            <Input
              type="number"
              value={fab.partLength}
              onChange={(e) => setFabricationField('partLength', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Quantity *</Label>
            <Input
              type="number"
              min={1}
              value={fab.quantity}
              onChange={(e) => setFabricationField('quantity', parseInt(e.target.value, 10) || 1)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Finish</Label>
          <Select value={finish} onValueChange={(v) => setFabricationField('finish', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FABRICATION_FINISH_OPTIONS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Input
            value={fab.notes}
            onChange={(e) => setFabricationField('notes', e.target.value)}
            placeholder="Optional fabrication notes"
          />
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="text-sm text-red-400">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={() => {
          if (validate()) setStep('summary')
        }}
      >
        Continue to Review
      </Button>
    </div>
  )
}
