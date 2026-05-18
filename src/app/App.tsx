import { useEffect } from 'react'
import { AppShell } from '@/app/AppShell'
import { CreateScreen } from '@/screens/CreateScreen'
import { FabricationScreen } from '@/screens/FabricationScreen'
import { ProfileScreen } from '@/screens/ProfileScreen'
import { ProjectsScreen } from '@/screens/ProjectsScreen'
import { SegmentWizardScreen } from '@/screens/SegmentWizardScreen'
import { SketchScreen } from '@/screens/SketchScreen'
import { SummaryScreen } from '@/screens/SummaryScreen'
import { isWorkflowStep, useAppStore } from '@/store/appStore'
import { useProfileStore } from '@/store/profileStore'

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

  return <AppShell inWorkflow={inWorkflow}>{inWorkflow ? renderWorkflow() : renderMainTab()}</AppShell>
}
