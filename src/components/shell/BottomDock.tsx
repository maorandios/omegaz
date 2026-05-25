import { Box, CircleUserRound, Lock, Zap } from 'lucide-react'
import type { MainTab } from '@/store/appStore'
import { cn } from '@/lib/utils'

const tabs: { id: MainTab | 'create'; label: string; Icon: typeof Box }[] = [
  { id: 'projects', label: 'Projects', Icon: Box },
  { id: 'create', label: 'Create', Icon: Zap },
  { id: 'profile', label: 'Profile', Icon: CircleUserRound },
]

interface BottomDockProps {
  activeTab: MainTab
  createSheetOpen: boolean
  /** When true, Projects + Create render disabled with a lock indicator. */
  locked?: boolean
  onTabChange: (tab: MainTab) => void
  onCreateClick: () => void
}

export function BottomDock({
  activeTab,
  createSheetOpen,
  locked = false,
  onTabChange,
  onCreateClick,
}: BottomDockProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="bottom-dock border-t border-border"
    >
      <div className="bottom-dock__inner mx-auto grid max-w-lg grid-cols-3 items-center px-2">
        {tabs.map(({ id, label, Icon }) => {
          const isCreate = id === 'create'
          const isProfile = id === 'profile'
          const active = isCreate ? createSheetOpen : activeTab === id
          // Profile stays reachable so users can subscribe their way out of
          // the locked state. Everything else is gated.
          const disabled = locked && !isProfile

          const handleClick = () => {
            if (disabled) return
            if (isCreate) onCreateClick()
            else onTabChange(id as MainTab)
          }

          return (
            <button
              key={id}
              type="button"
              onClick={handleClick}
              disabled={disabled}
              aria-disabled={disabled || undefined}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-medium transition-colors',
                active ? 'text-primary' : 'text-muted hover:text-foreground/90',
                disabled && 'cursor-not-allowed opacity-50 hover:text-muted',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <span className="relative">
                <Icon
                  className={cn('h-6 w-6 stroke-[1.75px]', active && 'text-primary')}
                  aria-hidden
                />
                {disabled ? (
                  <Lock
                    aria-hidden
                    className="absolute -right-1.5 -top-1 h-3 w-3 rounded-full bg-background stroke-[2.25px] text-muted"
                  />
                ) : null}
              </span>
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
