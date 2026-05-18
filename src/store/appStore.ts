import { create } from 'zustand'
import { calculateAreaEstimate } from '@/geometry/calculateAreaEstimate'
import { calculateGeometricFlatWidth } from '@/geometry/calculateGeometricFlatWidth'
import { calculateWeightEstimate } from '@/geometry/calculateWeightEstimate'
import type { FoldedProfile } from '@/geometry/types'
import { createId } from '@/geometry/types'
import {
  loadAppData,
  saveAppData,
  type ProjectRecord,
  type StoredUser,
} from '@/store/projectsPersist'

export type MainTab = 'projects' | 'create' | 'profile'

function computeWeightKg(profile: FoldedProfile): number {
  const flatWidth = calculateGeometricFlatWidth(profile.segments)
  const area = calculateAreaEstimate(flatWidth, profile.fabrication.partLength)
  return calculateWeightEstimate(
    area,
    profile.fabrication.thickness,
    profile.fabrication.material,
  )
}

function nextSerial(existing: ProjectRecord[]): string {
  const year = new Date().getFullYear()
  const prefix = `OMZ-${year}-`
  const max = existing.reduce((n, p) => {
    const m = p.serial.match(new RegExp(`^${prefix}(\\d+)$`))
    return m ? Math.max(n, parseInt(m[1], 10)) : n
  }, 0)
  return `${prefix}${String(max + 1).padStart(4, '0')}`
}

interface AppState {
  mainTab: MainTab
  user: StoredUser
  projects: ProjectRecord[]
  hydrated: boolean

  setMainTab: (tab: MainTab) => void
  setUser: (patch: Partial<StoredUser>) => void
  hydrateApp: () => void
  saveProjectFromProfile: (
    profile: FoldedProfile,
    selectedTemplate: string | null,
    projectId?: string,
  ) => void
  openProject: (projectId: string) => ProjectRecord | null
  deleteProject: (projectId: string) => void
}

function persist(state: AppState) {
  saveAppData({ user: state.user, projects: state.projects })
}

export const useAppStore = create<AppState>((set, get) => ({
  mainTab: 'projects',
  user: { firstName: 'Guest' },
  projects: [],
  hydrated: false,

  setMainTab: (tab) => set({ mainTab: tab }),

  setUser: (patch) => {
    const user = { ...get().user, ...patch }
    set({ user })
    persist({ ...get(), user })
  },

  hydrateApp: () => {
    const data = loadAppData()
    set({
      user: data.user,
      projects: data.projects,
      hydrated: true,
    })
  },

  saveProjectFromProfile: (profile, selectedTemplate, projectId) => {
    const name = profile.fabrication.partName.trim() || profile.name
    const weightKg = computeWeightKg(profile)
    const now = new Date().toISOString()
    const { projects } = get()

    if (projectId) {
      const next = projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              name,
              weightKg,
              updatedAt: now,
              profile,
              selectedTemplate,
            }
          : p,
      )
      set({ projects: next })
      persist({ ...get(), projects: next })
      return
    }

    const existing = projects.find(
      (p) => p.profile.id === profile.id || p.name === name,
    )
    if (existing) {
      get().saveProjectFromProfile(profile, selectedTemplate, existing.id)
      return
    }

    const record: ProjectRecord = {
      id: createId('proj'),
      serial: nextSerial(projects),
      name,
      weightKg,
      createdAt: now,
      updatedAt: now,
      profile,
      selectedTemplate,
    }
    const next = [record, ...projects]
    set({ projects: next })
    persist({ ...get(), projects: next })
  },

  openProject: (projectId) => {
    return get().projects.find((p) => p.id === projectId) ?? null
  },

  deleteProject: (projectId) => {
    const next = get().projects.filter((p) => p.id !== projectId)
    set({ projects: next })
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
