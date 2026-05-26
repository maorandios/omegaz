import { create } from 'zustand'
import { cleanFreehandSketch } from '@/geometry/cleanFreehandSketch'
import {
  buildWizardSteps,
  ensureHorizontalLock,
  migrateProfileBends,
  updateProfileGeometry,
} from '@/geometry/calculateProfilePoints'
import { createProfileFromSketch, createTemplateProfile } from '@/geometry/createTemplateProfile'
import {
  appendCustomSegment,
  removeCustomSegment,
} from '@/geometry/customProfile'
import {
  applySquarePlateProfile,
  isSquarePlateProfile,
  squareHeightFromProfile,
  squareWidthFromProfile,
} from '@/geometry/squareProfile'
import type { AppStep, FabricationDetails, FoldedProfile, Point2D } from '@/geometry/types'
import { useAppStore } from '@/store/appStore'
import { clearSession, loadSession, saveSession } from './persist'

interface ProfileState {
  currentStep: AppStep | null
  profile: FoldedProfile | null
  /** Snapshot when plate process started (template / sketch / opened project). */
  initialProfile: FoldedProfile | null
  selectedTemplate: string | null
  sketchPoints: Point2D[]
  wizardIndex: number
  activeItemId: string | null
  /**
   * When true, the wizard input mounts empty. We default to false so each step
   * is prefilled with the current geometry value — the user can click Next
   * without retyping if the default is acceptable.
   */
  clearWizardInput: boolean
  history: FoldedProfile[]

  setStep: (step: AppStep) => void
  loadTemplate: (templateId: string) => void
  resetPlateShape: () => void
  setSketchPoints: (points: Point2D[]) => void
  applyCleanedSketch: () => boolean
  setSegmentLength: (segmentId: string, length: number) => void
  setBendAngle: (bendId: string, angle: number) => void
  previewSegmentLength: (segmentId: string, length: number) => void
  previewBendAngle: (bendId: string, angle: number) => void
  setFabricationField: <K extends keyof FabricationDetails>(
    key: K,
    value: FabricationDetails[K],
  ) => void
  pushHistory: () => void
  undo: () => void
  restart: () => void
  goBack: () => void
  goNext: () => void
  setWizardIndex: (index: number) => void
  selectWizardItem: (type: 'segment' | 'bend', id: string) => void
  setActiveFromTableRow: (type: 'segment' | 'bend', id: string) => void
  addCustomSegment: () => void
  removeCustomSegment: () => void
  consumeClearWizardInput: () => boolean
  hydrateFromSession: () => void
  persistToSession: () => void
}

function snapshotProfile(profile: FoldedProfile | null): FoldedProfile | null {
  if (!profile) return null
  return JSON.parse(JSON.stringify(profile)) as FoldedProfile
}

let persistTimer: ReturnType<typeof setTimeout> | null = null

function schedulePersist(get: () => ProfileState) {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    const s = get()
    saveSession({
      currentStep: s.currentStep,
      profile: s.profile,
      initialProfile: s.initialProfile,
      wizardIndex: s.wizardIndex,
      sketchPoints: s.sketchPoints,
      selectedTemplate: s.selectedTemplate,
    })
  }, 300)
}

function syncWizardActive(state: ProfileState, profile: FoldedProfile): string | null {
  const steps = buildWizardSteps(profile, state.selectedTemplate)
  const step = steps[state.wizardIndex]
  return step?.id ?? null
}

function finalizeProfile(profile: FoldedProfile, templateId: string | null): FoldedProfile {
  if (isSquarePlateProfile(profile, templateId)) {
    return applySquarePlateProfile(
      profile,
      squareWidthFromProfile(profile),
      squareHeightFromProfile(profile),
    )
  }
  return updateProfileGeometry(profile)
}

