export {
  fetchProjectsForUser,
  upsertProject,
  upsertProjects,
  deleteProjectFromDb,
} from '@/lib/db/projectsRepository'
export {
  fetchPlateFavoritesForUser,
  upsertPlateFavorite,
  deletePlateFavoriteFromDb,
} from '@/lib/db/favoritesRepository'
export {
  fetchProfile,
  upsertProfile,
  upsertProfileFromSession,
  syncAuthUserMetadata,
  completeOnboarding,
  type ProfileBundle,
} from '@/lib/db/profilesRepository'
export { migrateLocalProjectsIfNeeded } from '@/lib/db/migrateLocalStorage'
export {
  scheduleProjectUpsert,
  syncProjectDelete,
  flushProjectUpserts,
  registerSyncErrorHandler,
} from '@/lib/db/projectSync'
