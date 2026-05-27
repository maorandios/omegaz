import { migrateProfileBends } from '@/geometry/calculateProfilePoints'
import { cloneFoldedProfile, createId, normalizeFabrication, type FoldedProfile } from '@/geometry/types'
import { plateFavoriteFingerprint } from '@/lib/plateFavoriteFingerprint'

/** Saved plate preset owned by the user (not tied to a project). */
export interface PlateFavoriteRecord {
  id: string
  name: string
  profile: FoldedProfile
  selectedTemplate: string | null
  fingerprint: string
  createdAt: string
  updatedAt: string
  userId?: string
}

export function createPlateFavoriteRecord(
  profile: FoldedProfile,
  selectedTemplate: string | null,
  name?: string,
  id?: string,
): PlateFavoriteRecord {
  const migrated = migrateProfileBends(profile)
  const cloned = cloneFoldedProfile(migrated)
  cloned.fabrication = normalizeFabrication(cloned.fabrication)
  const now = new Date().toISOString()
  const label =
    name?.trim() ||
    cloned.fabrication.partName.trim() ||
    cloned.name.trim() ||
    'Saved plate'

  return {
    id: id ?? createId('fav'),
    name: label,
    profile: cloned,
    selectedTemplate,
    fingerprint: plateFavoriteFingerprint(cloned, selectedTemplate),
    createdAt: now,
    updatedAt: now,
  }
}

export function normalizePlateFavorite(raw: unknown): PlateFavoriteRecord | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const profile = r.profile as FoldedProfile | undefined
  if (!profile?.segments?.length) return null

  const selectedTemplate =
    typeof r.selectedTemplate === 'string' ? r.selectedTemplate : null
  const migrated = migrateProfileBends({
    ...profile,
    fabrication: normalizeFabrication(profile.fabrication),
  })
  const fingerprint =
    typeof r.fingerprint === 'string' && r.fingerprint
      ? r.fingerprint
      : plateFavoriteFingerprint(migrated, selectedTemplate)

  return {
    id: typeof r.id === 'string' ? r.id : createId('fav'),
    name:
      typeof r.name === 'string' && r.name.trim()
        ? r.name.trim()
        : migrated.fabrication.partName.trim() || migrated.name || 'Saved plate',
    profile: migrated,
    selectedTemplate,
    fingerprint,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date().toISOString(),
    userId: typeof r.userId === 'string' ? r.userId : undefined,
  }
}

export function normalizePlateFavorites(raw: unknown): PlateFavoriteRecord[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => normalizePlateFavorite(item))
    .filter((f): f is PlateFavoriteRecord => f !== null)
}
