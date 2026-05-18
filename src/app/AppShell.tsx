import { CircleX, MoveLeft, RotateCcw } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { BottomDock } from '@/components/shell/BottomDock'
import { ExitProcessSheet } from '@/components/shell/ExitProcessSheet'
import { Button } from '@/components/ui/button'
import { getPlateShapeLabel } from '@/templates/definitions'
import { useAppStore } from '@/store/appStore'
import { useProfileStore } from '@/store/profileStore'

interface AppShellProps {
  children: ReactNode
  inWorkflow: boolean
}

const headerIconClass = 'h-[1.4rem] w-[1.4rem] shrink-0 stroke-[1.75px] text-zinc-100'
/** RotateCcw reads larger at 1.4rem — scale down ÷1.25 to match CircleX. */
const headerResetIconClass =
  'h-[1.12rem] w-[1.12rem] shrink-0 stroke-[1.75px] text-zinc-100'

function AppHeader({
  title,
  showReset,
  onReset,
  showBack,
  onBack,
  showExit,
  onExit,
}: {
  title: string
  showReset: boolean
  onReset: () => void
  showBack: boolean
  onBack: () => void
  showExit: boolean
  onExit: () => void
}) {
  const leftHasTwo = showReset && showBack

  return (
    <header
      data-wizard-header
      className="shrink-0 border-b border-zinc-800 bg-zinc-950"
    >
      <div
        className={`mx-auto grid h-12 max-w-lg items-center px-2 ${
          leftHasTwo ? 'grid-cols-[5.5rem_1fr_2.75rem]' : 'grid-cols-[2.75rem_1fr_2.75rem]'
        }`}
      >
        <div className="flex items-center justify-start">
          {showReset && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 hover:bg-zinc-800"
              onClick={onReset}
              aria-label="Reset shape to initial values"
            >
              <RotateCcw className={headerResetIconClass} />
            </Button>
          )}
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 hover:bg-zinc-800"
              onClick={onBack}
              aria-label="Go back"
            >
              <MoveLeft className={headerIconClass} />
            </Button>
          )}
          {!showReset && !showBack && <span aria-hidden className="block w-[2.75rem]" />}
        </div>

        <h1 className="truncate text-center text-base font-bold tracking-tight text-amber-400">
          {title}
        </h1>

        {showExit ? (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 hover:bg-zinc-800"
              onClick={onExit}
              aria-label="Exit process"
            >
              <CircleX className={headerIconClass} />
            </Button>
          </div>
        ) : (
          <span aria-hidden className="block w-[2.75rem]" />
        )}
      </div>
    </header>
  )
}

export function AppShell({ children, inWorkflow }: AppShellProps) {
  const currentStep = useProfileStore((s) => s.currentStep)
  const selectedTemplate = useProfileStore((s) => s.selectedTemplate)
  const restart = useProfileStore((s) => s.restart)
  const resetPlateShape = useProfileStore((s) => s.resetPlateShape)
  const mainTab = useAppStore((s) => s.mainTab)
  const setMainTab = useAppStore((s) => s.setMainTab)

  const [exitSheetOpen, setExitSheetOpen] = useState(false)

  const isWizard = currentStep === 'segment-wizard'
  const isFabrication = currentStep === 'fabrication'
  const isSummary = currentStep === 'summary' || currentStep === 'export'
  const goBack = useProfileStore((s) => s.goBack)
  const headerTitle = isWizard ? getPlateShapeLabel(selectedTemplate) : 'OMEGAZ'

  useEffect(() => {
    if (isWizard) {
      document.documentElement.dataset.wizard = 'true'
    } else {
      delete document.documentElement.dataset.wizard
    }
    return () => {
      delete document.documentElement.dataset.wizard
    }
  }, [isWizard])

  const exitSheet = (
    <ExitProcessSheet
      open={exitSheetOpen}
      onOpenChange={setExitSheetOpen}
      onConfirmExit={() => restart()}
    />
  )

  const header = (
    <AppHeader
      title={headerTitle}
      showReset={isWizard}
      onReset={resetPlateShape}
      showBack={isFabrication || isSummary}
      onBack={goBack}
      showExit={inWorkflow}
      onExit={() => setExitSheetOpen(true)}
    />
  )

  if (isWizard) {
    return (
      <>
        <div className="wizard-shell">
          {header}
          <main className="wizard-shell__main mx-auto w-full max-w-lg">{children}</main>
        </div>
        {exitSheet}
      </>
    )
  }

  if (inWorkflow) {
    return (
      <div className="app-tab-shell text-zinc-100">
        {header}
        <main className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
          {children}
        </main>
        {exitSheet}
      </div>
    )
  }

  return (
    <div className="app-tab-shell text-zinc-100">
      {header}
      <main className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
        {children}
      </main>
      <BottomDock activeTab={mainTab} onTabChange={setMainTab} />
      {exitSheet}
    </div>
  )
}
