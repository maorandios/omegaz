import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type AnimationEvent,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

export type StackDirection = 'forward' | 'back'

interface ScreenStackProps {
  activeKey: string
  screens: Record<string, ReactNode>
  getDirection?: (fromKey: string, toKey: string) => StackDirection
  className?: string
}

export const STACK_TRANSITION_MS = 300

const EXIT_ANIMATION_NAMES = new Set([
  'stack-exit-forward',
  'stack-exit-back',
])

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function ScreenStack({ activeKey, screens, getDirection, className }: ScreenStackProps) {
  const prevKeyRef = useRef(activeKey)
  const fallbackTimerRef = useRef<number | null>(null)
  const [direction, setDirection] = useState<StackDirection>('forward')
  const [visibleKeys, setVisibleKeys] = useState<string[]>([activeKey])
  const [isAnimating, setIsAnimating] = useState(false)
  const [motionReady, setMotionReady] = useState(true)

  const clearFallback = useCallback(() => {
    if (fallbackTimerRef.current != null) {
      window.clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
  }, [])

  const finishTransition = useCallback(() => {
    clearFallback()
    setIsAnimating(false)
    setMotionReady(true)
    setVisibleKeys([activeKey])
    prevKeyRef.current = activeKey
  }, [activeKey, clearFallback])

  useEffect(() => {
    if (activeKey === prevKeyRef.current) return

    const fromKey = prevKeyRef.current
    setDirection(getDirection?.(fromKey, activeKey) ?? 'forward')

    if (prefersReducedMotion()) {
      finishTransition()
      return
    }

    setIsAnimating(true)
    setMotionReady(false)
    setVisibleKeys([fromKey, activeKey])

    clearFallback()
    fallbackTimerRef.current = window.setTimeout(
      finishTransition,
      STACK_TRANSITION_MS + 80,
    )

    return clearFallback
  }, [activeKey, getDirection, finishTransition, clearFallback])

  useLayoutEffect(() => {
    if (!isAnimating || motionReady) return

    const frame = window.requestAnimationFrame(() => {
      setMotionReady(true)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [isAnimating, motionReady, visibleKeys])

  const handleExitAnimationEnd = useCallback(
    (key: string, event: AnimationEvent<HTMLDivElement>) => {
      if (!isAnimating || key === activeKey) return
      if (!EXIT_ANIMATION_NAMES.has(event.animationName)) return
      if (event.target !== event.currentTarget) return
      finishTransition()
    },
    [activeKey, finishTransition, isAnimating],
  )

  return (
    <div
      className={cn('screen-stack', className)}
      data-animating={isAnimating ? 'true' : undefined}
      style={{ '--stack-transition-duration': `${STACK_TRANSITION_MS}ms` } as CSSProperties}
    >
      {visibleKeys.map((key) => {
        const isExiting = key !== activeKey
        const paneClass = (() => {
          if (!isAnimating) return 'screen-stack__pane--active'

          if (!motionReady) {
            if (isExiting) {
              return direction === 'forward'
                ? 'screen-stack__pane--exit-forward-prep'
                : 'screen-stack__pane--exit-back-prep'
            }
            return direction === 'forward'
              ? 'screen-stack__pane--enter-forward-prep'
              : 'screen-stack__pane--enter-back-prep'
          }

          if (isExiting) {
            return direction === 'forward'
              ? 'screen-stack__pane--exit-forward'
              : 'screen-stack__pane--exit-back'
          }
          return direction === 'forward'
            ? 'screen-stack__pane--enter-forward'
            : 'screen-stack__pane--enter-back'
        })()

        return (
          <div
            key={key}
            className={cn('screen-stack__pane', paneClass)}
            aria-hidden={isExiting}
            inert={isExiting ? true : undefined}
            style={isExiting ? { pointerEvents: 'none' } : undefined}
            onAnimationEnd={
              isExiting ? (event) => handleExitAnimationEnd(key, event) : undefined
            }
          >
            {screens[key]}
          </div>
        )
      })}
    </div>
  )
}
