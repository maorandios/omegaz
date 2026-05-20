import { CircleCheck, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

const VISIBLE_MS = 2000
const LEAVE_MS = 280

interface TopToastProps {
  show: boolean
  message?: string
  icon?: LucideIcon
  onHidden?: () => void
}

export function TopToast({
  show,
  message = 'Saved',
  icon: Icon = CircleCheck,
  onHidden,
}: TopToastProps) {
  const [phase, setPhase] = useState<'hidden' | 'enter' | 'leave'>('hidden')

  useEffect(() => {
    if (!show) {
      setPhase('hidden')
      return
    }

    setPhase('enter')
    const leaveTimer = window.setTimeout(() => setPhase('leave'), VISIBLE_MS)
    const hideTimer = window.setTimeout(() => {
      setPhase('hidden')
      onHidden?.()
    }, VISIBLE_MS + LEAVE_MS)

    return () => {
      window.clearTimeout(leaveTimer)
      window.clearTimeout(hideTimer)
    }
  }, [show, onHidden])

  if (phase === 'hidden') return null

  return createPortal(
    <div
      className={cn('top-toast', phase === 'leave' && 'top-toast--leave')}
      role="status"
      aria-live="polite"
    >
      <Icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={2} aria-hidden />
      <span className="text-sm font-semibold text-foreground">{message}</span>
    </div>,
    document.body,
  )
}
