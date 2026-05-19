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
    <div className="wizard-bottom-panel w-full bg-background">
      {isCustom && (
        <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-t border-border px-2">
          <Button
            type="button"
            variant="ghost"
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
          <span className="shrink-0 text-xs tabular-nums text-muted">
            {segmentCount}/{CUSTOM_MAX_SEGMENTS}
          </span>
          <Button
            type="button"
            variant="ghost"
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

      <div
        className="wizard-value-bar flex items-center justify-center px-4 py-3"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="truncate text-center text-2xl font-semibold tabular-nums text-foreground">
          {inputValue || '—'}
        </span>
        <span className="ml-2 shrink-0 text-sm font-medium text-muted">{unit}</span>
      </div>

      <NumericKeypad
        onDigit={appendDigit}
        onDecimal={appendDecimal}
        onBackspace={backspace}
        onClear={clear}
        onBack={handleBack}
        onNext={handleNext}
        canGoBack={canGoBack}
        canGoNext={canGoNext}
      />
    </div>
  )
}
