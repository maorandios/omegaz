import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { buildWizardSteps } from '@/geometry/calculateProfilePoints'
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

function getWizardStepLabel(profile: ReturnType<typeof useProfileStore.getState>['profile'], wizardIndex: number) {
  if (!profile) return ''
  const steps = buildWizardSteps(profile)
  const current = steps[wizardIndex]
  if (!current) return ''
  if (current.type === 'segment') {
    const i = profile.segments.findIndex((s) => s.id === current.id) + 1
    return `Step ${wizardIndex + 1}/${steps.length} · Seg ${i}`
  }
  const i = profile.bends.findIndex((b) => b.id === current.id) + 1
  return `Step ${wizardIndex + 1}/${steps.length} · Bend ${i}`
}

export function AppShell({ children }: AppShellProps) {
  const currentStep = useProfileStore((s) => s.currentStep)
  const profile = useProfileStore((s) => s.profile)
  const wizardIndex = useProfileStore((s) => s.wizardIndex)
  const setStep = useProfileStore((s) => s.setStep)
  const goBack = useProfileStore((s) => s.goBack)
  const restart = useProfileStore((s) => s.restart)
  const undo = useProfileStore((s) => s.undo)

  const isWizard = currentStep === 'segment-wizard'
  const showBack = currentStep !== 'start'
  const stepIndex = STEP_ORDER.indexOf(
    currentStep === 'sketch' ? 'segment-wizard' : currentStep,
  )
  const wizardSubtitle = isWizard ? getWizardStepLabel(profile, wizardIndex) : ''

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
    <div className="flex h-dvh flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <header
        className={`shrink-0 border-b border-zinc-800 bg-zinc-950 ${isWizard ? 'py-1.5' : ''}`}
      >
        <div className="mx-auto flex max-w-lg items-center gap-1 px-2">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleBack}
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-9 shrink-0" />
          )}
          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-sm font-bold tracking-tight text-amber-400">OMEGAZ</h1>
            {isWizard ? (
              <p className="truncate text-[11px] text-zinc-400">{wizardSubtitle}</p>
            ) : (
              <p className="text-[10px] text-zinc-500">Fabrication request generator</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-0">
            {isWizard && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2 text-xs text-zinc-400"
                onClick={undo}
              >
                Undo
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-xs text-zinc-500"
              onClick={() => {
                if (currentStep !== 'start' && window.confirm('Start over?')) restart()
              }}
            >
              {currentStep !== 'start' ? 'New' : ''}
            </Button>
          </div>
        </div>
        {currentStep !== 'start' && currentStep !== 'export' && (
          <div className={`mx-auto flex max-w-lg justify-center gap-1 px-3 ${isWizard ? 'pt-1' : 'pb-3 pt-2'}`}>
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
        className={`mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col ${
          isWizard ? 'overflow-hidden' : 'overflow-y-auto px-4 py-4'
        }`}
      >
        {children}
      </main>
    </div>
  )
}
