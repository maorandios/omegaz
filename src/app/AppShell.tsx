import { CircleUserRound, CircleX } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { ExitProcessSheet } from '@/components/shell/ExitProcessSheet'
import { Button } from '@/components/ui/button'
import { useProfileStore } from '@/store/profileStore'

interface AppShellProps {
  children: ReactNode
}

const headerIconClass = 'h-[1.4rem] w-[1.4rem] shrink-0 stroke-[1.75px] text-zinc-100'

function AppHeader({
  inProcess,
  onExit,
}: {
  inProcess: boolean
  onExit: () => void
}) {
  return (
    <header
      data-wizard-header
      className="shrink-0 border-b border-zinc-800 bg-zinc-950"
    >
      <div className="mx-auto grid h-12 max-w-lg grid-cols-[2.75rem_1fr_2.75rem] items-center px-2">
        <div className="flex items-center justify-start">
          {inProcess ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 hover:bg-zinc-800"
              onClick={onExit}
              aria-label="Exit process"
            >
              <CircleX className={headerIconClass} />
            </Button>
          ) : null}
        </div>

        <h1 className="text-center text-base font-bold tracking-tight text-amber-400">OMEGAZ</h1>

        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 hover:bg-zinc-800"
            aria-label="Account"
            onClick={() => {
              /* profile page — coming soon */
            }}
          >
            <CircleUserRound className={headerIconClass} />
          </Button>
        </div>
      </div>
    </header>
  )
}

export function AppShell({ children }: AppShellProps) {
  const currentStep = useProfileStore((s) => s.currentStep)
  const restart = useProfileStore((s) => s.restart)

  const [exitSheetOpen, setExitSheetOpen] = useState(false)

  const isWizard = currentStep === 'segment-wizard'
  const inProcess = currentStep !== 'start'

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

  if (isWizard) {
    return (
      <>
        <div className="wizard-shell">
          <AppHeader inProcess={inProcess} onExit={() => setExitSheetOpen(true)} />
          <main className="wizard-shell__main mx-auto w-full max-w-lg">{children}</main>
        </div>
        {exitSheet}
      </>
    )
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <AppHeader inProcess={inProcess} onExit={() => setExitSheetOpen(true)} />
      <main className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
        {children}
      </main>
      {exitSheet}
    </div>
  )
}
