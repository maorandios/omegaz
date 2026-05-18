import { create } from 'zustand'
import { buildWizardSteps } from '@/geometry/calculateProfilePoints'
import type { FoldedProfile } from '@/geometry/types'
import { createId } from '@/geometry/types'
import { loadAppData, saveAppData, type StoredSubscription, type StoredUser } from '@/store/projectsPersist'
import { defaultSubscription } from '@/store/userTypes'
import { clearSession } from '@/store/persist'
import {
  computePlateWeightKg,
  computeProjectWeightKg,
  createPlateRecord,
  nextProjectSerial,
  type PlateRecord,
  type ProjectRecord,
} from '@/store/projectTypes'
import { useProfileStore } from '@/store/profileStore'

export type MainTab = 'projects' | 'create' | 'profile'

interface AppState {
  mainTab: MainTab
  user: StoredUser
  subscription: StoredSubscription
  projects: ProjectRecord[]
  activeProjectId: string | null
  editingPlateId: string | null
  selectedProjectId: string | null
  hydrated: boolean

  setMainTab: (tab: MainTab, options?: { keepActiveProject?: boolean }) => void
  setUser: (patch: Partial<StoredUser>) => void
  cancelSubscription: () => void
  logout: () => void
  hydrateApp: () => void
  setActiveProject: (projectId: string | null) => void
  setSelectedProject: (projectId: string | null) => void
  createProject: (name: string) => string | null
  getActiveProject: () => ProjectRecord | null
  getSelectedProject: () => ProjectRecord | null
  savePlateToActiveProject: (
    profile: FoldedProfile,
    selectedTemplate: string | null,
  ) => boolean
  openPlateForEdit: (projectId: string, plateId: string) => void
  deleteProject: (projectId: string) => void
  deletePlate: (projectId: string, plateId: string) => void
}

function persist(state: AppState) {
  saveAppData({
    user: state.user,
    subscription: state.subscription,
    projects: state.projects,
  })
}

function loadProfileIntoWorkflow(profile: FoldedProfile, selectedTemplate: string | null) {
  const steps = buildWizardSteps(profile, selectedTemplate)
  useProfileStore.setState({
    profile,
    initialProfile: JSON.parse(JSON.stringify(profile)) as FoldedProfile,
    selectedTemplate,
    currentStep: 'summary',
    wizardIndex: Math.max(0, steps.length - 1),
    activeItemId: steps[steps.length - 1]?.id ?? null,
    sketchPoints: [],
    clearWizardInput: false,
    history: [],
  })
  useProfileStore.getState().persistToSession()
}

