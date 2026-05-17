import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import type { AppStep } from '@/geometry/types'
import { useVisualViewport } from '@/hooks/useVisualViewport'
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
  const { height: viewportHeight } = useVisualViewport()

  const isWizard = currentStep === 'segment-wizard'
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
    <div
      className="flex flex-col overflow-hidden bg-zinc-950 text-zinc-100"
      style={{ height: viewportHeight }}
    >
      <header
        className={`z-40 shrink-0 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur ${
          isWizard ? 'py-2' : ''
        }`}
      >
        <div className="mx-auto flex max-w-lg items-center gap-2 px-3">
          {showBack ? (
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={handleBack} aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-9 shrink-0" />
          )}
          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-sm font-bold tracking-tight text-amber-400">OMEGAZ</h1>
            {!isWizard && (
              <p className="text-[10px] text-zinc-500">Fabrication request generator</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 shrink-0 px-2 text-xs text-zinc-500"
            onClick={() => {
              if (currentStep !== 'start' && window.confirm('Start over?')) restart()
            }}
          >
            {currentStep !== 'start' ? 'New' : ''}
          </Button>
        </div>
        {currentStep !== 'start' && currentStep !== 'export' && (
          <div className={`mx-auto flex max-w-lg justify-center gap-1 px-3 ${isWizard ? 'pt-1.5' : 'pb-3 pt-2'}`}>
            {['start', 'segment-wizard', 'fabrication', 'summary'].map((step, i) => (
              <div
                key={step}
                className={`h-0.5 flex-1 rounded-full ${i <= stepIndex ? 'bg-amber-500' : 'bg-zinc-800'}`}
                title={STEP_LABELS[step as AppStep]}
              />
            ))}
          </div>
        )}
      </header>

      <main
        className={`mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col overflow-hidden ${
          isWizard ? 'px-0 py-0' : 'overflow-y-auto px-4 py-4'
        }`}
      >
        {children}
      </main>
    </div>
  )
}
