import {
  useCallback,
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react'
import { cn } from '@/lib/utils'

const LENGTH = 6
/** Visual split position — three boxes, gap, three boxes. */
const SPLIT_AT = 3

interface OtpInputProps {
  value: string
  onChange: (next: string) => void
  onComplete?: (code: string) => void
  disabled?: boolean
  autoFocus?: boolean
  ariaLabel?: string
}

function sanitize(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, LENGTH)
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus,
  ariaLabel = 'One-time code',
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const completedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!autoFocus) return
    const t = window.setTimeout(() => inputRefs.current[0]?.focus(), 80)
    return () => window.clearTimeout(t)
  }, [autoFocus])

  useEffect(() => {
    if (value.length === LENGTH && completedFor.current !== value) {
      completedFor.current = value
      onComplete?.(value)
    }
    if (value.length < LENGTH) completedFor.current = null
  }, [value, onComplete])

  const focusIndex = useCallback((index: number) => {
    const target = inputRefs.current[Math.max(0, Math.min(LENGTH - 1, index))]
    target?.focus()
    target?.select?.()
  }, [])

  const setDigit = useCallback(
    (index: number, digit: string) => {
      const chars = value.padEnd(LENGTH, ' ').split('')
      chars[index] = digit || ' '
      const joined = chars.join('').replace(/\s/g, '')
      onChange(sanitize(joined))
    },
    [value, onChange],
  )

  const handleChange = (index: number, rawValue: string) => {
    const cleaned = sanitize(rawValue)

    if (cleaned.length > 1) {
      const merged = sanitize(value.slice(0, index) + cleaned)
      onChange(merged)
      focusIndex(Math.min(merged.length, LENGTH - 1))
      return
    }

    if (!cleaned) {
      setDigit(index, '')
      return
    }

    setDigit(index, cleaned)
    if (index < LENGTH - 1) focusIndex(index + 1)
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    const key = event.key

    if (key === 'Backspace') {
      if (value[index]) {
        setDigit(index, '')
        return
      }
      if (index > 0) {
        event.preventDefault()
        setDigit(index - 1, '')
        focusIndex(index - 1)
      }
      return
    }

    if (key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      focusIndex(index - 1)
      return
    }
    if (key === 'ArrowRight' && index < LENGTH - 1) {
      event.preventDefault()
      focusIndex(index + 1)
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = sanitize(event.clipboardData.getData('text'))
    if (!pasted) return
    event.preventDefault()
    onChange(pasted)
    focusIndex(Math.min(pasted.length, LENGTH - 1))
  }

  return (
    <div
      className="flex items-center justify-center gap-2"
      role="group"
      aria-label={ariaLabel}
    >
      {Array.from({ length: LENGTH }).map((_, i) => {
        const showSeparator = i === SPLIT_AT
        const digit = value[i] ?? ''
        return (
          <div key={i} className="flex items-center">
            {showSeparator ? (
              <span aria-hidden className="mr-2 block h-px w-3 bg-border" />
            ) : null}
            <input
              ref={(el) => {
                inputRefs.current[i] = el
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={disabled}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              aria-label={`Digit ${i + 1}`}
              className={cn(
                'h-12 w-10 rounded-xl border border-border bg-surface/40 text-center text-lg font-semibold text-foreground caret-primary',
                'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                'disabled:opacity-50',
              )}
            />
          </div>
        )
      })}
    </div>
  )
}

export { LENGTH as OTP_LENGTH }
