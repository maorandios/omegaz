import type { LucideIcon } from 'lucide-react'
import {
  ArrowDownToLine,
  CirclePlus,
  MessageCircleCheck,
  Send,
  Settings2,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { DeleteProjectSheet } from '@/components/projects/DeleteProjectSheet'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { generateProjectZip } from '@/export/generateProjectZip'
import { downloadBlob } from '@/lib/downloadBlob'
import {
  buildProjectMailto,
  buildProjectShareMessage,
  openEmailShare,
  openWhatsAppShare,
} from '@/lib/projectShare'
import { slugify } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import { useProfileStore } from '@/store/profileStore'

interface ProjectActionsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ActionId = 'add' | 'download' | 'whatsapp' | 'email' | 'delete'

interface ActionRowConfig {
  id: ActionId
  icon: LucideIcon
  title: string
  description: string
  destructive?: boolean
}

const PROJECT_ACTIONS: ActionRowConfig[] = [
  {
    id: 'add',
    icon: CirclePlus,
    title: 'Add new plate',
    description: 'Start another plate in this project.',
  },
  {
    id: 'download',
    icon: ArrowDownToLine,
    title: 'Download package',
    description: 'Export drawings and plates list',
  },
  {
    id: 'whatsapp',
    icon: MessageCircleCheck,
    title: 'Share via WhatsApp',
    description: 'Send full package via whatsapp',
  },
  {
    id: 'email',
    icon: Send,
    title: 'Share via Email',
    description: 'Email the project package from your device.',
  },
  {
    id: 'delete',
    icon: Trash2,
    title: 'Delete project',
    description: 'Remove this project from your list permanently',
    destructive: true,
  },
]

interface ActionRowProps extends ActionRowConfig {
  disabled?: boolean
  onSelect: () => void
}

function ActionRow({
  icon: Icon,
  title,
  description,
  destructive,
  disabled,
  onSelect,
}: ActionRowProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border border-border bg-surface/40 px-4 py-4 text-left transition-colors',
        'hover:border-border hover:bg-surface/55 active:bg-surface/55',
        'disabled:pointer-events-none disabled:opacity-50',
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 shrink-0 stroke-[1.75px]',
          destructive ? 'text-destructive' : 'text-primary',
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block text-sm font-medium',
            destructive ? 'text-destructive' : 'text-foreground',
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
  const project = useAppStore((s) => s.getSelectedProject())
  const setActiveProject = useAppStore((s) => s.setActiveProject)
  const setSelectedProject = useAppStore((s) => s.setSelectedProject)
  const setMainTab = useAppStore((s) => s.setMainTab)
  const deleteProject = useAppStore((s) => s.deleteProject)
  const restart = useProfileStore((s) => s.restart)

  const [busyAction, setBusyAction] = useState<ActionId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!project) return null

  const closeActions = () => onOpenChange(false)

  const handleAddPlate = () => {
    restart()
    setActiveProject(project.id)
    setMainTab('create', { keepActiveProject: true })
    closeActions()
  }

  const handleDownload = async () => {
    setBusyAction('download')
    setError(null)
    try {
      const blob = await generateProjectZip(project)
      const filename = `${slugify(`${project.name}-${project.serial}`)}.zip`
      downloadBlob(blob, filename)
      closeActions()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed')
    } finally {
      setBusyAction(null)
    }
  }

  const handleWhatsApp = () => {
    openWhatsAppShare(buildProjectShareMessage(project))
    closeActions()
  }

  const handleEmail = () => {
    const { subject, body } = buildProjectMailto(project)
    openEmailShare(subject, body)
    closeActions()
  }

  const handleDeleteRequest = () => {
    closeActions()
    setDeleteOpen(true)
  }

  const runAction = (id: ActionId) => {
    switch (id) {
      case 'add':
        handleAddPlate()
        break
      case 'download':
        void handleDownload()
        break
      case 'whatsapp':
        handleWhatsApp()
        break
      case 'email':
        handleEmail()
        break
      case 'delete':
        handleDeleteRequest()
        break
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          overlayClassName="bg-black/40 backdrop-blur-md"
          className="mx-auto max-w-lg gap-0 border-border bg-background p-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        >
          <div className="px-6 pt-4">
            <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
            <SheetHeader className="text-left">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 shrink-0 stroke-[1.75px] text-primary" aria-hidden />
                <SheetTitle className="mb-0">Actions</SheetTitle>
              </div>
            </SheetHeader>
          </div>

          <ul className="mt-4 space-y-2 px-4 pb-4">
            {PROJECT_ACTIONS.map((action) => (
              <li key={action.id}>
                <ActionRow
                  {...action}
                  disabled={busyAction !== null}
                  onSelect={() => runAction(action.id)}
                />
              </li>
            ))}
          </ul>

          {error ? (
            <p className="px-4 pb-4 text-center text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {busyAction === 'download' ? (
            <p className="px-4 pb-4 text-center text-sm text-muted">Preparing package…</p>
          ) : null}
        </SheetContent>
      </Sheet>

      <DeleteProjectSheet
        open={deleteOpen}
        projectName={project.name}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          deleteProject(project.id)
          setSelectedProject(null)
        }}
      />
    </>
  )
}
