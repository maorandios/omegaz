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
      className={cn('wizard-key', className)}
      onPointerDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function KeyRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('wizard-keypad__row', className)}>{children}</div>
}

function NavKey({
  label,
  onClick,
  disabled,
  primary,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  primary?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn('wizard-nav-key', primary && 'wizard-nav-key--primary')}
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
      <div className="wizard-keypad__digits">
        <KeyRow>
          {(['7', '8', '9'] as const).map((d) => (
            <Key key={d} label={d} onClick={() => onDigit(d)} />
          ))}
          <Key
            label={<Delete className="wizard-key__delete-icon" aria-hidden />}
            ariaLabel="Delete"
            onClick={onBackspace}
          />
        </KeyRow>

        <KeyRow>
          {(['4', '5', '6'] as const).map((d) => (
            <Key key={d} label={d} onClick={() => onDigit(d)} />
          ))}
          <Key
            label="."
            onClick={onDecimal}
            ariaLabel="Decimal point"
            className="wizard-key--secondary"
          />
        </KeyRow>

        <KeyRow>
          {(['1', '2', '3'] as const).map((d) => (
            <Key key={d} label={d} onClick={() => onDigit(d)} />
          ))}
          <Key label="C" onClick={onClear} ariaLabel="Clear" className="wizard-key--secondary" />
        </KeyRow>
      </div>

      <KeyRow className="wizard-keypad__nav-row">
        <NavKey label="Back" onClick={onBack} disabled={!canGoBack} />
        <Key label="0" onClick={() => onDigit('0')} />
        <NavKey label="Next" onClick={onNext} disabled={!canGoNext} primary />
      </KeyRow>
    </div>
  )
}
