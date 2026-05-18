import { Box } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plate3DViewer } from '@/components/preview/Plate3DViewer'
import type { FoldedProfile } from '@/geometry/types'

class Plate3DErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('3D preview failed', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 bg-zinc-950 p-4 text-center text-sm text-zinc-400">
          <p>Could not load 3D preview.</p>
          <p className="text-xs text-zinc-500">Try closing and reopening, or refresh the app.</p>
        </div>
      )
    }
    return this.props.children
  }
}

interface Plate3DPreviewModalProps {
  profile: FoldedProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function Plate3DPreviewModal({ profile, open, onOpenChange }: Plate3DPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex w-[min(92vw,24rem)] flex-col p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>3D Preview</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <div className="h-[min(72vw,20rem)] w-full shrink-0">
          {open ? (
            <Plate3DErrorBoundary>
              <Plate3DViewer profile={profile} className="h-full w-full" />
            </Plate3DErrorBoundary>
          ) : null}
        </div>
        <p className="border-t border-zinc-800 px-4 py-2 text-center text-xs text-zinc-500">
          One finger: orbit · Two fingers: zoom &amp; pan
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
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={() => setOpen(true)}
      >
        <Box className="h-4 w-4" aria-hidden />
        3D Preview
      </Button>
      <Plate3DPreviewModal profile={profile} open={open} onOpenChange={setOpen} />
    </>
  )
}
