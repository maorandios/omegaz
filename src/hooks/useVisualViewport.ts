import { useEffect, useState } from 'react'

export interface VisualViewportState {
  height: number
  width: number
  offsetTop: number
  /** Pixels from visual viewport bottom to window bottom (keyboard area) */
  keyboardInsetBottom: number
  /** True when viewport is noticeably shorter (keyboard likely open) */
  keyboardLikelyOpen: boolean
}

export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>(() => {
    const vv = window.visualViewport
    const h = vv?.height ?? window.innerHeight
    const top = vv?.offsetTop ?? 0
    return {
      height: h,
      width: vv?.width ?? window.innerWidth,
      offsetTop: top,
      keyboardInsetBottom: Math.max(0, window.innerHeight - h - top),
      keyboardLikelyOpen: false,
    }
  })

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      const fullHeight = window.innerHeight
      const inset = Math.max(0, fullHeight - vv.height - vv.offsetTop)
      setState({
        height: vv.height,
        width: vv.width,
        offsetTop: vv.offsetTop,
        keyboardInsetBottom: inset,
        keyboardLikelyOpen: inset > 48 || vv.height < fullHeight * 0.78,
      })
    }

    let raf = 0
    const scheduleUpdate = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    vv.addEventListener('resize', scheduleUpdate)
    vv.addEventListener('scroll', scheduleUpdate)
    window.addEventListener('orientationchange', scheduleUpdate)
    window.addEventListener('resize', scheduleUpdate)
    update()

    return () => {
      cancelAnimationFrame(raf)
      vv.removeEventListener('resize', scheduleUpdate)
      vv.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('orientationchange', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [])

  return state
}
