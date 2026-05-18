import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NumericKeypad } from '@/components/wizard/NumericKeypad'
import {
  CUSTOM_MAX_SEGMENTS,
  CUSTOM_MIN_SEGMENTS,
} from '@/geometry/customProfile'
import type { FoldedProfile } from '@/geometry/types'
import { useWizardSegmentInput } from '@/hooks/useWizardSegmentInput'
import { useProfileStore } from '@/store/profileStore'

interface PlateWizardPanelProps {
  profile: FoldedProfile
}

export function PlateWizardPanel({ profile }: PlateWizardPanelProps) {
  const selectedTemplate = useProfileStore((s) => s.selectedTemplate)
  const addCustomSegment = useProfileStore((s) => s.addCustomSegment)
  const removeCustomSegment = useProfileStore((s) => s.removeCustomSegment)
  const isCustom = selectedTemplate === 'custom'
  const segmentCount = profile.segments.length

  const {
    current,
    inputValue,
    unit,
    canGoBack,
    canGoNext,
    appendDigit,
    appendDecimal,
    backspace,
    clear,
    handleNext,
    handleBack,
  } = useWizardSegmentInput(profile)

  if (!current) return null

  return (
    <>
      {isCustom && (
        <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-t border-zinc-800 bg-zinc-950 px-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 flex-1 gap-1.5 text-xs"
            onPointerDown={(e) => e.preventDefault()}
            onClick={removeCustomSegment}
            disabled={segmentCount <= CUSTOM_MIN_SEGMENTS}
            aria-label="Remove last segment"
          >
            <Minus className="h-4 w-4" aria-hidden />
            Remove
          </Button>
          <span className="shrink-0 text-xs tabular-nums text-zinc-400">
            {segmentCount}/{CUSTOM_MAX_SEGMENTS}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 flex-1 gap-1.5 text-xs"
            onPointerDown={(e) => e.preventDefault()}
            onClick={addCustomSegment}
            disabled={segmentCount >= CUSTOM_MAX_SEGMENTS}
            aria-label="Add segment"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add
          </Button>
        </div>
      )}

      <div className="wizard-dock-bar flex h-[var(--wizard-dock-h)] items-center px-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-[4.25rem] shrink-0 px-0 text-sm"
          onPointerDown={(e) => e.preventDefault()}
          onClick={handleBack}
          disabled={!canGoBack}
        >
          Back
        </Button>

        <div
          className="mx-2 flex h-11 min-w-0 flex-1 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 px-3"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="truncate text-center text-lg font-semibold tabular-nums text-zinc-100">
            {inputValue || '—'}
          </span>
          <span className="ml-1.5 shrink-0 text-xs font-medium text-zinc-400">{unit}</span>
        </div>

        <Button
          type="button"
          className="h-11 w-[4.25rem] shrink-0 px-0 text-sm"
          onPointerDown={(e) => e.preventDefault()}
          onClick={handleNext}
          disabled={!canGoNext}
        >
          Next
        </Button>
      </div>

      <div className="wizard-keypad-bar shrink-0">
        <NumericKeypad
          onDigit={appendDigit}
          onDecimal={appendDecimal}
          onBackspace={backspace}
          onClear={clear}
        />
      </div>
    </>
  )
}
