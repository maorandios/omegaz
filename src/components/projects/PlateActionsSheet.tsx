import type { LucideIcon } from 'lucide-react'
import {
  ArrowDownToLine,
  MessageCircleCheck,
  PencilLine,
  Send,
  Settings2,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { DeletePlateSheet } from '@/components/projects/DeletePlateSheet'
import { ActionRow } from '@/components/shell/ActionRow'
import { ActionsSheetLayout } from '@/components/shell/ActionsSheetLayout'
import { generateFabricationZip } from '@/export/generateZip'
import { downloadBlob } from '@/lib/downloadBlob'
import { buildPlateMailto, buildPlateShareMessage } from '@/lib/plateShare'
import { openEmailShare, openWhatsAppShare } from '@/lib/projectShare'
import { slugify } from '@/lib/format'
import { computeProfileMetrics } from '@/lib/profileMetrics'
import { useViewingPlate } from '@/hooks/useViewingPlate'
import { plateDisplayName } from '@/store/projectTypes'
import { useAppStore } from '@/store/appStore'

interface PlateActionsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ActionId = 'edit' | 'download' | 'whatsapp' | 'email' | 'delete'

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
    title: 'Download package',
    description: 'Export drawing, cut list, and preview.',
  },
  {
    id: 'whatsapp',
    icon: MessageCircleCheck,
    title: 'Share via WhatsApp',
    description: 'Send plate details via WhatsApp.',
  },
  {
    id: 'email',
    icon: Send,
    title: 'Share via Email',
    description: 'Email plate details from your device.',
  },
  {
    id: 'delete',
    icon: Trash2,
    title: 'Delete plate',
    description: 'Remove this plate from the project permanently.',
    destructive: true,
  },
]

export function PlateActionsSheet({ open, onOpenChange }: PlateActionsSheetProps) {
  const ctx = useViewingPlate()
  const startPlateEdit = useAppStore((s) => s.startPlateEdit)
  const closePlateView = useAppStore((s) => s.closePlateView)
  const deletePlate = useAppStore((s) => s.deletePlate)

  const [busyAction, setBusyAction] = useState<ActionId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!ctx) return null

  const { project, plate } = ctx
  const closeActions = () => onOpenChange(false)

  const handleEdit = () => {
    closeActions()
    startPlateEdit()
  }

  const handleDownload = async () => {
    setBusyAction('download')
    setError(null)
    try {
      const metrics = computeProfileMetrics(plate.profile)
      const blob = await generateFabricationZip(
        plate.profile,
        metrics,
        plate.selectedTemplate,
      )
      const filename = `${slugify(plateDisplayName(plate))}.zip`
      downloadBlob(blob, filename)
      closeActions()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed')
    } finally {
      setBusyAction(null)
    }
  }

  const handleWhatsApp = () => {
    openWhatsAppShare(buildPlateShareMessage(project, plate))
    closeActions()
  }

  const handleEmail = () => {
    const { subject, body } = buildPlateMailto(project, plate)
    openEmailShare(subject, body)
    closeActions()
  }

  const handleDeleteRequest = () => {
    closeActions()
    setDeleteOpen(true)
  }

  const runAction = (id: ActionId) => {
    switch (id) {
      case 'edit':
        handleEdit()
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
      <ActionsSheetLayout
        open={open}
        onOpenChange={onOpenChange}
        titleIcon={Settings2}
        title="Actions"
        footer={
          <>
            {error ? (
              <p className="px-4 pb-4 text-center text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {busyAction === 'download' ? (
              <p className="px-4 pb-4 text-center text-sm text-muted">Preparing package…</p>
            ) : null}
          </>
        }
      >
        <ul className="mt-4 space-y-2 px-4 pb-4">
          {PLATE_ACTIONS.map((action) => (
            <li key={action.id}>
              <ActionRow
                {...action}
                disabled={busyAction !== null}
                onSelect={() => runAction(action.id)}
              />
            </li>
          ))}
        </ul>
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
