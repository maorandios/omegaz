import { useEffect } from 'react'

/** Writes --keyboard-inset on <html> from visualViewport (no React state → no flicker). */
export function useKeyboardInset(active: boolean) {
  useEffect(() => {
    const root = document.documentElement
    if (!active) {
      root.style.removeProperty('--keyboard-inset')
      return
    }

    const vv = window.visualViewport
    if (!vv) return

    let raf = 0
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      root.style.setProperty('--keyboard-inset', `${inset}px`)
    }
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    vv.addEventListener('resize', schedule)
    vv.addEventListener('scroll', schedule)
    window.addEventListener('orientationchange', schedule)
    update()

    return () => {
      cancelAnimationFrame(raf)
      vv.removeEventListener('resize', schedule)
      vv.removeEventListener('scroll', schedule)
      window.removeEventListener('orientationchange', schedule)
      root.style.removeProperty('--keyboard-inset')
    }
  }, [active])
}

/** Sync header height into --wizard-header-h for square preview sizing. */
export function useWizardHeaderHeight(active: boolean) {
  useEffect(() => {
    if (!active) return

    const header = document.querySelector('[data-wizard-header]')
    if (!header) return

    const root = document.documentElement
    const set = () => root.style.setProperty('--wizard-header-h', `${header.getBoundingClientRect().height}px`)

    const ro = new ResizeObserver(set)
    ro.observe(header)
    set()

    return () => {
      ro.disconnect()
      root.style.removeProperty('--wizard-header-h')
    }
  }, [active])
}
