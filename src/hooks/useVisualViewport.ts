import { useEffect, useState } from 'react'

export interface VisualViewportState {
  height: number
  width: number
  offsetTop: number
  /** True when viewport is noticeably shorter (keyboard likely open) */
  keyboardLikelyOpen: boolean
}

export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>(() => ({
    height: window.visualViewport?.height ?? window.innerHeight,
    width: window.visualViewport?.width ?? window.innerWidth,
    offsetTop: window.visualViewport?.offsetTop ?? 0,
    keyboardLikelyOpen: false,
  }))

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      const fullHeight = window.innerHeight
      setState({
        height: vv.height,
        width: vv.width,
        offsetTop: vv.offsetTop,
        keyboardLikelyOpen: vv.height < fullHeight * 0.82,
      })
    }

    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    window.addEventListener('orientationchange', update)
    update()

    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return state
}
