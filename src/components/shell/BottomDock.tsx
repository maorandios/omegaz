import { Box, CircleUserRound, Zap } from 'lucide-react'
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
  onTabChange: (tab: MainTab) => void
  onCreateClick: () => void
}

export function BottomDock({
  activeTab,
  createSheetOpen,
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
          const active = isCreate ? createSheetOpen : activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => (isCreate ? onCreateClick() : onTabChange(id))}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-medium transition-colors',
                active ? 'text-primary' : 'text-muted hover:text-foreground/90',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                className={cn('h-6 w-6 stroke-[1.75px]', active && 'text-primary')}
                aria-hidden
              />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
