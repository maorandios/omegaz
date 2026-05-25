import { create } from 'zustand'
import { buildWizardSteps } from '@/geometry/calculateProfilePoints'
import { cloneFoldedProfile, type FoldedProfile } from '@/geometry/types'
import { createId } from '@/geometry/types'
import {
  completeOnboarding as completeOnboardingDb,
  fetchProfile,
  fetchProjectsForUser,
  migrateLocalProjectsIfNeeded,
  registerSyncErrorHandler,
  scheduleProjectUpsert,
  syncProjectDelete,
  upsertProfile,
} from '@/lib/db'
import { userFromAuthUser } from '@/lib/authUser'
import { isLocalAuthBypass, isSupabaseConfigured, supabase } from '@/lib/supabase'
import { loadAppData, saveAppData, type StoredSubscription, type StoredUser } from '@/store/projectsPersist'
import { useAuthStore } from '@/store/authStore'
import { defaultSubscription } from '@/store/userTypes'
import { clearSession } from '@/store/persist'
import {
  computePlateWeightKg,
  computeProjectWeightKg,
  createPlateRecord,
  nextPlateSerial,
  nextProjectSerial,
  type PlateRecord,
  type ProjectRecord,
} from '@/store/projectTypes'
import { useProfileStore } from '@/store/profileStore'

export type MainTab = 'projects' | 'profile'

export type CreatePlateSheetStep = 'choose' | 'new' | 'existing' | 'templates'

interface AppState {
  mainTab: MainTab
  createPlateSheetOpen: boolean
  createPlateSheetStep: CreatePlateSheetStep
  user: StoredUser
  subscription: StoredSubscription
  projects: ProjectRecord[]
  activeProjectId: string | null
  editingPlateId: string | null
  /** Browsing an existing plate (read-only) before optional edit. */
  viewingPlateId: string | null
  selectedProjectId: string | null
  hydrated: boolean
  projectsLoading: boolean
  syncError: string | null
  onboardingComplete: boolean

  setMainTab: (tab: MainTab) => void
  openCreatePlateSheet: (step?: CreatePlateSheetStep) => void
  closeCreatePlateSheet: () => void
  setCreatePlateSheetStep: (step: CreatePlateSheetStep) => void
  setUser: (patch: Partial<StoredUser>) => void
  setProfileBundle: (
    user: StoredUser,
    subscription: StoredSubscription,
    onboardingComplete?: boolean,
  ) => void
  cancelSubscription: () => void
  logout: () => void
  deleteAccount: () => Promise<void>
  hydrateApp: () => Promise<void>
  clearSyncError: () => void
  completeOnboarding: (patch: Partial<StoredUser>) => Promise<void>
  setActiveProject: (projectId: string | null) => void
  setSelectedProject: (projectId: string | null) => void
  createProject: (name: string) => string | null
  getActiveProject: () => ProjectRecord | null
  getSelectedProject: () => ProjectRecord | null
  savePlateToActiveProject: (
    profile: FoldedProfile,
    selectedTemplate: string | null,
  ) => boolean
  openPlateView: (projectId: string, plateId: string) => void
  closePlateView: () => void
  startPlateEdit: () => void
  getViewingPlate: () => { project: ProjectRecord; plate: PlateRecord } | null
  deleteProject: (projectId: string) => void
  deletePlate: (projectId: string, plateId: string) => void
}

function getCloudUserId(): string | null {
  if (!isSupabaseConfigured) return null
  return useAuthStore.getState().session?.user?.id ?? null
}

function persistLocal(state: AppState) {
  saveAppData({
    user: state.user,
    subscription: state.subscription,
    projects: state.projects,
  })
}

function syncProfile(state: AppState) {
  const userId = getCloudUserId()
  if (!userId) {
    persistLocal(state)
    return
  }

  void upsertProfile(userId, state.user, state.subscription).catch((err) => {
    console.error('Failed to sync profile', err)
    useAppStore.setState({
      syncError: err instanceof Error ? err.message : 'Failed to save profile',
    })
  })
}

function syncProject(project: ProjectRecord) {
  const userId = getCloudUserId()
  if (!userId) return
  scheduleProjectUpsert(project, userId)
}

function loadProfileIntoWorkflow(profile: FoldedProfile, selectedTemplate: string | null) {
  const draft = cloneFoldedProfile(profile)
  const steps = buildWizardSteps(draft, selectedTemplate)
  useProfileStore.setState({
    profile: draft,
    initialProfile: cloneFoldedProfile(draft),
    selectedTemplate,
    currentStep: 'segment-wizard',
    wizardIndex: 0,
    activeItemId: steps[0]?.id ?? null,
    sketchPoints: [],
    clearWizardInput: true,
    history: [],
  })
  useProfileStore.getState().persistToSession()
}

