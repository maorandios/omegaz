import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type StackDirection = 'forward' | 'back'

interface ScreenStackProps {
  activeKey: string
  screens: Record<string, ReactNode>
  getDirection?: (fromKey: string, toKey: string) => StackDirection
  className?: string
}

const TRANSITION_MS = 340

export function ScreenStack({ activeKey, screens, getDirection, className }: ScreenStackProps) {
  const prevKeyRef = useRef(activeKey)
  const [direction, setDirection] = useState<StackDirection>('forward')
  const [visibleKeys, setVisibleKeys] = useState<string[]>([activeKey])

  useEffect(() => {
    if (activeKey === prevKeyRef.current) return

    const fromKey = prevKeyRef.current
    const nextDirection = getDirection?.(fromKey, activeKey) ?? 'forward'
    setDirection(nextDirection)
    setVisibleKeys([fromKey, activeKey])

    const timer = window.setTimeout(() => {
      setVisibleKeys([activeKey])
      prevKeyRef.current = activeKey
    }, TRANSITION_MS)

    return () => window.clearTimeout(timer)
  }, [activeKey, getDirection])

  const isTransitioning = visibleKeys.length > 1

  return (
    <div className={cn('screen-stack', className)}>
      {visibleKeys.map((key) => {
        const isExiting = key !== activeKey
        const paneClass =
          isTransitioning && isExiting
            ? direction === 'forward'
              ? 'screen-stack__pane--exit-forward'
              : 'screen-stack__pane--exit-back'
            : isTransitioning && !isExiting
              ? direction === 'forward'
                ? 'screen-stack__pane--enter-forward'
                : 'screen-stack__pane--enter-back'
              : 'screen-stack__pane--active'

        return (
          <div
            key={`${key}-${isExiting ? 'exit' : 'enter'}`}
            className={cn('screen-stack__pane', paneClass)}
            aria-hidden={isExiting}
          >
            {screens[key]}
          </div>
        )
      })}
    </div>
  )
}
