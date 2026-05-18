import { Box } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { FoldedProfile } from '@/geometry/types'

/** Loaded only when the user opens 3D preview — keeps Three.js out of the main app bundle. */
const Plate3DPreviewModal = lazy(() =>
  import('@/components/preview/Plate3DPreviewModal').then((m) => ({
    default: m.Plate3DPreviewModal,
  })),
)

function preload3DModal() {
  void import('@/components/preview/Plate3DPreviewModal')
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
        onTouchStart={preload3DModal}
        onClick={() => setOpen(true)}
      >
        <Box className="h-4 w-4" aria-hidden />
        3D Preview
      </Button>
      {open ? (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-8 text-sm text-zinc-400">
                Loading 3D preview…
              </div>
            </div>
          }
        >
          <Plate3DPreviewModal profile={profile} open={open} onOpenChange={setOpen} />
        </Suspense>
      ) : null}
    </>
  )
}
