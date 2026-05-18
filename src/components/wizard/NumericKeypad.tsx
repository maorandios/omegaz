import type { ReactNode } from 'react'
import { Delete } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NumericKeypadProps {
  onDigit: (digit: string) => void
  onDecimal: () => void
  onBackspace: () => void
  onClear: () => void
  className?: string
}

function Key({
  label,
  onClick,
  className,
  ariaLabel,
}: {
  label: ReactNode
  onClick: () => void
  className?: string
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
      className={cn(
        'flex min-h-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-lg font-semibold text-zinc-100',
        'active:bg-zinc-700 touch-manipulation select-none',
        className,
      )}
      onPointerDown={(e) => e.preventDefault()}
      onClick={onClick}
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
  className,
}: NumericKeypadProps) {
  return (
    <div
      role="group"
      aria-label="Numeric keypad"
      className={cn('wizard-keypad grid h-full grid-cols-4 grid-rows-4 gap-1.5 p-2', className)}
    >
      {(['7', '8', '9'] as const).map((d) => (
        <Key key={d} label={d} onClick={() => onDigit(d)} />
      ))}
      <Key
        label={<Delete className="h-5 w-5" aria-hidden />}
        ariaLabel="Backspace"
        onClick={onBackspace}
      />

      {(['4', '5', '6'] as const).map((d) => (
        <Key key={d} label={d} onClick={() => onDigit(d)} />
      ))}
      <Key label="." onClick={onDecimal} ariaLabel="Decimal point" />

      {(['1', '2', '3'] as const).map((d) => (
        <Key key={d} label={d} onClick={() => onDigit(d)} />
      ))}
      <div aria-hidden className="min-h-0" />

      <Key label="0" onClick={() => onDigit('0')} className="col-span-2" />
      <Key label="C" onClick={onClear} ariaLabel="Clear" />
    </div>
  )
}
