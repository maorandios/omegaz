import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { refreshApp } from '@/lib/refreshApp'
import { cn } from '@/lib/utils'

const PULL_THRESHOLD = 72
const MAX_PULL = 120

interface PullToRefreshProps {
  children: ReactNode
  className?: string
  disabled?: boolean
}

export function PullToRefresh({ children, className, disabled }: PullToRefreshProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const pulling = useRef(false)
  const pullRef = useRef(0)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const refreshingRef = useRef(false)

  const runRefresh = useCallback(async () => {
    refreshingRef.current = true
    setRefreshing(true)
    setPullDistance(PULL_THRESHOLD)
    pullRef.current = PULL_THRESHOLD
    try {
      await refreshApp()
    } catch {
      refreshingRef.current = false
      setRefreshing(false)
      setPullDistance(0)
      pullRef.current = 0
    }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || disabled) return

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current || el.scrollTop > 0) {
        pulling.current = false
        return
      }
      pulling.current = true
      startY.current = e.touches[0]?.clientY ?? 0
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || refreshingRef.current) return
      const y = e.touches[0]?.clientY ?? 0
      const delta = y - startY.current
      if (delta <= 0) {
        pullRef.current = 0
        setPullDistance(0)
        return
      }
      if (el.scrollTop > 0) {
        pulling.current = false
        pullRef.current = 0
        setPullDistance(0)
        return
      }
      e.preventDefault()
      const next = Math.min(delta * 0.55, MAX_PULL)
      pullRef.current = next
      setPullDistance(next)
    }

    const onTouchEnd = () => {
      if (!pulling.current) return
      pulling.current = false
      if (pullRef.current >= PULL_THRESHOLD && !refreshingRef.current) {
        void runRefresh()
      } else {
        pullRef.current = 0
        setPullDistance(0)
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [disabled, runRefresh])

  const showIndicator = pullDistance > 8 || refreshing
  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1)

  return (
    <div className={cn('relative flex min-h-0 flex-1 flex-col', className)}>
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center transition-opacity duration-150',
          showIndicator ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          height: Math.max(pullDistance, refreshing ? PULL_THRESHOLD : 0),
        }}
      >
        <div className="flex flex-col items-center justify-end gap-1 pb-2 pt-2">
          <Loader2
            className={cn('h-5 w-5 text-primary', refreshing && 'animate-spin')}
            style={{
              transform: refreshing ? undefined : `rotate(${progress * 180}deg)`,
            }}
            aria-hidden
          />
          <span className="text-xs text-muted">
            {refreshing
              ? 'Updating…'
              : pullDistance >= PULL_THRESHOLD
                ? 'Release to update'
                : 'Pull to update'}
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pulling.current ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}
