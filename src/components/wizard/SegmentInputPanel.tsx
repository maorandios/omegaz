import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { buildWizardSteps } from '@/geometry/calculateProfilePoints'
import type { FoldedProfile } from '@/geometry/types'
import { useProfileStore } from '@/store/profileStore'

interface SegmentInputPanelProps {
  profile: FoldedProfile
  compact?: boolean
}

export function SegmentInputPanel({ profile, compact = false }: SegmentInputPanelProps) {
  const wizardIndex = useProfileStore((s) => s.wizardIndex)
  const goNext = useProfileStore((s) => s.goNext)
  const goBack = useProfileStore((s) => s.goBack)
  const undo = useProfileStore((s) => s.undo)
  const restart = useProfileStore((s) => s.restart)
  const pushHistory = useProfileStore((s) => s.pushHistory)
  const previewSegmentLength = useProfileStore((s) => s.previewSegmentLength)
  const previewBendAngle = useProfileStore((s) => s.previewBendAngle)

  const steps = buildWizardSteps(profile)
  const current = steps[wizardIndex]
  const stepKey = current ? `${wizardIndex}-${current.type}-${current.id}` : ''
  const historyLength = useProfileStore((s) => s.history.length)
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    const step = buildWizardSteps(profile)[wizardIndex]
    if (!step) return
    if (step.type === 'segment') {
      const seg = profile.segments.find((s) => s.id === step.id)
      setInputValue(seg ? String(seg.length) : '')
    } else {
      const bend = profile.bends.find((b) => b.id === step.id)
      setInputValue(bend ? String(bend.angle) : '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stepKey + historyLength are intentional triggers
  }, [stepKey, historyLength])

  if (!current) return null

  const segmentIndex = profile.segments.findIndex((s) => s.id === current.id)
  const bendIndex = profile.bends.findIndex((b) => b.id === current.id)

  const title =
    current.type === 'segment'
      ? `Segment ${segmentIndex + 1} Length`
      : `Bend ${bendIndex + 1} Angle`

  const unit = current.type === 'segment' ? 'mm' : '°'
  const stepLabel = `Step ${wizardIndex + 1} of ${steps.length}`

  const applyPreview = (raw: string) => {
    const num = parseFloat(raw)
    if (!Number.isFinite(num) || num <= 0) return
    if (current.type === 'segment') {
      previewSegmentLength(current.id, num)
    } else {
      previewBendAngle(current.id, num)
    }
  }

  const handleNext = () => {
    const num = parseFloat(inputValue)
    if (!Number.isFinite(num) || num <= 0) return

    pushHistory()
    if (current.type === 'segment') {
      previewSegmentLength(current.id, num)
    } else {
      previewBendAngle(current.id, num)
    }
    goNext()
  }

  const handleChange = (raw: string) => {
    setInputValue(raw)
    applyPreview(raw)
  }

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {stepLabel}
          </span>
          <span className="truncate text-sm font-medium text-zinc-200">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          <Input
            key={stepKey}
            id="wizard-input"
            type="text"
            inputMode="decimal"
            enterKeyHint="next"
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            className="h-11 flex-1 text-center text-lg font-semibold"
            autoFocus
          />
          <span className="w-8 shrink-0 text-sm text-zinc-400">{unit}</span>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 min-h-11 flex-1"
            onClick={goBack}
            disabled={wizardIndex === 0}
          >
            Back
          </Button>
          <Button type="button" className="h-11 min-h-11 flex-[1.4]" size="lg" onClick={handleNext}>
            Next
          </Button>
        </div>

        <div className="flex justify-center gap-5 text-xs text-zinc-500">
          <button type="button" className="underline-offset-2 hover:text-zinc-300 hover:underline" onClick={undo}>
            Undo
          </button>
          <button
            type="button"
            className="underline-offset-2 hover:text-zinc-300 hover:underline"
            onClick={() => {
              if (window.confirm('Restart and lose current progress?')) restart()
            }}
          >
            Restart
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{stepLabel}</p>
      <div className="space-y-2">
        <label htmlFor="wizard-input" className="text-sm font-medium text-zinc-300">
          {title}
        </label>
        <div className="flex gap-2">
          <Input
            key={stepKey}
            id="wizard-input"
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            className="flex-1"
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
