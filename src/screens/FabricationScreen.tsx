import { useEffect, useState } from 'react'
import { MoveRight } from 'lucide-react'
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
  isFabricationFinishOption,
  FABRICATION_MATERIAL_OTHER,
  isFabricationMaterialOption,
} from '@/geometry/constants'
import { useProfileStore } from '@/store/profileStore'

export function FabricationScreen() {
  const profile = useProfileStore((s) => s.profile)!
  const setFabricationField = useProfileStore((s) => s.setFabricationField)
  const setStep = useProfileStore((s) => s.setStep)
  const fab = profile.fabrication
  const [errors, setErrors] = useState<string[]>([])
  const [partLengthDraft, setPartLengthDraft] = useState<string | null>(null)
  const [quantityDraft, setQuantityDraft] = useState<string | null>(null)

  const commitPartLength = () => {
    if (partLengthDraft === null) return
    const trimmed = partLengthDraft.trim()
    setPartLengthDraft(null)
    if (trimmed === '') return
    const v = parseFloat(trimmed)
    if (Number.isFinite(v) && v > 0) setFabricationField('partLength', v)
  }

  const commitQuantity = () => {
    if (quantityDraft === null) return
    const trimmed = quantityDraft.trim()
    setQuantityDraft(null)
    if (trimmed === '') return
    const v = parseInt(trimmed, 10)
    if (Number.isFinite(v) && v >= 1) setFabricationField('quantity', v)
  }

  const material = isFabricationMaterialOption(fab.material)
    ? fab.material
    : FABRICATION_MATERIAL_OPTIONS[0]

  const isOtherMaterial = material === FABRICATION_MATERIAL_OTHER

  const finish = isFabricationFinishOption(fab.finish)
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
    if (isOtherMaterial && !fab.materialCustom.trim()) {
      errs.push('Please specify the material')
    }
    setErrors(errs)
    return errs.length === 0
  }

  return (
    <div className="fabrication-screen">
      <div className="fabrication-preview mx-auto w-full max-w-sm">
        <div className="aspect-square w-full overflow-hidden rounded-2xl bg-background">
          <ProfileCanvas
            profile={profile}
            showLabels
            accentPreview
            className="h-full w-full bg-background"
          />
        </div>
      </div>

      <div className="form-stack">
        <div className="form-field">
          <Label htmlFor="part-name">Part Name *</Label>
          <Input
            id="part-name"
            value={fab.partName}
            onChange={(e) => setFabricationField('partName', e.target.value)}
            placeholder="e.g. Gutter bracket left"
          />
        </div>

        <div className="form-field">
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
          {isOtherMaterial && (
            <Input
              id="material-custom"
              value={fab.materialCustom}
              onChange={(e) => setFabricationField('materialCustom', e.target.value)}
              placeholder="Enter material type"
              aria-label="Custom material"
            />
          )}
        </div>

        <ThicknessSlider
          material={material}
          value={fab.thickness}
          onChange={(t) => setFabricationField('thickness', t)}
        />

        <div className="form-field-grid">
          <div className="form-field">
            <Label htmlFor="part-length">Part Length (mm) *</Label>
            <Input
              id="part-length"
              type="number"
              inputMode="decimal"
              value={partLengthDraft ?? fab.partLength}
              onFocus={() => setPartLengthDraft('')}
              onChange={(e) => setPartLengthDraft(e.target.value)}
              onBlur={commitPartLength}
            />
          </div>
          <div className="form-field">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              inputMode="numeric"
              min={1}
              value={quantityDraft ?? fab.quantity}
              onFocus={() => setQuantityDraft('')}
              onChange={(e) => setQuantityDraft(e.target.value)}
              onBlur={commitQuantity}
            />
          </div>
        </div>

        <div className="form-field fabrication-options">
          <label htmlFor="hem" className="hem-option">
            <input
              id="hem"
              type="checkbox"
              checked={fab.hem}
              onChange={(e) => setFabricationField('hem', e.target.checked)}
              className="hem-checkbox"
            />
            <span className="text-base text-foreground">Request hem</span>
          </label>
          <label htmlFor="checker-plate" className="hem-option">
            <input
              id="checker-plate"
              type="checkbox"
              checked={fab.checkerPlate}
              onChange={(e) => setFabricationField('checkerPlate', e.target.checked)}
              className="hem-checkbox"
            />
            <span className="text-base text-foreground">Checker plate</span>
          </label>
        </div>

        <div className="form-field">
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

        <div className="form-field">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            value={fab.notes}
            onChange={(e) => setFabricationField('notes', e.target.value)}
            placeholder="Optional fabrication notes"
          />
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="text-sm text-destructive" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <Button
        className="h-12 w-full rounded-2xl text-base font-semibold"
        size="lg"
        onClick={() => {
          if (validate()) setStep('summary')
        }}
      >
        Next
        <MoveRight className="h-5 w-5" aria-hidden />
      </Button>
    </div>
  )
}
