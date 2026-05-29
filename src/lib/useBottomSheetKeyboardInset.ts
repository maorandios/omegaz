import { useEffect, useRef, type RefObject } from 'react'

/** Duration of bottom sheet slide-in (`sheet-slide-in` in index.css). */
export const BOTTOM_SHEET_OPEN_MS = 360

function keyboardInsetPx(): number {
  const vv = window.visualViewport
  if (!vv) return 0
  return Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
}

/**
 * Lifts a fixed bottom sheet above the on-screen keyboard when
 * `interactive-widget=overlays-content` is set on the viewport meta tag.
 */
export function useBottomSheetKeyboardInset(active: boolean) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return

    const getDialog = () =>
      contentRef.current?.closest('[role="dialog"]') as HTMLElement | null

    const sync = () => {
      const el = getDialog()
      if (!el) return
      const inset = keyboardInsetPx()
      el.style.bottom = inset > 0 ? `${inset}px` : ''
    }

    const vv = window.visualViewport
    vv?.addEventListener('resize', sync)
    vv?.addEventListener('scroll', sync)
    sync()

    return () => {
      vv?.removeEventListener('resize', sync)
      vv?.removeEventListener('scroll', sync)
      const el = getDialog()
      if (el) el.style.bottom = ''
    }
  }, [active])

  return contentRef
}

/** Focus an input after the sheet open animation, then keep it above the keyboard. */
export function useDelayedSheetInputFocus(
  active: boolean,
  inputRef: RefObject<HTMLInputElement | null>,
  delayMs = BOTTOM_SHEET_OPEN_MS,
) {
  useEffect(() => {
    if (!active) return

    let cancelled = false
    const timer = window.setTimeout(() => {
      if (cancelled) return
      inputRef.current?.focus({ preventScroll: true })
    }, delayMs)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [active, delayMs, inputRef])
}
