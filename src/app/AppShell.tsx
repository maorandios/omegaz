import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import type { AppStep } from '@/geometry/types'
import { useProfileStore } from '@/store/profileStore'

const STEP_LABELS: Partial<Record<AppStep, string>> = {
  start: 'Start',
  sketch: 'Sketch',
  'segment-wizard': 'Dimensions',
  fabrication: 'Fabrication',
  summary: 'Review',
  export: 'Export',
}

const STEP_ORDER: AppStep[] = [
  'start',
  'sketch',
  'segment-wizard',
  'fabrication',
  'summary',
]

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const currentStep = useProfileStore((s) => s.currentStep)
  const setStep = useProfileStore((s) => s.setStep)
  const goBack = useProfileStore((s) => s.goBack)
  const restart = useProfileStore((s) => s.restart)

  const showBack = currentStep !== 'start'
  const stepIndex = STEP_ORDER.indexOf(
    currentStep === 'sketch' ? 'segment-wizard' : currentStep,
  )

  const handleBack = () => {
    if (currentStep === 'sketch') {
      setStep('start')
      return
    }
    if (currentStep === 'segment-wizard') {
      if (window.confirm('Leave dimension entry?')) setStep('start')
      return
    }
    goBack()
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          {showBack ? (
            <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-11" />
          )}
          <div className="flex-1 text-center">
            <h1 className="text-base font-bold tracking-tight text-amber-400">OMEGAZ</h1>
            <p className="text-xs text-zinc-500">Fabrication request generator</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-zinc-500"
            onClick={() => {
              if (currentStep !== 'start' && window.confirm('Start over?')) restart()
            }}
          >
            {currentStep !== 'start' ? 'New' : ''}
          </Button>
        </div>
        {currentStep !== 'start' && currentStep !== 'export' && (
          <div className="mx-auto flex max-w-lg justify-center gap-1.5 px-4 pb-3">
            {['start', 'segment-wizard', 'fabrication', 'summary'].map((step, i) => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full ${i <= stepIndex ? 'bg-amber-500' : 'bg-zinc-800'}`}
                title={STEP_LABELS[step as AppStep]}
              />
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-4">{children}</main>
    </div>
  )
}