export const useAppStore = create<AppState>((set, get) => ({
  mainTab: 'projects',
  user: { fullName: 'Guest User', email: 'guest@FOLDS.app' },
  subscription: defaultSubscription(),
  projects: [],
  activeProjectId: null,
  editingPlateId: null,
  selectedProjectId: null,
  hydrated: false,

  setMainTab: (tab, options) => {
    if (tab === 'create' && !options?.keepActiveProject) {
      set({ mainTab: tab, activeProjectId: null, editingPlateId: null })
      return
    }
    set({ mainTab: tab })
  },

  setUser: (patch) => {
    const user = { ...get().user, ...patch }
    set({ user })
    persist({ ...get(), user })
  },

  cancelSubscription: () => {
    const subscription = {
      ...get().subscription,
      cancelAtPeriodEnd: true,
    }
    set({ subscription })
    persist({ ...get(), subscription })
  },

  logout: () => {
    clearSession()
    useProfileStore.getState().restart()
    set({
      mainTab: 'projects',
      activeProjectId: null,
      editingPlateId: null,
      selectedProjectId: null,
    })
  },

  hydrateApp: () => {
    const data = loadAppData()
    set({
      user: data.user,
      subscription: data.subscription,
      projects: data.projects,
      activeProjectId: null,
      hydrated: true,
    })
  },

  setActiveProject: (projectId) => {
    set({ activeProjectId: projectId, editingPlateId: null })
  },

  setSelectedProject: (projectId) => set({ selectedProjectId: projectId }),

  createProject: (name) => {
    const trimmed = name.trim()
    if (!trimmed) return null

    const now = new Date().toISOString()
    const { projects } = get()
    const record: ProjectRecord = {
      id: createId('proj'),
      serial: nextProjectSerial(projects),
      name: trimmed,
      plates: [],
      weightKg: 0,
      createdAt: now,
      updatedAt: now,
    }
    const next = [record, ...projects]
    set({ projects: next, activeProjectId: record.id, editingPlateId: null })
    persist({ ...get(), projects: next })
    return record.id
  },

  getActiveProject: () => {
    const { activeProjectId, projects } = get()
    if (!activeProjectId) return null
    return projects.find((p) => p.id === activeProjectId) ?? null
  },

  getSelectedProject: () => {
    const { selectedProjectId, projects } = get()
    if (!selectedProjectId) return null
    return projects.find((p) => p.id === selectedProjectId) ?? null
  },

  savePlateToActiveProject: (profile, selectedTemplate) => {
    const { activeProjectId, editingPlateId, projects } = get()
    if (!activeProjectId) return false

    const now = new Date().toISOString()
    const weightKg = computePlateWeightKg(profile)

    const next = projects.map((project) => {
      if (project.id !== activeProjectId) return project

      let plates: PlateRecord[]
      if (editingPlateId) {
        plates = project.plates.map((plate) =>
          plate.id === editingPlateId
            ? {
                ...plate,
                profile: JSON.parse(JSON.stringify(profile)) as FoldedProfile,
                selectedTemplate,
                weightKg,
                updatedAt: now,
              }
            : plate,
        )
      } else {
        plates = [
          ...project.plates,
          createPlateRecord(profile, selectedTemplate),
        ]
      }

      return {
        ...project,
        plates,
        weightKg: computeProjectWeightKg(plates),
        updatedAt: now,
      }
    })

    set({ projects: next, editingPlateId: null })
    persist({ ...get(), projects: next, editingPlateId: null })
    return true
  },

  openPlateForEdit: (projectId, plateId) => {
    const project = get().projects.find((p) => p.id === projectId)
    const plate = project?.plates.find((pl) => pl.id === plateId)
    if (!project || !plate) return

    set({
      activeProjectId: projectId,
      editingPlateId: plateId,
      selectedProjectId: projectId,
    })

    loadProfileIntoWorkflow(plate.profile, plate.selectedTemplate)
  },

  deleteProject: (projectId) => {
    const { activeProjectId, selectedProjectId } = get()
    const next = get().projects.filter((p) => p.id !== projectId)
    set({
      projects: next,
      activeProjectId: activeProjectId === projectId ? null : activeProjectId,
      selectedProjectId: selectedProjectId === projectId ? null : selectedProjectId,
      editingPlateId: activeProjectId === projectId ? null : get().editingPlateId,
    })
    persist({
      ...get(),
      projects: next,
      activeProjectId: activeProjectId === projectId ? null : activeProjectId,
    })
  },

  deletePlate: (projectId, plateId) => {
    const now = new Date().toISOString()
    const next = get().projects.map((project) => {
      if (project.id !== projectId) return project
      const plates = project.plates.filter((p) => p.id !== plateId)
      return {
        ...project,
        plates,
        weightKg: computeProjectWeightKg(plates),
        updatedAt: now,
      }
    })
    const { editingPlateId, activeProjectId } = get()
    set({
      projects: next,
      editingPlateId:
        activeProjectId === projectId && editingPlateId === plateId
          ? null
          : editingPlateId,
    })
    persist({ ...get(), projects: next })
  },
}))

export function isWorkflowStep(step: string | null): boolean {
  return (
    step === 'sketch' ||
    step === 'segment-wizard' ||
    step === 'fabrication' ||
    step === 'summary' ||
    step === 'export'
  )
}
