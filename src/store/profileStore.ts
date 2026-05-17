import { create } from 'zustand'
import { cleanFreehandSketch } from '@/geometry/cleanFreehandSketch'
import {
  buildWizardSteps,
  updateProfileGeometry,
} from '@/geometry/calculateProfilePoints'
import { createProfileFromSketch, createTemplateProfile } from '@/geometry/createTemplateProfile'
import type { AppStep, FabricationDetails, FoldedProfile, Point2D } from '@/geometry/types'
import { clearSession, loadSession, saveSession } from './persist'

interface ProfileState {
  currentStep: AppStep
  profile: FoldedProfile | null
  selectedTemplate: string | null
  sketchPoints: Point2D[]
  wizardIndex: number
  activeItemId: string | null
  /** When true, wizard input mounts empty (after Next or first entry). */
  clearWizardInput: boolean
  history: FoldedProfile[]

  setStep: (step: AppStep) => void
  loadTemplate: (templateId: string) => void
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
      wizardIndex: s.wizardIndex,
      sketchPoints: s.sketchPoints,
      selectedTemplate: s.selectedTemplate,
    })
  }, 300)
}

function syncWizardActive(get: ProfileState, profile: FoldedProfile): string | null {
  const steps = buildWizardSteps(profile)
  const step = steps[get.wizardIndex]
  return step?.id ?? null
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  currentStep: 'start',
  profile: null,
  selectedTemplate: null,
  sketchPoints: [],
  wizardIndex: 0,
  activeItemId: null,
  clearWizardInput: true,
  history: [],

  setStep: (step) => {
    set({ currentStep: step })
    schedulePersist(get)
  },

  loadTemplate: (templateId) => {
    const profile = createTemplateProfile(templateId)
    set({
      profile,
      selectedTemplate: templateId,
      wizardIndex: 0,
      activeItemId: syncWizardActive(get(), profile),
      currentStep: 'segment-wizard',
      clearWizardInput: true,
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
    set({
      profile,
      selectedTemplate: null,
      wizardIndex: 0,
      activeItemId: syncWizardActive(get(), profile),
      currentStep: 'segment-wizard',
      clearWizardInput: true,
      history: [],
    })
    schedulePersist(get)
    return true
  },

  setSegmentLength: (segmentId, length) => {
    const { profile } = get()
    if (!profile) return
    get().pushHistory()
    const next = updateProfileGeometry({
      ...profile,
      segments: profile.segments.map((s) =>
        s.id === segmentId ? { ...s, length: Math.max(0, length) } : s,
      ),
    })
    set({ profile: next })
    schedulePersist(get)
  },

  setBendAngle: (bendId, angle) => {
    const { profile } = get()
    if (!profile) return
    get().pushHistory()
    const next = updateProfileGeometry({
      ...profile,
      bends: profile.bends.map((b) =>
        b.id === bendId ? { ...b, angle: Math.max(0, angle) } : b,
      ),
    })
    set({ profile: next })
    schedulePersist(get)
  },

  previewSegmentLength: (segmentId, length) => {
    const { profile } = get()
    if (!profile) return
    const next = updateProfileGeometry({
      ...profile,
      segments: profile.segments.map((s) =>
        s.id === segmentId ? { ...s, length: Math.max(0, length) } : s,
      ),
    })
    set({ profile: next })
  },

  previewBendAngle: (bendId, angle) => {
    const { profile } = get()
    if (!profile) return
    const next = updateProfileGeometry({
      ...profile,
      bends: profile.bends.map((b) =>
        b.id === bendId ? { ...b, angle: Math.max(0, angle) } : b,
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
    set({
      currentStep: 'start',
      profile: null,
      selectedTemplate: null,
      sketchPoints: [],
      wizardIndex: 0,
      activeItemId: null,
      clearWizardInput: true,
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
      const steps = buildWizardSteps(profile)
      if (wizardIndex < steps.length - 1) {
        const newIndex = wizardIndex + 1
        set({
          wizardIndex: newIndex,
          activeItemId: syncWizardActive({ ...get(), wizardIndex: newIndex }, profile),
          clearWizardInput: true,
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
    const steps = buildWizardSteps(profile)
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

  hydrateFromSession: () => {
    const saved = loadSession()
    if (!saved?.profile) return
    set({
      currentStep: saved.currentStep,
      profile: saved.profile,
      wizardIndex: saved.wizardIndex,
      sketchPoints: saved.sketchPoints,
      selectedTemplate: saved.selectedTemplate,
      activeItemId: syncWizardActive(
        { ...get(), wizardIndex: saved.wizardIndex },
        saved.profile,
      ),
    })
  },

  persistToSession: () => {
    const s = get()
    saveSession({
      currentStep: s.currentStep,
      profile: s.profile,
      wizardIndex: s.wizardIndex,
      sketchPoints: s.sketchPoints,
      selectedTemplate: s.selectedTemplate,
    })
  },
}))
