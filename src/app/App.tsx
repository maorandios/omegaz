import { lazy, Suspense, useEffect } from 'react'
import { AppShell } from '@/app/AppShell'
import { ProjectsScreen } from '@/screens/ProjectsScreen'
import { isWorkflowStep, useAppStore } from '@/store/appStore'
import { useProfileStore } from '@/store/profileStore'

const CreateScreen = lazy(() =>
  import('@/screens/CreateScreen').then((m) => ({ default: m.CreateScreen })),
)
const ProfileScreen = lazy(() =>
  import('@/screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen })),
)
const SketchScreen = lazy(() =>
  import('@/screens/SketchScreen').then((m) => ({ default: m.SketchScreen })),
)
const SegmentWizardScreen = lazy(() =>
  import('@/screens/SegmentWizardScreen').then((m) => ({ default: m.SegmentWizardScreen })),
)
const FabricationScreen = lazy(() =>
  import('@/screens/FabricationScreen').then((m) => ({ default: m.FabricationScreen })),
)
const SummaryScreen = lazy(() =>
  import('@/screens/SummaryScreen').then((m) => ({ default: m.SummaryScreen })),
)

function ScreenFallback() {
  return (
    <div className="flex flex-1 items-center justify-center py-12 text-sm text-muted">
      Loading…
    </div>
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

  const renderWorkflow = () => {
    switch (currentStep) {
      case 'sketch':
        return <SketchScreen />
      case 'segment-wizard':
        return <SegmentWizardScreen />
      case 'fabrication':
        return <FabricationScreen />
      case 'summary':
      case 'export':
        return <SummaryScreen />
      default:
        return null
    }
  }

  const renderMainTab = () => {
    switch (mainTab) {
      case 'projects':
        return <ProjectsScreen />
      case 'create':
        return <CreateScreen />
      case 'profile':
        return <ProfileScreen />
      default:
        return <ProjectsScreen />
    }
  }

  const content = inWorkflow ? renderWorkflow() : renderMainTab()

  return (
    <AppShell inWorkflow={inWorkflow}>
      <Suspense fallback={<ScreenFallback />}>{content}</Suspense>
    </AppShell>
  )
}
