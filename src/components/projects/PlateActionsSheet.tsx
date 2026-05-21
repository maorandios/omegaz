import type { LucideIcon } from 'lucide-react'
import {
  ArrowDownToLine,
  MessageCircleCheck,
  PencilLine,
  Send,
  Settings2,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { DeletePlateSheet } from '@/components/projects/DeletePlateSheet'
import { ActionRow } from '@/components/shell/ActionRow'
import { ActionsSheetLayout } from '@/components/shell/ActionsSheetLayout'
import { PLATE_PACKAGE_OPTIONS } from '@/components/shell/packagePickerOptions'
import type { PackageMode } from '@/lib/packageMode'
import { generateFabricationZip } from '@/export/generateZip'
import { pdfClientNameFromUser } from '@/export/pdfExportTypes'
import { downloadBlob } from '@/lib/downloadBlob'
import { slugify } from '@/lib/format'
import { computeProfileMetrics } from '@/lib/profileMetrics'
import { buildPlateSharePayload } from '@/lib/plateShare'
import { sharePackageFile } from '@/lib/sharePackage'
import { useViewingPlate } from '@/hooks/useViewingPlate'
import { plateDisplayName } from '@/store/projectTypes'
import { useAppStore } from '@/store/appStore'

interface PlateActionsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ActionId = 'edit' | 'download' | 'whatsapp' | 'email' | 'delete'
type SheetView = 'actions' | 'package-picker'
type PickerMode = 'download' | 'whatsapp' | 'email'

interface ActionRowConfig {
  id: ActionId
  icon: LucideIcon
  title: string
  description: string
  destructive?: boolean
}

const PLATE_ACTIONS: ActionRowConfig[] = [
  {
    id: 'edit',
    icon: PencilLine,
    title: 'Edit plate',
    description: 'Change dimensions and fabrication details.',
  },
  {
    id: 'download',
    icon: ArrowDownToLine,
    title: 'Downloads',
    description: 'Drawing PDF or full plate package',
  },
  {
    id: 'whatsapp',
    icon: MessageCircleCheck,
    title: 'Share via WhatsApp',
    description: 'Drawing PDF or full plate package',
  },
  {
    id: 'email',
    icon: Send,
    title: 'Share via Email',
    description: 'Drawing PDF or full plate package',
  },
  {
    id: 'delete',
    icon: Trash2,
    title: 'Delete plate',
    description: 'Remove this plate from the project permanently.',
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

export function PlateActionsSheet({ open, onOpenChange }: PlateActionsSheetProps) {
  const ctx = useViewingPlate()
  const startPlateEdit = useAppStore((s) => s.startPlateEdit)
  const closePlateView = useAppStore((s) => s.closePlateView)
  const deletePlate = useAppStore((s) => s.deletePlate)
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

  if (!ctx) return null

  const { project, plate } = ctx
  const closeActions = () => onOpenChange(false)
  const isBusy = busyPicker !== null
  const picker = pickerMode ? PICKER_META[pickerMode] : null
  const plateSlug = slugify(plateDisplayName(plate))

  const plateFilename = (mode: PackageMode) =>
    mode === 'drawings' ? `${plateSlug}-drawing.pdf` : `${plateSlug}-package.zip`

  const handleEdit = () => {
    closeActions()
    startPlateEdit()
  }

  const handlePackagePick = async (mode: PackageMode) => {
    if (!pickerMode) return
    setBusyPicker(mode)
    setError(null)
    try {
      const metrics = computeProfileMetrics(plate.profile)
      const blob = await generateFabricationZip(
        plate.profile,
        metrics,
        plate.selectedTemplate,
        mode,
        { clientName: pdfClientNameFromUser(user) },
      )
      const filename = plateFilename(mode)

      if (pickerMode === 'download') {
        downloadBlob(blob, filename)
      } else {
        const payload = buildPlateSharePayload(project, plate, mode)
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
      case 'edit':
        handleEdit()
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
            {PLATE_ACTIONS.map((action) => (
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
            {PLATE_PACKAGE_OPTIONS.map((option) => (
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

      <DeletePlateSheet
        open={deleteOpen}
        plate={plate}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          deletePlate(project.id, plate.id)
          closePlateView()
        }}
      />
    </>
  )
}
