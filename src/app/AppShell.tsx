import { CircleX, MoveLeft, RotateCcw } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { CreatePlateSheet } from '@/components/create/CreatePlateSheet'
import { BottomDock } from '@/components/shell/BottomDock'
import { PlateActionsDock } from '@/components/shell/PlateActionsDock'
import { ProjectActionsDock } from '@/components/shell/ProjectActionsDock'
import { ExitProcessSheet } from '@/components/shell/ExitProcessSheet'
import { Button } from '@/components/ui/button'
import { getPlateShapeLabel } from '@/templates/definitions'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import { useProfileStore } from '@/store/profileStore'

interface AppShellProps {
  children: ReactNode
  inWorkflow: boolean
}

const APP_LOGO_SRC = '/segments-logo.svg'

const headerIconClass = 'h-[1.4rem] w-[1.4rem] shrink-0 stroke-[1.75px] text-foreground'
/** RotateCcw reads larger at 1.4rem — scale down ÷1.25 to match CircleX. */
const headerResetIconClass =
  'h-[1.12rem] w-[1.12rem] shrink-0 stroke-[1.75px] text-foreground'

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
      className="shrink-0 bg-background"
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
              className="h-10 w-10 shrink-0 hover:bg-surface-raised"
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
              className="h-10 w-10 shrink-0 hover:bg-surface-raised"
              onClick={onBack}
              aria-label="Go back"
            >
              <MoveLeft className={headerIconClass} />
            </Button>
          )}
          {!showReset && !showBack && <span aria-hidden className="block w-[2.75rem]" />}
        </div>

        {title === 'Segments' ? (
          <img
            src={APP_LOGO_SRC}
            alt="Segments"
            className="mx-auto h-[35px] w-auto max-w-[13.75rem] object-contain object-center"
            height={35}
            width={133}
          />
        ) : (
          <h1 className="truncate text-center text-base font-bold tracking-tight text-primary">
            {title}
          </h1>
        )}

        {showExit ? (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 hover:bg-surface-raised"
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
  const createPlateSheetOpen = useAppStore((s) => s.createPlateSheetOpen)
  const syncError = useAppStore((s) => s.syncError)
  const clearSyncError = useAppStore((s) => s.clearSyncError)
  const openCreatePlateSheet = useAppStore((s) => s.openCreatePlateSheet)
  const selectedProjectId = useAppStore((s) => s.selectedProjectId)
  const setSelectedProject = useAppStore((s) => s.setSelectedProject)
  const viewingPlateId = useAppStore((s) => s.viewingPlateId)
  const closePlateView = useAppStore((s) => s.closePlateView)

  const [exitSheetOpen, setExitSheetOpen] = useState(false)

  const isWizard = currentStep === 'segment-wizard'
  const isFabrication = currentStep === 'fabrication'
  const isSummary = currentStep === 'summary' || currentStep === 'export'
  const isPlateView = viewingPlateId != null && !inWorkflow
  const isProjectDetail =
    mainTab === 'projects' &&
    selectedProjectId != null &&
    !inWorkflow &&
    !isWizard &&
    !isPlateView
  const goBack = useProfileStore((s) => s.goBack)
  const headerTitle = isWizard ? getPlateShapeLabel(selectedTemplate) : 'Segments'

  const handleHeaderBack = () => {
    if (isProjectDetail) {
      setSelectedProject(null)
      return
    }
    goBack()
  }

  const handleHeaderExit = () => {
    if (isPlateView) {
      closePlateView()
      return
    }
    setExitSheetOpen(true)
  }

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
      showBack={isFabrication || isSummary || isProjectDetail}
      onBack={handleHeaderBack}
      showExit={inWorkflow || isPlateView}
      onExit={handleHeaderExit}
    />
  )

  return (
    <>
      <div
        className={cn(
          'app-shell text-foreground',
          inWorkflow && 'app-shell--workflow',
        )}
        data-plate-view={isPlateView ? '' : undefined}
      >
        {header}
        {syncError ? (
          <div
            role="alert"
            className="mx-auto flex max-w-lg items-start justify-between gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive"
          >
            <span>{syncError}</span>
            <button
              type="button"
              className="shrink-0 font-semibold underline"
              onClick={clearSyncError}
            >
              Dismiss
            </button>
          </div>
        ) : null}
        <div className="app-shell__body mx-auto w-full max-w-lg">{children}</div>
        {!inWorkflow &&
          (isPlateView ? (
            <PlateActionsDock />
          ) : isProjectDetail ? (
            <ProjectActionsDock />
          ) : (
            <BottomDock
              activeTab={mainTab}
              createSheetOpen={createPlateSheetOpen}
              onTabChange={setMainTab}
              onCreateClick={() => openCreatePlateSheet('choose')}
            />
          ))}
        {!inWorkflow && <CreatePlateSheet />}
      </div>
      {exitSheet}
    </>
  )
}
