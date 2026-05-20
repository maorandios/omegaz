import { lazy, Suspense, useEffect } from 'react'
import { AppShell } from '@/app/AppShell'
import { ScreenStack } from '@/components/shell/ScreenStack'
import { FabricationScreen } from '@/screens/FabricationScreen'
import { ProjectsScreen } from '@/screens/ProjectsScreen'
import { SegmentWizardScreen } from '@/screens/SegmentWizardScreen'
import { SketchScreen } from '@/screens/SketchScreen'
import { SummaryScreen } from '@/screens/SummaryScreen'
import { workflowStackDirection } from '@/lib/stackNavigation'
import { isWorkflowStep, useAppStore } from '@/store/appStore'
import { useProfileStore } from '@/store/profileStore'

const ProfileScreen = lazy(() =>
  import('@/screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen })),
)

function ScreenFallback() {
  return (
    <div className="flex flex-1 items-center justify-center py-12 text-sm text-muted">
      Loading…
    </div>
  )
}

function WorkflowStack() {
  const currentStep = useProfileStore((s) => s.currentStep)

  if (!currentStep) return null

  return (
    <ScreenStack
      activeKey={currentStep}
      getDirection={workflowStackDirection}
      className="min-h-0 flex-1"
      screens={{
        sketch: <SketchScreen />,
        'segment-wizard': <SegmentWizardScreen />,
        fabrication: <FabricationScreen />,
        summary: <SummaryScreen />,
        export: <SummaryScreen />,
      }}
    />
  )
}

export default function App() {
  const mainTab = useAppStore((s) => s.mainTab)
  const hydrateApp = useAppStore((s) => s.hydrateApp)
  const currentStep = useProfileStore((s) => s.currentStep)
  const hydrateFromSession = useProfileStore((s) => s.hydrateFromSession)

  useEffect(() => {
    hydrateApp()
    hydrateFromSession()
  }, [hydrateApp, hydrateFromSession])

  const inWorkflow = isWorkflowStep(currentStep)

  const renderMainTab = () => {
    switch (mainTab) {
      case 'projects':
        return <ProjectsScreen />
      case 'profile':
        return <ProfileScreen />
      default:
        return <ProjectsScreen />
    }
  }

  const content = inWorkflow ? <WorkflowStack /> : renderMainTab()

  return (
    <AppShell inWorkflow={inWorkflow}>
      {inWorkflow ? content : <Suspense fallback={<ScreenFallback />}>{content}</Suspense>}
    </AppShell>
  )
}
