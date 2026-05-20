import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type StackDirection = 'forward' | 'back'

interface ScreenStackProps {
  activeKey: string
  screens: Record<string, ReactNode>
  getDirection?: (fromKey: string, toKey: string) => StackDirection
  className?: string
}

export const STACK_TRANSITION_MS = 320

export function ScreenStack({ activeKey, screens, getDirection, className }: ScreenStackProps) {
  const prevKeyRef = useRef(activeKey)
  const [direction, setDirection] = useState<StackDirection>('forward')
  const [visibleKeys, setVisibleKeys] = useState<string[]>([activeKey])
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (activeKey === prevKeyRef.current) return

    const fromKey = prevKeyRef.current
    setDirection(getDirection?.(fromKey, activeKey) ?? 'forward')
    setIsAnimating(true)
    setVisibleKeys([fromKey, activeKey])

    const timer = window.setTimeout(() => {
      setIsAnimating(false)
      setVisibleKeys([activeKey])
      prevKeyRef.current = activeKey
    }, STACK_TRANSITION_MS)

    return () => window.clearTimeout(timer)
  }, [activeKey, getDirection])

  return (
    <div
      className={cn('screen-stack', className)}
      style={{ '--stack-transition-duration': `${STACK_TRANSITION_MS}ms` } as CSSProperties}
    >
      {visibleKeys.map((key) => {
        const isExiting = key !== activeKey
        const paneClass = isAnimating
          ? isExiting
            ? direction === 'forward'
              ? 'screen-stack__pane--exit-forward'
              : 'screen-stack__pane--exit-back'
            : direction === 'forward'
              ? 'screen-stack__pane--enter-forward'
              : 'screen-stack__pane--enter-back'
          : 'screen-stack__pane--active'

        return (
          <div
            key={key}
            className={cn('screen-stack__pane', paneClass)}
            aria-hidden={isExiting}
            style={isExiting ? { pointerEvents: 'none' } : undefined}
          >
            {screens[key]}
          </div>
        )
      })}
    </div>
  )
}
