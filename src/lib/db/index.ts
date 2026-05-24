export {
  fetchProjectsForUser,
  upsertProject,
  upsertProjects,
  deleteProjectFromDb,
} from '@/lib/db/projectsRepository'
export {
  fetchProfile,
  upsertProfile,
  upsertProfileFromSession,
  type ProfileBundle,
} from '@/lib/db/profilesRepository'
export { migrateLocalProjectsIfNeeded } from '@/lib/db/migrateLocalStorage'
export {
  scheduleProjectUpsert,
  syncProjectDelete,
  flushProjectUpserts,
  registerSyncErrorHandler,
} from '@/lib/db/projectSync'
