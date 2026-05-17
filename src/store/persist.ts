import type { AppStep, FoldedProfile, Point2D } from '@/geometry/types'

const STORAGE_KEY = 'omegaz-session'

export interface PersistedState {
  currentStep: AppStep
  profile: FoldedProfile | null
  wizardIndex: number
  sketchPoints: Point2D[]
  selectedTemplate: string | null
}

export function loadSession(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedState
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
