import { upsertProjects } from '@/lib/db/projectsRepository'
import {
  hasOnlySeedProjects,
  isSeedProject,
  loadLegacyLocalAppData,
  markLocalStorageMigrated,
} from '@/store/projectsPersist'
import type { ProjectRecord } from '@/store/projectTypes'

/**
 * One-time upload of local projects when the user has nothing in Supabase yet.
 * Prefers cloud data when both exist; skips demo seed projects.
 */
export async function migrateLocalProjectsIfNeeded(
  userId: string,
  remoteProjects: ProjectRecord[],
): Promise<ProjectRecord[]> {
  if (remoteProjects.length > 0) {
    markLocalStorageMigrated()
    return remoteProjects
  }

  const local = loadLegacyLocalAppData()
  if (!local?.projects.length) return remoteProjects

  const toUpload = local.projects.filter((p) => !isSeedProject(p))
  if (toUpload.length === 0) {
    if (hasOnlySeedProjects(local.projects)) markLocalStorageMigrated()
    return remoteProjects
  }

  await upsertProjects(toUpload, userId)
  markLocalStorageMigrated()
  return toUpload
}
