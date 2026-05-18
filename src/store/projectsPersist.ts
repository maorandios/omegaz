import { createTemplateProfile } from '@/geometry/createTemplateProfile'
import type { FoldedProfile } from '@/geometry/types'

const STORAGE_KEY = 'omegaz-app'

export interface StoredUser {
  firstName: string
  lastName?: string
  email?: string
}

export interface ProjectRecord {
  id: string
  serial: string
  name: string
  weightKg: number
  createdAt: string
  updatedAt: string
  profile: FoldedProfile
  selectedTemplate: string | null
}

interface StoredAppData {
  user: StoredUser
  projects: ProjectRecord[]
}

function seedProjects(): ProjectRecord[] {
  const now = new Date()
  const daysAgo = (n: number) =>
    new Date(now.getTime() - n * 86_400_000).toISOString()

  const zProfile = createTemplateProfile('z-profile')
  zProfile.fabrication.partName = 'Warehouse Purlin Batch'
  zProfile.fabrication.partLength = 6000
  zProfile.fabrication.quantity = 24

  const gutter = createTemplateProfile('gutter')
  gutter.fabrication.partName = 'Gutter Run — North Facade'
  gutter.fabrication.partLength = 3200
  gutter.fabrication.quantity = 8

  return [
    {
      id: 'proj-seed-1',
      serial: 'OMZ-2026-0001',
      name: 'Warehouse Purlin Batch',
      weightKg: 4.82,
      createdAt: daysAgo(12),
      updatedAt: daysAgo(12),
      selectedTemplate: 'z-profile',
      profile: zProfile,
    },
    {
      id: 'proj-seed-2',
      serial: 'OMZ-2026-0002',
      name: 'Gutter Run — North Facade',
      weightKg: 2.15,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(3),
      selectedTemplate: 'gutter',
      profile: gutter,
    },
  ]
}

export function loadAppData(): StoredAppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredAppData
      if (parsed.user?.firstName && Array.isArray(parsed.projects)) {
        return parsed
      }
    }
  } catch {
    // fall through to seed
  }

  return {
    user: { firstName: 'Guest' },
    projects: seedProjects(),
  }
}

export function saveAppData(data: StoredAppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore quota errors
  }
}
