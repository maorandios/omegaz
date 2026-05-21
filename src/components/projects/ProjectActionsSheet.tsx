import type { LucideIcon } from 'lucide-react'
import {
  ArrowDownToLine,
  CirclePlus,
  MessageCircleCheck,
  Send,
  Settings2,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { DeleteProjectSheet } from '@/components/projects/DeleteProjectSheet'
import { ActionRow } from '@/components/shell/ActionRow'
import { ActionsSheetLayout } from '@/components/shell/ActionsSheetLayout'
import { PROJECT_PACKAGE_OPTIONS } from '@/components/shell/packagePickerOptions'
import type { PackageMode } from '@/lib/packageMode'
import { generateProjectZip } from '@/export/generateProjectZip'
import { pdfClientNameFromUser } from '@/export/pdfExportTypes'
import { downloadBlob } from '@/lib/downloadBlob'
import { slugify } from '@/lib/format'
import { buildProjectSharePayload } from '@/lib/projectShare'
import { sharePackageFile } from '@/lib/sharePackage'
import { useAppStore } from '@/store/appStore'
import { useProfileStore } from '@/store/profileStore'

interface ProjectActionsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ActionId = 'add' | 'download' | 'whatsapp' | 'email' | 'delete'
type SheetView = 'actions' | 'package-picker'
type PickerMode = 'download' | 'whatsapp' | 'email'

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
    title: 'Downloads',
    description: 'Drawings only or full project package',
  },
  {
    id: 'whatsapp',
    icon: MessageCircleCheck,
    title: 'Share via WhatsApp',
    description: 'Drawings only or full package',
  },
  {
    id: 'email',
    icon: Send,
    title: 'Share via Email',
    description: 'Drawings only or full package',
  },
  {
    id: 'delete',
    icon: Trash2,
    title: 'Delete project',
    description: 'Remove this project from your list permanently',
    destructive: true,
  },
]

const PICKER_META: Record<
  PickerMode,
  { title: string; icon: LucideIcon; busyLabel: string }
> = {
  download: {
    title: 'Downloads',
    icon: ArrowDownToLine,
    busyLabel: 'Preparing download…',
  },
  whatsapp: {
    title: 'Share via WhatsApp',
    icon: MessageCircleCheck,
    busyLabel: 'Preparing to share…',
  },
  email: {
    title: 'Share via Email',
    icon: Send,
    busyLabel: 'Preparing to share…',
  },
}

export function ProjectActionsSheet({ open, onOpenChange }: ProjectActionsSheetProps) {
  const project = useAppStore((s) => s.getSelectedProject())
  const setActiveProject = useAppStore((s) => s.setActiveProject)
  const setSelectedProject = useAppStore((s) => s.setSelectedProject)
  const openCreatePlateSheet = useAppStore((s) => s.openCreatePlateSheet)
  const deleteProject = useAppStore((s) => s.deleteProject)
  const restart = useProfileStore((s) => s.restart)
  const user = useAppStore((s) => s.user)

  const [sheetView, setSheetView] = useState<SheetView>('actions')
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null)
  const [busyPicker, setBusyPicker] = useState<PackageMode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      setSheetView('actions')
      setPickerMode(null)
      setBusyPicker(null)
      setError(null)
    }
  }, [open])

  if (!project) return null

  const closeActions = () => onOpenChange(false)
  const isBusy = busyPicker !== null
  const picker = pickerMode ? PICKER_META[pickerMode] : null

  const handleAddPlate = () => {
    restart()
    setActiveProject(project.id)
    closeActions()
    openCreatePlateSheet('templates')
  }

  const projectFilename = (mode: PackageMode) => {
    const base = slugify(`${project.name}-${project.serial}`)
    const suffix = mode === 'drawings' ? 'drawings' : 'package'
    return `${base}-${suffix}.zip`
  }

  const handlePackagePick = async (mode: PackageMode) => {
    if (!pickerMode) return
    setBusyPicker(mode)
    setError(null)
    try {
      const blob = await generateProjectZip(project, mode, {
        clientName: pdfClientNameFromUser(user),
      })
      const filename = projectFilename(mode)

      if (pickerMode === 'download') {
        downloadBlob(blob, filename)
      } else {
        const payload = buildProjectSharePayload(project, mode)
        await sharePackageFile(blob, filename, payload, pickerMode)
      }
      closeActions()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusyPicker(null)
    }
  }

  const handleDeleteRequest = () => {
    closeActions()
    setDeleteOpen(true)
  }

  const openPicker = (mode: PickerMode) => {
    setPickerMode(mode)
    setSheetView('package-picker')
  }

  const runAction = (id: ActionId) => {
    switch (id) {
      case 'add':
        handleAddPlate()
        break
      case 'download':
        openPicker('download')
        break
      case 'whatsapp':
        openPicker('whatsapp')
        break
      case 'email':
        openPicker('email')
        break
      case 'delete':
        handleDeleteRequest()
        break
    }
  }

  return (
    <>
      <ActionsSheetLayout
        open={open}
        onOpenChange={onOpenChange}
        titleIcon={picker?.icon ?? Settings2}
        title={picker?.title ?? 'Actions'}
        onBack={
          sheetView === 'package-picker'
            ? () => {
                setSheetView('actions')
                setPickerMode(null)
              }
            : undefined
        }
        footer={
          <>
            {error ? (
              <p className="px-4 pb-4 text-center text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {busyPicker && picker ? (
              <p className="px-4 pb-4 text-center text-sm text-muted">{picker.busyLabel}</p>
            ) : null}
          </>
        }
      >
        {sheetView === 'actions' ? (
          <ul className="mt-4 space-y-2 px-4 pb-4">
            {PROJECT_ACTIONS.map((action) => (
              <li key={action.id}>
                <ActionRow
                  {...action}
                  disabled={isBusy}
                  onSelect={() => runAction(action.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-4 space-y-2 px-4 pb-4">
            {PROJECT_PACKAGE_OPTIONS.map((option) => (
              <li key={option.id}>
                <ActionRow
                  {...option}
                  disabled={isBusy}
                  onSelect={() => void handlePackagePick(option.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </ActionsSheetLayout>

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
