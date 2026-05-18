import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from 'react'
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { FoldedProfile } from '@/geometry/types'

const Plate3DViewer = lazy(() =>
  import('@/components/preview/Plate3DViewer').then((m) => ({
    default: m.Plate3DViewer,
  })),
)

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
          <p className="text-xs text-zinc-500">Try again or use a different browser.</p>
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
          <Plate3DErrorBoundary>
            <Suspense
              fallback={
                <div className="flex h-full min-h-[240px] items-center justify-center bg-zinc-950 text-sm text-zinc-500">
                  Starting 3D…
                </div>
              }
            >
              <Plate3DViewer profile={profile} className="h-full w-full" />
            </Suspense>
          </Plate3DErrorBoundary>
        </div>
        <p className="border-t border-zinc-800 px-4 py-2 text-center text-xs text-zinc-500">
          One finger: orbit · Two fingers: zoom &amp; pan
        </p>
      </DialogContent>
    </Dialog>
  )
}
