import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buildWizardSteps } from '@/geometry/calculateProfilePoints'
import type { FoldedProfile } from '@/geometry/types'
import { useProfileStore } from '@/store/profileStore'

interface SegmentInputPanelProps {
  profile: FoldedProfile
}

export function SegmentInputPanel({ profile }: SegmentInputPanelProps) {
  const wizardIndex = useProfileStore((s) => s.wizardIndex)
  const goNext = useProfileStore((s) => s.goNext)
  const goBack = useProfileStore((s) => s.goBack)
  const undo = useProfileStore((s) => s.undo)
  const restart = useProfileStore((s) => s.restart)
  const setSegmentLength = useProfileStore((s) => s.setSegmentLength)
  const setBendAngle = useProfileStore((s) => s.setBendAngle)

  const steps = buildWizardSteps(profile)
  const current = steps[wizardIndex]
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (!current) return
    if (current.type === 'segment') {
      const seg = profile.segments.find((s) => s.id === current.id)
      setInputValue(seg ? String(seg.length) : '')
    } else {
      const bend = profile.bends.find((b) => b.id === current.id)
      setInputValue(bend ? String(bend.angle) : '')
    }
  }, [current, profile, wizardIndex])

  if (!current) return null

  const segmentIndex = profile.segments.findIndex((s) => s.id === current.id)
  const bendIndex = profile.bends.findIndex((b) => b.id === current.id)

  const title =
    current.type === 'segment'
      ? `Segment ${segmentIndex + 1} Length`
      : `Bend ${bendIndex + 1} Angle`

  const unit = current.type === 'segment' ? 'mm' : '°'
  const stepLabel = `Step ${wizardIndex + 1} of ${steps.length}`

  const handleNext = () => {
    const num = parseFloat(inputValue)
    if (!Number.isFinite(num) || num <= 0) return

    if (current.type === 'segment') {
      setSegmentLength(current.id, num)
    } else {
      setBendAngle(current.id, num)
    }
    goNext()
  }

  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{stepLabel}</p>
      <div className="space-y-2">
        <Label htmlFor="wizard-input">{title}</Label>
        <div className="flex gap-2">
          <Input
            id="wizard-input"
            type="number"
            inputMode="decimal"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            className="flex-1"
            autoFocus
          />
          <span className="flex items-center text-lg text-zinc-400">{unit}</span>
        </div>
      </div>
      <Button className="w-full" size="lg" onClick={handleNext}>
        Next
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={goBack} disabled={wizardIndex === 0}>
          Back
        </Button>
        <Button variant="secondary" className="flex-1" onClick={undo}>
          Undo
        </Button>
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => {
            if (window.confirm('Restart and lose current progress?')) restart()
          }}
        >
          Restart
        </Button>
      </div>
    </div>
  )
}
