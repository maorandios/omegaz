import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { buildWizardSteps } from '@/geometry/calculateProfilePoints'
import type { FoldedProfile } from '@/geometry/types'
import { useProfileStore } from '@/store/profileStore'

interface SegmentInputPanelProps {
  profile: FoldedProfile
  /** Single row: Back | value | Next — for mobile keyboard dock */
  dock?: boolean
}

export function SegmentInputPanel({ profile, dock = false }: SegmentInputPanelProps) {
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
  const inputRef = useRef<HTMLInputElement>(null)

  const focusInput = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.focus({ preventScroll: true })
    el.select()
  }, [])

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

  useEffect(() => {
    if (!dock) return
    focusInput()
    const t1 = window.setTimeout(focusInput, 60)
    const t2 = window.setTimeout(focusInput, 180)
    const t3 = window.setTimeout(focusInput, 360)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [stepKey, dock, focusInput])

  if (!current) return null

  const unit = current.type === 'segment' ? 'mm' : '°'

  const applyPreview = (raw: string) => {
    const num = parseFloat(raw)
    if (!Number.isFinite(num) || num <= 0) return
    if (current.type === 'segment') {
      previewSegmentLength(current.id, num)
    } else {
      previewBendAngle(current.id, num)
    }
  }

  const scheduleFocus = () => {
    requestAnimationFrame(() => {
      focusInput()
      requestAnimationFrame(focusInput)
    })
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
    scheduleFocus()
  }

  const handleBack = () => {
    goBack()
    scheduleFocus()
  }

  const handleChange = (raw: string) => {
    setInputValue(raw)
    applyPreview(raw)
  }

  if (dock) {
    return (
      <div className="flex h-full w-full max-w-lg items-center gap-2 px-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-[4.25rem] shrink-0 px-0 text-sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleBack}
          disabled={wizardIndex === 0}
        >
          Back
        </Button>

        <div className="flex h-11 min-w-0 flex-1 items-center rounded-lg border border-zinc-700 bg-zinc-950 px-2">
          <Input
            ref={inputRef}
            id="wizard-input"
            type="text"
            inputMode="decimal"
            enterKeyHint="next"
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            className="h-full min-w-0 flex-1 border-0 bg-transparent px-1 text-center text-lg font-semibold shadow-none focus-visible:ring-0"
          />
          <span className="shrink-0 text-xs font-medium text-zinc-400">{unit}</span>
        </div>

        <Button
          type="button"
          className="h-11 w-[4.25rem] shrink-0 px-0 text-sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleNext}
        >
          Next
        </Button>
      </div>
    )
  }

  const segmentIndex = profile.segments.findIndex((s) => s.id === current.id)
  const bendIndex = profile.bends.findIndex((b) => b.id === current.id)
  const title =
    current.type === 'segment'
      ? `Segment ${segmentIndex + 1} Length`
      : `Bend ${bendIndex + 1} Angle`
  const stepLabel = `Step ${wizardIndex + 1} of ${steps.length}`

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
