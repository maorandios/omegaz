import type { ReactNode } from 'react'
import { Delete } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NumericKeypadProps {
  onDigit: (digit: string) => void
  onDecimal: () => void
  onBackspace: () => void
  onClear: () => void
  onBack: () => void
  onNext: () => void
  canGoBack: boolean
  canGoNext: boolean
  className?: string
}

const KEY_SIZE = 'h-[3.25rem] w-[3.25rem]'
const ROW_GAP = 'gap-2.5'
const NAV_WIDTH = 'w-[5.25rem]'

function Key({
  label,
  onClick,
  className,
  ariaLabel,
  disabled,
}: {
  label: ReactNode
  onClick: () => void
  className?: string
  ariaLabel?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
      className={cn(
        KEY_SIZE,
        'flex shrink-0 items-center justify-center rounded-full border border-muted/55 bg-transparent',
        'text-2xl font-light text-foreground transition-colors',
        'enabled:active:border-primary enabled:active:text-primary',
        'touch-manipulation select-none disabled:opacity-40',
        className,
      )}
      onPointerDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function KeyRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', ROW_GAP, className)}>{children}</div>
  )
}

function NavKey({
  label,
  onClick,
  disabled,
  primary,
  className,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  primary?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        NAV_WIDTH,
        'flex h-[3.25rem] shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors touch-manipulation',
        primary
          ? 'border-primary bg-primary text-primary-foreground enabled:active:bg-primary/90'
          : 'border-muted/55 bg-transparent text-foreground enabled:active:border-primary enabled:active:text-primary',
        'disabled:opacity-40',
        className,
      )}
    >
      {label}
    </button>
  )
}

export function NumericKeypad({
  onDigit,
  onDecimal,
  onBackspace,
  onClear,
  onBack,
  onNext,
  canGoBack,
  canGoNext,
  className,
}: NumericKeypadProps) {
  return (
    <div
      className={cn('wizard-keypad flex flex-col pb-1 pt-1', className)}
      role="group"
      aria-label="Numeric keypad"
    >
      <div className="flex flex-col gap-3">
        <KeyRow>
          {(['7', '8', '9'] as const).map((d) => (
            <Key key={d} label={d} onClick={() => onDigit(d)} />
          ))}
          <Key
            label={<Delete className="h-5 w-5 stroke-[1.5px]" aria-hidden />}
            ariaLabel="Delete"
            onClick={onBackspace}
          />
        </KeyRow>

        <KeyRow>
          {(['4', '5', '6'] as const).map((d) => (
            <Key key={d} label={d} onClick={() => onDigit(d)} />
          ))}
          <Key label="." onClick={onDecimal} ariaLabel="Decimal point" className="text-xl" />
        </KeyRow>

        <KeyRow>
          {(['1', '2', '3'] as const).map((d) => (
            <Key key={d} label={d} onClick={() => onDigit(d)} />
          ))}
          <Key label="C" onClick={onClear} ariaLabel="Clear" className="text-xl" />
        </KeyRow>
      </div>

      <KeyRow className="mt-4">
        <NavKey label="Back" onClick={onBack} disabled={!canGoBack} />
        <Key label="0" onClick={() => onDigit('0')} />
        <NavKey label="Next" onClick={onNext} disabled={!canGoNext} primary />
      </KeyRow>
    </div>
  )
}
