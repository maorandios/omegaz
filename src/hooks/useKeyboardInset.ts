import { useEffect } from 'react'

/** Writes --keyboard-inset on <html> from visualViewport (CSS only, no React re-renders). */
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
    let lastInset = -1

    const update = () => {
      const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
      if (inset === lastInset) return
      lastInset = inset
      root.style.setProperty('--keyboard-inset', `${inset}px`)
    }

    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    vv.addEventListener('resize', schedule)
    window.addEventListener('orientationchange', schedule)
    update()

    return () => {
      cancelAnimationFrame(raf)
      vv.removeEventListener('resize', schedule)
      window.removeEventListener('orientationchange', schedule)
      root.style.removeProperty('--keyboard-inset')
    }
  }, [active])
}

/** Sync header height into --wizard-header-h for preview zone sizing. */
export function useWizardHeaderHeight(active: boolean) {
  useEffect(() => {
    if (!active) return

    const header = document.querySelector('[data-wizard-header]')
    if (!header) return

    const root = document.documentElement
    let lastH = -1
    const set = () => {
      const h = Math.round(header.getBoundingClientRect().height)
      if (h === lastH) return
      lastH = h
      root.style.setProperty('--wizard-header-h', `${h}px`)
    }

    const ro = new ResizeObserver(set)
    ro.observe(header)
    set()

    return () => {
      ro.disconnect()
      root.style.removeProperty('--wizard-header-h')
    }
  }, [active])
}
