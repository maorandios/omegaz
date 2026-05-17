import { useEffect } from 'react'

const WIZARD_DOCK_PX = 56

function syncWizardLayout() {
  const root = document.documentElement
  const vv = window.visualViewport
  if (!vv) return

  const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
  const vvHeight = Math.round(vv.height)
  const vvOffset = Math.round(vv.offsetTop)

  root.style.setProperty('--keyboard-inset', `${inset}px`)
  root.style.setProperty('--vv-height', `${vvHeight}px`)
  root.style.setProperty('--vv-offset-top', `${vvOffset}px`)

  const header = document.querySelector('[data-wizard-header]')
  const headerBottom = header
    ? Math.round(header.getBoundingClientRect().bottom)
    : 48
  root.style.setProperty('--wizard-header-top', `${headerBottom}px`)

  const previewHeight = Math.max(120, vvHeight - headerBottom - WIZARD_DOCK_PX)
  root.style.setProperty('--wizard-preview-height', `${previewHeight}px`)

  // iOS keeps offsetTop after Done — reset so fixed layout doesn't drift upward
  if (inset === 0 && vvOffset > 0) {
    window.scrollTo(0, 0)
  }

  window.dispatchEvent(new Event('wizard-vv-update'))
}

/** Tracks visual viewport for wizard dock + preview (CSS vars only, no React re-renders). */
export function useKeyboardInset(active: boolean) {
  useEffect(() => {
    const root = document.documentElement
    if (!active) {
      root.style.removeProperty('--keyboard-inset')
      root.style.removeProperty('--vv-height')
      root.style.removeProperty('--vv-offset-top')
      root.style.removeProperty('--wizard-preview-height')
      return
    }

    const vv = window.visualViewport
    if (!vv) return

    let raf = 0
    let lastKey = ''

    const update = () => {
      const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
      const key = `${inset}:${Math.round(vv.height)}:${Math.round(vv.offsetTop)}`
      if (key === lastKey) return
      lastKey = key
      syncWizardLayout()
    }

    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    vv.addEventListener('resize', schedule)
    vv.addEventListener('scroll', schedule)
    window.addEventListener('resize', schedule)
    window.addEventListener('orientationchange', schedule)
    update()

    // Catch keyboard open/close after focus changes
    const t1 = window.setTimeout(update, 100)
    const t2 = window.setTimeout(update, 350)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      vv.removeEventListener('resize', schedule)
      vv.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('orientationchange', schedule)
      root.style.removeProperty('--keyboard-inset')
      root.style.removeProperty('--vv-height')
      root.style.removeProperty('--vv-offset-top')
      root.style.removeProperty('--wizard-preview-height')
    }
  }, [active])
}

/** Re-measure header + preview after keyboard toggle (call from input focus/blur). */
export function refreshWizardViewport() {
  requestAnimationFrame(() => {
    syncWizardLayout()
    requestAnimationFrame(syncWizardLayout)
  })
}

/** @deprecated Use layout values from useKeyboardInset */
export function useWizardHeaderHeight(active: boolean) {
  useKeyboardInset(active)
}
