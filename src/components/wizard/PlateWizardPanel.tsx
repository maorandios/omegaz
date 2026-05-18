import { Button } from '@/components/ui/button'
import { NumericKeypad } from '@/components/wizard/NumericKeypad'
import type { FoldedProfile } from '@/geometry/types'
import { useWizardSegmentInput } from '@/hooks/useWizardSegmentInput'

interface PlateWizardPanelProps {
  profile: FoldedProfile
}

export function PlateWizardPanel({ profile }: PlateWizardPanelProps) {
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
