import { lazy, Suspense, useEffect } from 'react'
import { AppShell } from '@/app/AppShell'
import { ScreenStack } from '@/components/shell/ScreenStack'
import { PullToRefresh } from '@/components/shell/PullToRefresh'
import { DrawShapeScreen } from '@/screens/DrawShapeScreen'
import { FabricationScreen } from '@/screens/FabricationScreen'
import { ProjectsScreen } from '@/screens/ProjectsScreen'
import { SegmentWizardScreen } from '@/screens/SegmentWizardScreen'
import { SketchScreen } from '@/screens/SketchScreen'
import { PlateViewScreen } from '@/screens/PlateViewScreen'
import { SummaryScreen } from '@/screens/SummaryScreen'
import { AuthScreen } from '@/screens/AuthScreen'
import { OnboardingScreen } from '@/screens/OnboardingScreen'
import { BillingReturnScreen } from '@/screens/BillingReturnScreen'
import { rootStackDirection, workflowStackDirection } from '@/lib/stackNavigation'
import { PAYPAL_CANCEL_PATH, PAYPAL_RETURN_PATH } from '@/lib/paypalClient'
import { isWorkflowStep, useAppStore } from '@/store/appStore'
import { isAuthenticatedSession, useAuthStore } from '@/store/authStore'
import { useProfileStore } from '@/store/profileStore'
import { isSubscriptionLocked } from '@/store/userTypes'

function getBillingPathname(): typeof PAYPAL_RETURN_PATH | typeof PAYPAL_CANCEL_PATH | null {
  if (typeof window === 'undefined') return null
  const path = window.location.pathname
  if (path === PAYPAL_RETURN_PATH) return PAYPAL_RETURN_PATH
  if (path === PAYPAL_CANCEL_PATH) return PAYPAL_CANCEL_PATH
  return null
}

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
      className="h-full min-h-0 flex-1"
      screens={{
        sketch: <SketchScreen />,
        draw: <DrawShapeScreen />,
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
  const setMainTab = useAppStore((s) => s.setMainTab)
  const hydrated = useAppStore((s) => s.hydrated)
  const projectsLoading = useAppStore((s) => s.projectsLoading)
  const hydrateApp = useAppStore((s) => s.hydrateApp)
  const subscription = useAppStore((s) => s.subscription)
  const currentStep = useProfileStore((s) => s.currentStep)
  const hydrateFromSession = useProfileStore((s) => s.hydrateFromSession)
  const restartProfile = useProfileStore((s) => s.restart)
  const authReady = useAuthStore((s) => s.ready)
  const session = useAuthStore((s) => s.session)
  const localDevSignedOut = useAuthStore((s) => s.localDevSignedOut)
  const initAuth = useAuthStore((s) => s.initAuth)

  useEffect(() => {
    hydrateFromSession()
    return initAuth()
  }, [hydrateFromSession, initAuth])

  useEffect(() => {
    if (!authReady) return
    void hydrateApp()
  }, [authReady, hydrateApp, session?.user?.id, localDevSignedOut])

  const inWorkflow = isWorkflowStep(currentStep)
  const viewingPlateId = useAppStore((s) => s.viewingPlateId)
  const onboardingComplete = useAppStore((s) => s.onboardingComplete)
  const signedIn = isAuthenticatedSession(session, localDevSignedOut)
  const locked = isSubscriptionLocked(subscription)

  // Trial expired / cancelled grace ended: pop any in-flight workflow + plate
  // view and pin the user on Profile so they can subscribe.
  useEffect(() => {
    if (!hydrated || !signedIn || !onboardingComplete || !locked) return
    if (mainTab !== 'profile') setMainTab('profile')
    if (isWorkflowStep(currentStep)) restartProfile()
    const appState = useAppStore.getState()
    if (appState.viewingPlateId) appState.closePlateView()
    if (appState.selectedProjectId) appState.setSelectedProject(null)
    if (appState.createPlateSheetOpen) appState.closeCreatePlateSheet()
  }, [
    hydrated,
    signedIn,
    onboardingComplete,
    locked,
    mainTab,
    currentStep,
    setMainTab,
    restartProfile,
  ])

  if (!hydrated || !authReady || (signedIn && projectsLoading)) {
    return <ScreenFallback />
  }

  if (!signedIn) {
    return (
      <div className="app-shell text-foreground">
        <div className="app-shell__body mx-auto flex h-full min-h-0 w-full max-w-lg flex-1 flex-col px-4 py-4">
          <AuthScreen />
        </div>
      </div>
    )
  }

  // PayPal return / cancel landing pages take over the whole shell. We render
  // these AFTER the auth gate because the confirm call needs a signed-in
  // session, but BEFORE the onboarding gate so users who subscribe mid-trial
  // aren't pushed back through onboarding.
  const billingPath = getBillingPathname()
  if (billingPath === PAYPAL_RETURN_PATH || billingPath === PAYPAL_CANCEL_PATH) {
    return (
      <div className="app-shell text-foreground">
        <div className="app-shell__body mx-auto flex h-full min-h-0 w-full max-w-lg flex-1 flex-col">
          <BillingReturnScreen cancelled={billingPath === PAYPAL_CANCEL_PATH} />
        </div>
      </div>
    )
  }

  if (!onboardingComplete) {
    return (
      <div className="app-shell text-foreground">
        <div className="app-shell__body mx-auto flex h-full min-h-0 w-full max-w-lg flex-1 flex-col">
          <OnboardingScreen />
        </div>
      </div>
    )
  }

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

  return (
    <AppShell inWorkflow={inWorkflow}>
      <ScreenStack
        activeKey={inWorkflow ? 'workflow' : 'main'}
        getDirection={rootStackDirection}
        className="app-shell-stack min-h-0 flex-1"
        screens={{
          main: viewingPlateId ? (
            <div className="app-shell-tab-pane mx-auto flex h-full min-h-0 w-full max-w-lg flex-1 flex-col px-4 py-4">
              <PlateViewScreen />
            </div>
          ) : (
            <PullToRefresh className="app-shell-tab-pane mx-auto flex h-full min-h-0 w-full max-w-lg flex-1 flex-col">
              <Suspense fallback={<ScreenFallback />}>
                <div className="flex min-h-full flex-1 flex-col px-4 py-4">
                  {renderMainTab()}
                </div>
              </Suspense>
            </PullToRefresh>
          ),
          workflow: (
            <div className="workflow-stack-host min-h-0 flex-1">
              <WorkflowStack />
            </div>
          ),
        }}
      />
    </AppShell>
  )
}
