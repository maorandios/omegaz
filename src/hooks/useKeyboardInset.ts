import { useEffect } from 'react'

/** Syncs --vv-offset-top / --vv-height to match the visible viewport (iOS keyboard-safe). */
function syncVisualViewport() {
  const root = document.documentElement
  const vv = window.visualViewport
  if (!vv) return

  root.style.setProperty('--vv-offset-top', `${Math.round(vv.offsetTop)}px`)
  root.style.setProperty('--vv-height', `${Math.round(vv.height)}px`)
  window.dispatchEvent(new Event('wizard-vv-update'))
}

export function useVisualViewportSync(active: boolean) {
  useEffect(() => {
    const root = document.documentElement
    if (!active) {
      root.style.removeProperty('--vv-offset-top')
      root.style.removeProperty('--vv-height')
      return
    }

    const vv = window.visualViewport
    if (!vv) return

    let raf = 0
    let lastKey = ''

    const update = () => {
      const key = `${Math.round(vv.offsetTop)}:${Math.round(vv.height)}`
      if (key === lastKey) return
      lastKey = key
      syncVisualViewport()
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

    const t1 = window.setTimeout(update, 80)
    const t2 = window.setTimeout(update, 200)
    const t3 = window.setTimeout(update, 450)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      vv.removeEventListener('resize', schedule)
      vv.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('orientationchange', schedule)
      root.style.removeProperty('--vv-offset-top')
      root.style.removeProperty('--vv-height')
    }
  }, [active])
}

/** Re-sync after input focus / blur (keyboard animation). */
export function refreshWizardViewport() {
  requestAnimationFrame(() => {
    syncVisualViewport()
    requestAnimationFrame(syncVisualViewport)
  })
}

/** @deprecated */
export function useKeyboardInset(active: boolean) {
  useVisualViewportSync(active)
}

/** @deprecated */
export function useWizardHeaderHeight(active: boolean) {
  useVisualViewportSync(active)
}
