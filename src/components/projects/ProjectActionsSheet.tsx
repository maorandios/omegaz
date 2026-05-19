import type { LucideIcon } from 'lucide-react'
import {
  ArrowDownToLine,
  CirclePlus,
  MessageCircleCheck,
  Send,
  Trash2,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface ProjectActionsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ActionRowConfig {
  icon: LucideIcon
  title: string
  description: string
  destructive?: boolean
}

const PROJECT_ACTIONS: ActionRowConfig[] = [
  {
    icon: CirclePlus,
    title: 'Add new plate',
    description: 'Start another plate in this project batch.',
  },
  {
    icon: ArrowDownToLine,
    title: 'Download package',
    description: 'Export drawings and specs for this project.',
  },
  {
    icon: MessageCircleCheck,
    title: 'Share via WhatsApp',
    description: 'Send a summary link to your customer or team.',
  },
  {
    icon: Send,
    title: 'Share via Email',
    description: 'Email the project package from your device.',
  },
  {
    icon: Trash2,
    title: 'Delete project',
    description: 'Remove this batch and all plates permanently.',
    destructive: true,
  },
]

function ActionRow({ icon: Icon, title, description, destructive }: ActionRowConfig) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left transition-colors',
        'hover:bg-surface-raised active:bg-surface-raised/80',
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          destructive ? 'bg-red-950/40' : 'bg-background/80',
        )}
      >
        <Icon
          className={cn(
            'h-5 w-5 stroke-[1.75px]',
            destructive ? 'text-red-400' : 'text-primary',
          )}
          aria-hidden
        />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block text-sm font-medium',
            destructive ? 'text-red-400' : 'text-foreground',
          )}
        >
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-muted">{description}</span>
      </span>
    </button>
  )
}

export function ProjectActionsSheet({ open, onOpenChange }: ProjectActionsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        overlayClassName="bg-black/40 backdrop-blur-md"
        className="mx-auto max-w-lg gap-0 p-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="px-6 pt-4">
          <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
          <SheetHeader className="text-left">
            <SheetTitle>Actions</SheetTitle>
          </SheetHeader>
        </div>

        <ul className="mt-2 space-y-0.5 px-3 pb-4">
          {PROJECT_ACTIONS.map((action) => (
            <li key={action.title}>
              <ActionRow {...action} />
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  )
}
