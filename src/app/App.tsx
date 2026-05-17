import { useEffect } from 'react'
import { AppShell } from '@/app/AppShell'
import { FabricationScreen } from '@/screens/FabricationScreen'
import { SegmentWizardScreen } from '@/screens/SegmentWizardScreen'
import { SketchScreen } from '@/screens/SketchScreen'
import { StartScreen } from '@/screens/StartScreen'
import { SummaryScreen } from '@/screens/SummaryScreen'
import { useProfileStore } from '@/store/profileStore'

export default function App() {
  const currentStep = useProfileStore((s) => s.currentStep)
  const hydrateFromSession = useProfileStore((s) => s.hydrateFromSession)

  useEffect(() => {
    hydrateFromSession()
  }, [hydrateFromSession])

  const renderScreen = () => {
    switch (currentStep) {
      case 'start':
        return <StartScreen />
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
        return <StartScreen />
    }
  }

  return <AppShell>{renderScreen()}</AppShell>
}
