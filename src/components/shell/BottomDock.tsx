import { CircleUserRound, Star, Zap } from 'lucide-react'
import type { MainTab } from '@/store/appStore'
import { cn } from '@/lib/utils'

const tabs: { id: MainTab; label: string; Icon: typeof Star }[] = [
  { id: 'projects', label: 'Projects', Icon: Star },
  { id: 'create', label: 'Create', Icon: Zap },
  { id: 'profile', label: 'Profile', Icon: CircleUserRound },
]

interface BottomDockProps {
  activeTab: MainTab
  onTabChange: (tab: MainTab) => void
}

export function BottomDock({ activeTab, onTabChange }: BottomDockProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="bottom-dock border-t border-border"
    >
      <div className="bottom-dock__inner mx-auto grid max-w-lg grid-cols-3 items-center px-2">
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
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
