import { useState } from 'react'
import { ProfileCanvas } from '@/components/canvas/ProfileCanvas'
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
import { Separator } from '@/components/ui/separator'
import {
  FINISH_OPTIONS,
  MATERIAL_OPTIONS,
  THICKNESS_OPTIONS,
} from '@/geometry/constants'
import { FLAT_WIDTH_DISCLAIMER, FLAT_WIDTH_LABEL } from '@/geometry/types'
import { useProfileMetrics } from '@/hooks/useProfileMetrics'
import { formatAreaM2, formatKg, formatMm } from '@/lib/format'
import { useProfileStore } from '@/store/profileStore'

export function FabricationScreen() {
  const profile = useProfileStore((s) => s.profile)!
  const setFabricationField = useProfileStore((s) => s.setFabricationField)
  const setStep = useProfileStore((s) => s.setStep)
  const fab = profile.fabrication
  const metrics = useProfileMetrics(profile)

  const [materialCustom, setMaterialCustom] = useState('')
  const [thicknessCustom, setThicknessCustom] = useState('')
  const [errors, setErrors] = useState<string[]>([])

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
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Fabrication Details</h2>
        <p className="text-sm text-zinc-400">Material, quantity, and run length for the order.</p>
      </div>

      <ProfileCanvas profile={profile} className="h-40" />

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
          <Select
            value={MATERIAL_OPTIONS.includes(fab.material as (typeof MATERIAL_OPTIONS)[number]) ? fab.material : 'Custom'}
            onValueChange={(v) => {
              if (v === 'Custom') setFabricationField('material', materialCustom || 'Custom')
              else setFabricationField('material', v)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_OPTIONS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(!MATERIAL_OPTIONS.slice(0, -1).includes(fab.material as (typeof MATERIAL_OPTIONS)[number]) ||
            fab.material === 'Custom') && (
            <Input
              placeholder="Custom material"
              value={materialCustom || fab.material}
              onChange={(e) => {
                setMaterialCustom(e.target.value)
                setFabricationField('material', e.target.value)
              }}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label>Thickness *</Label>
          <Select
            value={
              THICKNESS_OPTIONS.includes(fab.thickness as (typeof THICKNESS_OPTIONS)[number])
                ? String(fab.thickness)
                : 'custom'
            }
            onValueChange={(v) => {
              if (v === 'custom') return
              setFabricationField('thickness', parseFloat(v))
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THICKNESS_OPTIONS.map((t) => (
                <SelectItem key={t} value={String(t)}>
                  {t} mm
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {!THICKNESS_OPTIONS.includes(fab.thickness as (typeof THICKNESS_OPTIONS)[number]) && (
            <Input
              type="number"
              placeholder="Custom thickness (mm)"
              value={thicknessCustom || fab.thickness}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                setThicknessCustom(e.target.value)
                if (Number.isFinite(v)) setFabricationField('thickness', v)
              }}
            />
          )}
        </div>

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
          <Select
            value={FINISH_OPTIONS.includes(fab.finish as (typeof FINISH_OPTIONS)[number]) ? fab.finish : 'Custom'}
            onValueChange={(v) => {
              if (v === 'Custom') setFabricationField('finish', 'Custom')
              else setFabricationField('finish', v)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FINISH_OPTIONS.map((f) => (
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

      <Separator />

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-sm">
        <h3 className="mb-2 font-medium text-amber-400">Live Estimates</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <dt className="text-zinc-400">{FLAT_WIDTH_LABEL}</dt>
          <dd>{formatMm(metrics.flatWidth)}</dd>
          <dt className="text-zinc-400">Bend Count</dt>
          <dd>{metrics.bendCount}</dd>
          <dt className="text-zinc-400">Profile Width</dt>
          <dd>{formatMm(metrics.bounds.width)}</dd>
          <dt className="text-zinc-400">Profile Height</dt>
          <dd>{formatMm(metrics.bounds.height)}</dd>
          <dt className="text-zinc-400">Estimated Area</dt>
          <dd>{formatAreaM2(metrics.area)}</dd>
          <dt className="text-zinc-400">Estimated Weight</dt>
          <dd>{formatKg(metrics.weight)}</dd>
        </dl>
        <p className="mt-3 text-xs text-zinc-500">{FLAT_WIDTH_DISCLAIMER}</p>
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
