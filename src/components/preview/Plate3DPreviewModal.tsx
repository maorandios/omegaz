import { Box } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { FoldedProfile } from '@/geometry/types'

const Plate3DViewer = lazy(() =>
  import('@/components/preview/Plate3DViewer').then((m) => ({ default: m.Plate3DViewer })),
)

interface Plate3DPreviewModalProps {
  profile: FoldedProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function Plate3DPreviewModal({ profile, open, onOpenChange }: Plate3DPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex aspect-square w-[min(92vw,24rem)] max-h-[min(92vh,24rem)] flex-col p-0">
        <DialogHeader>
          <DialogTitle>3D Preview</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <div className="relative min-h-0 flex-1">
          {open && (
            <Suspense
              fallback={
                <div className="flex aspect-square items-center justify-center text-sm text-zinc-500">
                  Loading 3D…
                </div>
              }
            >
              <Plate3DViewer profile={profile} className="aspect-square w-full" />
            </Suspense>
          )}
        </div>
        <p className="border-t border-zinc-800 px-4 py-2 text-center text-xs text-zinc-500">
          Drag to orbit · Pinch or scroll to zoom
        </p>
      </DialogContent>
    </Dialog>
  )
}

interface Plate3DPreviewButtonProps {
  profile: FoldedProfile
}

export function Plate3DPreviewButton({ profile }: Plate3DPreviewButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="button" variant="outline" className="w-full gap-2" onClick={() => setOpen(true)}>
        <Box className="h-4 w-4" aria-hidden />
        3D Preview
      </Button>
      <Plate3DPreviewModal profile={profile} open={open} onOpenChange={setOpen} />
    </>
  )
}