export const useAppStore = create<AppState>((set, get) => ({
  mainTab: 'projects',
  createPlateSheetOpen: false,
  createPlateSheetStep: 'choose',
  user: { fullName: 'Guest User', email: 'guest@getsegments.co' },
  subscription: defaultSubscription(),
  projects: [],
  activeProjectId: null,
  editingPlateId: null,
  viewingPlateId: null,
  selectedProjectId: null,
  hydrated: false,
  projectsLoading: false,
  syncError: null,
  onboardingComplete: true,

  setMainTab: (tab) => set({ mainTab: tab }),

  openCreatePlateSheet: (step = 'choose') => {
    const updates: Partial<AppState> = {
      createPlateSheetOpen: true,
      createPlateSheetStep: step,
    }
    if (step === 'choose' || step === 'new') {
      updates.activeProjectId = null
      updates.editingPlateId = null
      updates.viewingPlateId = null
    }
    set(updates)
  },

  closeCreatePlateSheet: () =>
    set({ createPlateSheetOpen: false, createPlateSheetStep: 'choose' }),

  setCreatePlateSheetStep: (step) => set({ createPlateSheetStep: step }),

  setUser: (patch) => {
    const user = { ...get().user, ...patch }
    set({ user })
    syncProfile({ ...get(), user })
  },

  setProfileBundle: (user, subscription, onboardingComplete) => {
    set({
      user,
      subscription,
      ...(onboardingComplete !== undefined ? { onboardingComplete } : {}),
    })
  },

  completeOnboarding: async (patch) => {
    const userId = getCloudUserId()
    if (!userId) {
      const user = { ...get().user, ...patch }
      set({ user, onboardingComplete: true })
      persistLocal({ ...get(), user })
      return
    }

    const user = { ...get().user, ...patch }
    const subscription = get().subscription

    await completeOnboardingDb(userId, user, subscription)
    set({ user, onboardingComplete: true })
  },

  cancelSubscription: () => {
    const subscription = {
      ...get().subscription,
      cancelAtPeriodEnd: true,
    }
    set({ subscription })
    syncProfile({ ...get(), subscription })
  },

  logout: () => {
    void useAuthStore.getState().signOut()
    clearSession()
    useProfileStore.getState().restart()
    set({
      mainTab: 'projects',
      createPlateSheetOpen: false,
      createPlateSheetStep: 'choose',
      activeProjectId: null,
      editingPlateId: null,
      viewingPlateId: null,
      selectedProjectId: null,
      projects: [],
      user: { fullName: 'Guest User', email: 'guest@getsegments.co' },
      subscription: defaultSubscription(),
      syncError: null,
      projectsLoading: false,
      hydrated: true,
      onboardingComplete: true,
    })
    if (!isSupabaseConfigured) {
      persistLocal({
        ...get(),
        projects: [],
        user: { fullName: 'Guest User', email: 'guest@getsegments.co' },
        subscription: defaultSubscription(),
      })
    }
  },

  deleteAccount: async () => {
    if (isSupabaseConfigured) {
      if (!supabase) {
        throw new Error('Account deletion is unavailable right now.')
      }
      const { error } = await supabase.rpc('delete_user_account')
      if (error) {
        throw new Error(error.message || 'Could not delete account. Please try again.')
      }
    }
    get().logout()
  },

  hydrateApp: async () => {
    registerSyncErrorHandler((message) => set({ syncError: message }))

    const session = useAuthStore.getState().session
    const localDevSignedOut = useAuthStore.getState().localDevSignedOut
    const userId = session?.user?.id

    if (isSupabaseConfigured && userId) {
      set({ projectsLoading: true, syncError: null })
      try {
        const [profileBundle, remoteProjects] = await Promise.all([
          fetchProfile(userId),
          fetchProjectsForUser(userId),
        ])

        const projects = await migrateLocalProjectsIfNeeded(userId, remoteProjects)
        const user =
          profileBundle?.user ??
          userFromAuthUser(session.user)
        const subscription = profileBundle?.subscription ?? defaultSubscription()
        const onboardingComplete = profileBundle?.onboardingComplete ?? false

        set({
          user,
          subscription,
          projects,
          activeProjectId: null,
          viewingPlateId: null,
          hydrated: true,
          projectsLoading: false,
          onboardingComplete,
        })
      } catch (err) {
        console.error('Failed to hydrate from Supabase', err)
        set({
          hydrated: true,
          projectsLoading: false,
          syncError:
            err instanceof Error ? err.message : 'Failed to load your projects',
          projects: [],
        })
      }
      return
    }

    if (isLocalAuthBypass && !localDevSignedOut) {
      const data = loadAppData({ skipSeeds: false })
      set({
        user: data.user,
        subscription: data.subscription,
        projects: data.projects,
        activeProjectId: null,
        viewingPlateId: null,
        hydrated: true,
        projectsLoading: false,
        onboardingComplete: true,
      })
      return
    }

    if (!isSupabaseConfigured) {
      const data = loadAppData({ skipSeeds: false })
      set({
        user: data.user,
        subscription: data.subscription,
        projects: data.projects,
        activeProjectId: null,
        viewingPlateId: null,
        hydrated: true,
        projectsLoading: false,
        onboardingComplete: true,
      })
      return
    }

    set({
      projects: [],
      activeProjectId: null,
      viewingPlateId: null,
      hydrated: true,
      projectsLoading: false,
      onboardingComplete: false,
    })
  },

  clearSyncError: () => set({ syncError: null }),

  setActiveProject: (projectId) => {
    set({ activeProjectId: projectId, editingPlateId: null })
  },

  setSelectedProject: (projectId) =>
    set({
      selectedProjectId: projectId,
      viewingPlateId: projectId == null ? null : get().viewingPlateId,
    }),

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
      userId: getCloudUserId() ?? undefined,
    }
    const next = [record, ...projects]
    set({ projects: next, activeProjectId: record.id, editingPlateId: null })

    const userId = getCloudUserId()
    if (userId) syncProject(record)
    else persistLocal({ ...get(), projects: next })

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
    const savedProfile = cloneFoldedProfile(profile)
    const weightKg = computePlateWeightKg(savedProfile)

    let changedProject: ProjectRecord | null = null

    const next = projects.map((project) => {
      if (project.id !== activeProjectId) return project

      let plates: PlateRecord[]
      if (editingPlateId) {
        plates = project.plates.map((plate) =>
          plate.id === editingPlateId
            ? {
                ...plate,
                profile: savedProfile,
                selectedTemplate,
                weightKg,
                updatedAt: now,
              }
            : plate,
        )
      } else {
        plates = [
          ...project.plates,
          createPlateRecord(
            savedProfile,
            selectedTemplate,
            nextPlateSerial(project.plates),
          ),
        ]
      }

      changedProject = {
        ...project,
        plates,
        weightKg: computeProjectWeightKg(plates),
        updatedAt: now,
      }
      return changedProject
    })

    set({ projects: next, editingPlateId: null })

    if (changedProject) {
      const userId = getCloudUserId()
      if (userId) syncProject(changedProject)
      else persistLocal({ ...get(), projects: next, editingPlateId: null })
    }

    return true
  },

  openPlateView: (projectId, plateId) => {
    const project = get().projects.find((p) => p.id === projectId)
    const plate = project?.plates.find((pl) => pl.id === plateId)
    if (!project || !plate) return

    set({
      mainTab: 'projects',
      activeProjectId: projectId,
      selectedProjectId: projectId,
      viewingPlateId: plateId,
      editingPlateId: null,
    })
  },

  closePlateView: () => {
    set({ viewingPlateId: null })
  },

  startPlateEdit: () => {
    const ctx = get().getViewingPlate()
    if (!ctx) return

    set({ viewingPlateId: null, editingPlateId: ctx.plate.id })
    loadProfileIntoWorkflow(ctx.plate.profile, ctx.plate.selectedTemplate)
  },

  getViewingPlate: () => {
    const { viewingPlateId, selectedProjectId, projects } = get()
    if (!viewingPlateId || !selectedProjectId) return null
    const project = projects.find((p) => p.id === selectedProjectId)
    const plate = project?.plates.find((p) => p.id === viewingPlateId)
    if (!project || !plate) return null
    return { project, plate }
  },

  deleteProject: (projectId) => {
    const { activeProjectId, selectedProjectId, viewingPlateId } = get()
    const clearsProject = selectedProjectId === projectId
    const next = get().projects.filter((p) => p.id !== projectId)
    set({
      projects: next,
      activeProjectId: activeProjectId === projectId ? null : activeProjectId,
      selectedProjectId: clearsProject ? null : selectedProjectId,
      editingPlateId: activeProjectId === projectId ? null : get().editingPlateId,
      viewingPlateId: clearsProject ? null : viewingPlateId,
    })

    const userId = getCloudUserId()
    if (userId) void syncProjectDelete(projectId)
    else {
      persistLocal({
        ...get(),
        projects: next,
        activeProjectId: activeProjectId === projectId ? null : activeProjectId,
      })
    }
  },

  deletePlate: (projectId, plateId) => {
    const now = new Date().toISOString()
    let changedProject: ProjectRecord | null = null

    const next = get().projects.map((project) => {
      if (project.id !== projectId) return project
      const plates = project.plates.filter((p) => p.id !== plateId)
      changedProject = {
        ...project,
        plates,
        weightKg: computeProjectWeightKg(plates),
        updatedAt: now,
      }
      return changedProject
    })

    const { editingPlateId, viewingPlateId, activeProjectId } = get()
    const clearsPlate =
      activeProjectId === projectId &&
      (editingPlateId === plateId || viewingPlateId === plateId)
    set({
      projects: next,
      editingPlateId: clearsPlate ? null : editingPlateId,
      viewingPlateId: clearsPlate ? null : viewingPlateId,
    })

    if (changedProject) {
      const userId = getCloudUserId()
      if (userId) syncProject(changedProject)
      else persistLocal({ ...get(), projects: next })
    }
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