function withSegmentLength(
  profile: FoldedProfile,
  segmentId: string,
  length: number,
  templateId: string | null,
): FoldedProfile {
  const value = Math.max(0, length)
  if (isSquarePlateProfile(profile, templateId)) {
    const w =
      profile.segments[0]?.id === segmentId ? value : squareWidthFromProfile(profile)
    const h =
      profile.segments[1]?.id === segmentId ? value : squareHeightFromProfile(profile)
    return applySquarePlateProfile(profile, w, h)
  }
  return finalizeProfile(
    {
      ...profile,
      segments: profile.segments.map((s) =>
        s.id === segmentId ? { ...s, length: value } : s,
      ),
    },
    templateId,
  )
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  currentStep: null,
  profile: null,
  initialProfile: null,
  selectedTemplate: null,
  sketchPoints: [],
  wizardIndex: 0,
  activeItemId: null,
  clearWizardInput: false,
  history: [],

  setStep: (step) => {
    if (step === 'sketch') {
      useAppStore.setState({ editingPlateId: null })
    }
    set({ currentStep: step })
    schedulePersist(get)
  },

  loadTemplate: (templateId) => {
    useAppStore.setState({ editingPlateId: null })
    const profile = createTemplateProfile(templateId)
    const initialProfile = snapshotProfile(profile)
    set({
      profile,
      initialProfile,
      selectedTemplate: templateId,
      wizardIndex: 0,
      activeItemId: syncWizardActive(get(), profile),
      currentStep: 'segment-wizard',
      clearWizardInput: false,
      history: [],
    })
    schedulePersist(get)
  },

  resetPlateShape: () => {
    const { currentStep, initialProfile, selectedTemplate, profile } = get()

    if (currentStep === 'sketch') {
      set({ sketchPoints: [] })
      schedulePersist(get)
      return
    }

    let nextProfile: FoldedProfile | null = null
    if (initialProfile) {
      nextProfile = snapshotProfile(initialProfile)
    } else if (selectedTemplate) {
      nextProfile = createTemplateProfile(selectedTemplate)
    } else if (profile) {
      nextProfile = snapshotProfile(profile)
    }
    if (!nextProfile) return

    set({
      profile: nextProfile,
      wizardIndex: 0,
      activeItemId: syncWizardActive(get(), nextProfile),
      clearWizardInput: false,
      history: [],
    })
    schedulePersist(get)
  },

  setSketchPoints: (points) => {
    set({ sketchPoints: points })
    schedulePersist(get)
  },

  applyCleanedSketch: () => {
    const { sketchPoints } = get()
    const cleaned = cleanFreehandSketch(sketchPoints)
    if (cleaned.segments.length < 1) return false

    const profile = createProfileFromSketch(cleaned.segments, cleaned.bends)
    const initialProfile = snapshotProfile(profile)
    set({
      profile,
      initialProfile,
      selectedTemplate: null,
      wizardIndex: 0,
      activeItemId: syncWizardActive(get(), profile),
      currentStep: 'segment-wizard',
      clearWizardInput: false,
      history: [],
    })
    schedulePersist(get)
    return true
  },

  setSegmentLength: (segmentId, length) => {
    const { profile, selectedTemplate } = get()
    if (!profile) return
    get().pushHistory()
    const next = withSegmentLength(profile, segmentId, length, selectedTemplate)
    set({ profile: next })
    schedulePersist(get)
  },

  setBendAngle: (bendId, interiorDeg) => {
    const { profile } = get()
    if (!profile) return
    get().pushHistory()
    const next = updateProfileGeometry({
      ...profile,
      bends: profile.bends.map((b) =>
        b.id === bendId ? { ...b, interiorAngle: interiorDeg } : b,
      ),
    })
    set({ profile: next })
    schedulePersist(get)
  },

  previewSegmentLength: (segmentId, length) => {
    const { profile, selectedTemplate } = get()
    if (!profile) return
    const next = withSegmentLength(profile, segmentId, length, selectedTemplate)
    set({ profile: next })
  },

  previewBendAngle: (bendId, interiorDeg) => {
    const { profile } = get()
    if (!profile) return
    const next = updateProfileGeometry({
      ...profile,
      bends: profile.bends.map((b) =>
        b.id === bendId ? { ...b, interiorAngle: interiorDeg } : b,
      ),
    })
    set({ profile: next })
  },

  setFabricationField: (key, value) => {
    const { profile } = get()
    if (!profile) return
    const next = {
      ...profile,
      fabrication: { ...profile.fabrication, [key]: value },
    }
    set({ profile: next })
    schedulePersist(get)
  },

  pushHistory: () => {
    const { profile, history } = get()
    if (!profile) return
    const snap = snapshotProfile(profile)
    if (!snap) return
    set({ history: [...history.slice(-19), snap] })
  },

  undo: () => {
    const { history } = get()
    if (history.length === 0) return
    const prev = history[history.length - 1]
    set({
      profile: prev,
      history: history.slice(0, -1),
      activeItemId: prev ? syncWizardActive(get(), prev) : null,
    })
    schedulePersist(get)
  },

  restart: () => {
    clearSession()
    useAppStore.setState({ editingPlateId: null })
    useAppStore.getState().setMainTab('projects')
    set({
      currentStep: null,
      profile: null,
      initialProfile: null,
      selectedTemplate: null,
      sketchPoints: [],
      wizardIndex: 0,
      activeItemId: null,
      clearWizardInput: false,
      history: [],
    })
  },

  goBack: () => {
    const { wizardIndex, currentStep, profile } = get()
    if (currentStep === 'segment-wizard' && wizardIndex > 0) {
      const newIndex = wizardIndex - 1
      set({
        wizardIndex: newIndex,
        activeItemId: profile ? syncWizardActive({ ...get(), wizardIndex: newIndex }, profile) : null,
        clearWizardInput: false,
      })
      schedulePersist(get)
      return
    }
    if (currentStep === 'fabrication') {
      set({ currentStep: 'segment-wizard' })
      schedulePersist(get)
      return
    }
    if (currentStep === 'summary') {
      set({ currentStep: 'fabrication' })
      schedulePersist(get)
    }
  },

  goNext: () => {
    const { profile, wizardIndex, currentStep } = get()
    if (!profile) return

    if (currentStep === 'segment-wizard') {
      const steps = buildWizardSteps(profile, get().selectedTemplate)
      if (wizardIndex < steps.length - 1) {
        const newIndex = wizardIndex + 1
        set({
          wizardIndex: newIndex,
          activeItemId: syncWizardActive({ ...get(), wizardIndex: newIndex }, profile),
          clearWizardInput: false,
        })
        schedulePersist(get)
      } else {
        set({ currentStep: 'fabrication' })
        schedulePersist(get)
      }
    }
  },

  setWizardIndex: (index) => {
    const { profile } = get()
    if (!profile) return
    set({
      wizardIndex: index,
      activeItemId: syncWizardActive({ ...get(), wizardIndex: index }, profile),
      clearWizardInput: false,
    })
    schedulePersist(get)
  },

  selectWizardItem: (type, id) => {
    const { profile } = get()
    if (!profile) return
    const steps = buildWizardSteps(profile, get().selectedTemplate)
    const index = steps.findIndex((s) => s.type === type && s.id === id)
    if (index < 0) return
    set({
      wizardIndex: index,
      activeItemId: id,
      clearWizardInput: false,
    })
    schedulePersist(get)
  },

  consumeClearWizardInput: () => {
    const { clearWizardInput } = get()
    if (clearWizardInput) {
      set({ clearWizardInput: false })
    }
    return clearWizardInput
  },

  setActiveFromTableRow: (_type: 'segment' | 'bend', id: string) => {
    set({ activeItemId: id })
  },

  addCustomSegment: () => {
    const { profile, selectedTemplate } = get()
    if (!profile || selectedTemplate !== 'custom') return
    const next = appendCustomSegment(profile)
    if (!next) return
    get().pushHistory()
    const steps = buildWizardSteps(next, 'custom')
    const newIndex = steps.length - 1
    set({
      profile: next,
      wizardIndex: newIndex,
      activeItemId: steps[newIndex]?.id ?? null,
      clearWizardInput: false,
    })
    schedulePersist(get)
  },

  removeCustomSegment: () => {
    const { profile, selectedTemplate, wizardIndex } = get()
    if (!profile || selectedTemplate !== 'custom') return
    const next = removeCustomSegment(profile)
    if (!next) return
    get().pushHistory()
    const steps = buildWizardSteps(next, 'custom')
    const newIndex = Math.min(wizardIndex, Math.max(0, steps.length - 1))
    set({
      profile: next,
      wizardIndex: newIndex,
      activeItemId: steps[newIndex]?.id ?? null,
      clearWizardInput: false,
    })
    schedulePersist(get)
  },

  hydrateFromSession: () => {
    try {
      const saved = loadSession()
      if (!saved?.profile || !saved.currentStep) return
      const profile = ensureHorizontalLock(
        migrateProfileBends(saved.profile),
        saved.selectedTemplate,
      )
      const initialProfile = saved.initialProfile
        ? ensureHorizontalLock(
            migrateProfileBends(saved.initialProfile),
            saved.selectedTemplate,
          )
        : profile
      set({
        currentStep: saved.currentStep,
        profile,
        initialProfile,
        wizardIndex: saved.wizardIndex,
        sketchPoints: saved.sketchPoints,
        selectedTemplate: saved.selectedTemplate,
        activeItemId: syncWizardActive(
          { ...get(), wizardIndex: saved.wizardIndex },
          profile,
        ),
      })
    } catch (e) {
      console.warn('Corrupt session cleared', e)
      clearSession()
    }
  },

  persistToSession: () => {
    const s = get()
    saveSession({
      currentStep: s.currentStep,
      profile: s.profile,
      initialProfile: s.initialProfile,
      wizardIndex: s.wizardIndex,
      sketchPoints: s.sketchPoints,
      selectedTemplate: s.selectedTemplate,
    })
  },
}))
