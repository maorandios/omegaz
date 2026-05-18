import type { AppStep, FoldedProfile, Point2D } from '@/geometry/types'

const STORAGE_KEY = 'FOLDS-session'

export interface PersistedState {
  currentStep: AppStep | null
  profile: FoldedProfile | null
  initialProfile: FoldedProfile | null
  wizardIndex: number
  sketchPoints: Point2D[]
  selectedTemplate: string | null
}

export function loadSession(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const step = parsed.currentStep
    const currentStep =
      step === 'start' || step === undefined || step === null
        ? null
        : (step as PersistedState['currentStep'])
    return {
      currentStep,
      profile: (parsed.profile as PersistedState['profile']) ?? null,
      initialProfile: (parsed.initialProfile as PersistedState['initialProfile']) ?? null,
      wizardIndex: (parsed.wizardIndex as number) ?? 0,
      sketchPoints: (parsed.sketchPoints as PersistedState['sketchPoints']) ?? [],
      selectedTemplate: (parsed.selectedTemplate as string | null) ?? null,
    }
  } catch {
    return null
  }
}

export function saveSession(state: PersistedState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota errors
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
