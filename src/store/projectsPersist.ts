import { createTemplateProfile } from '@/geometry/createTemplateProfile'
import type { FoldedProfile } from '@/geometry/types'
import { createId } from '@/geometry/types'
import {
  computePlateWeightKg,
  computeProjectWeightKg,
  type PlateRecord,
  type ProjectRecord,
} from '@/store/projectTypes'
import {
  defaultSubscription,
  normalizeSubscription,
  normalizeUser,
  type StoredSubscription,
  type StoredUser,
} from '@/store/userTypes'

export type { StoredSubscription, StoredUser }

const STORAGE_KEY = 'omegaz-app'
const DATA_VERSION = 3

export interface StoredAppData {
  version?: number
  user: StoredUser
  subscription: StoredSubscription
  projects: ProjectRecord[]
}

function plateFromLegacy(
  profile: FoldedProfile,
  selectedTemplate: string | null,
  createdAt: string,
  updatedAt: string,
): PlateRecord {
  return {
    id: createId('plate'),
    profile: JSON.parse(JSON.stringify(profile)) as FoldedProfile,
    selectedTemplate,
    weightKg: computePlateWeightKg(profile),
    createdAt,
    updatedAt,
  }
}

function migrateLegacyProject(raw: Record<string, unknown>): ProjectRecord | null {
  const id = raw.id as string | undefined
  const name = raw.name as string | undefined
  if (!id || !name) return null

  const createdAt = (raw.createdAt as string) ?? new Date().toISOString()
  const updatedAt = (raw.updatedAt as string) ?? createdAt

  if (Array.isArray(raw.plates)) {
    const plates = (raw.plates as PlateRecord[]).filter((p) => p?.profile)
    return {
      id,
      serial: typeof raw.serial === 'string' ? raw.serial : '#000',
      name,
      plates,
      weightKg: computeProjectWeightKg(plates),
      createdAt,
      updatedAt,
    }
  }

  if (raw.profile) {
    const plate = plateFromLegacy(
      raw.profile as FoldedProfile,
      (raw.selectedTemplate as string | null) ?? null,
      createdAt,
      updatedAt,
    )
    return {
      id,
      serial: typeof raw.serial === 'string' ? raw.serial : '#000',
      name,
      plates: [plate],
      weightKg: plate.weightKg,
      createdAt,
      updatedAt,
    }
  }

  return null
}

function renumberProjectSerials(projects: ProjectRecord[]): ProjectRecord[] {
  const sorted = [...projects].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
  return sorted.map((p, i) => ({
    ...p,
    serial: `#${String(i + 1).padStart(3, '0')}`,
  }))
}

function normalizeProjects(raw: unknown): ProjectRecord[] {
  if (!Array.isArray(raw)) return []
  const migrated = raw
    .map((item) => migrateLegacyProject(item as Record<string, unknown>))
    .filter((p): p is ProjectRecord => p !== null)

  const needsRenumber = migrated.some((p) => !/^#\d{3}$/.test(p.serial))
  return needsRenumber ? renumberProjectSerials(migrated) : migrated
}

function seedProjects(): ProjectRecord[] {
  const now = new Date()
  const daysAgo = (n: number) =>
    new Date(now.getTime() - n * 86_400_000).toISOString()

  const zProfile = createTemplateProfile('z-profile')
  zProfile.fabrication.partName = 'Z Purlin — Type A'
  zProfile.fabrication.partLength = 6000
  zProfile.fabrication.quantity = 24

  const channelProfile = createTemplateProfile('channel')
  channelProfile.fabrication.partName = 'Wall Channel'
  channelProfile.fabrication.partLength = 3000
  channelProfile.fabrication.quantity = 12

  const gutterProfile = createTemplateProfile('gutter')
  gutterProfile.fabrication.partName = 'North Facade Gutter'
  gutterProfile.fabrication.partLength = 3200
  gutterProfile.fabrication.quantity = 8

  const batch1Plates = [
    plateFromLegacy(zProfile, 'z-profile', daysAgo(12), daysAgo(12)),
    plateFromLegacy(channelProfile, 'channel', daysAgo(10), daysAgo(10)),
  ]

  const batch2Plates = [
    plateFromLegacy(gutterProfile, 'gutter', daysAgo(5), daysAgo(3)),
  ]

  return [
    {
      id: 'proj-seed-1',
      serial: '#001',
      name: 'Warehouse Purlin Batch',
      plates: batch1Plates,
      weightKg: computeProjectWeightKg(batch1Plates),
      createdAt: daysAgo(12),
      updatedAt: daysAgo(10),
    },
    {
      id: 'proj-seed-2',
      serial: '#002',
      name: 'Facade Gutters',
      plates: batch2Plates,
      weightKg: computeProjectWeightKg(batch2Plates),
      createdAt: daysAgo(5),
      updatedAt: daysAgo(3),
    },
  ]
}

export function loadAppData(): StoredAppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredAppData & { projects?: unknown }
      if (parsed.user) {
        const projects = normalizeProjects(parsed.projects)
        return {
          version: DATA_VERSION,
          user: normalizeUser(parsed.user),
          subscription: normalizeSubscription(parsed.subscription),
          projects: projects.length > 0 ? projects : seedProjects(),
        }
      }
    }
  } catch {
    // fall through to seed
  }

  return {
    version: DATA_VERSION,
    user: normalizeUser({
      fullName: 'Guest User',
      email: 'guest@omegaz.app',
    }),
    subscription: defaultSubscription(),
    projects: seedProjects(),
  }
}

export function saveAppData(data: StoredAppData): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...data, version: DATA_VERSION }),
    )
  } catch {
    // ignore quota errors
  }
}
