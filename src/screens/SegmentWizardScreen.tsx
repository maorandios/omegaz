import { useEffect } from 'react'
import { ProfileCanvas } from '@/components/canvas/ProfileCanvas'
import { SegmentInputPanel } from '@/components/wizard/SegmentInputPanel'
import { buildWizardSteps } from '@/geometry/calculateProfilePoints'
import { useVisualViewport } from '@/hooks/useVisualViewport'
import { useProfileStore } from '@/store/profileStore'

/** Fixed dock height (px) — single Back | value | Next row */
export const WIZARD_DOCK_PX = 56
/** Wizard header + progress bar (px) */
export const WIZARD_HEADER_PX = 58

export function SegmentWizardScreen() {
  const profile = useProfileStore((s) => s.profile)
  const activeItemId = useProfileStore((s) => s.activeItemId)
  const wizardIndex = useProfileStore((s) => s.wizardIndex)
  const { keyboardInsetBottom, keyboardLikelyOpen } = useVisualViewport()

  useEffect(() => {
    if (!profile) return
    const steps = buildWizardSteps(profile)
    const step = steps[wizardIndex]
    if (step) {
      useProfileStore.setState({ activeItemId: step.id })
    }
  }, [profile, wizardIndex])

  if (!profile) return null

  const dockBottom = keyboardLikelyOpen ? keyboardInsetBottom : undefined

  return (
    <>
      <div
        className={`fixed left-0 right-0 z-10 mx-auto max-w-lg overflow-hidden bg-zinc-950 px-1 ${
          keyboardLikelyOpen ? '' : 'bottom-[calc(3.5rem+env(safe-area-inset-bottom))]'
        }`}
        style={{
          top: WIZARD_HEADER_PX,
          ...(keyboardLikelyOpen ? { bottom: WIZARD_DOCK_PX + (dockBottom ?? 0) } : {}),
        }}
      >
        <ProfileCanvas profile={profile} activeItemId={activeItemId} className="h-full w-full" />
      </div>

      <div
        className={`fixed left-0 right-0 z-50 flex justify-center border-t border-zinc-700 bg-zinc-900 ${
          keyboardLikelyOpen ? '' : 'bottom-[env(safe-area-inset-bottom)]'
        }`}
        style={{
          ...(keyboardLikelyOpen ? { bottom: dockBottom } : {}),
          height: WIZARD_DOCK_PX,
        }}
      >
        <SegmentInputPanel profile={profile} dock />
      </div>
    </>
  )
}
