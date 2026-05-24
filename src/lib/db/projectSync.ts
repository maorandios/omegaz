import {
  deleteProjectFromDb,
  upsertProject,
} from '@/lib/db/projectsRepository'
import type { ProjectRecord } from '@/store/projectTypes'

const UPSERT_DELAY_MS = 400
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>()

export function scheduleProjectUpsert(project: ProjectRecord, userId: string): void {
  const existing = pendingTimers.get(project.id)
  if (existing) clearTimeout(existing)

  pendingTimers.set(
    project.id,
    setTimeout(() => {
      pendingTimers.delete(project.id)
      void upsertProject(project, userId).catch((err) => {
        console.error('Failed to sync project', project.id, err)
        reportSyncError(String(err instanceof Error ? err.message : err))
      })
    }, UPSERT_DELAY_MS),
  )
}

export function flushProjectUpserts(): void {
  for (const timer of pendingTimers.values()) clearTimeout(timer)
  pendingTimers.clear()
}

export async function syncProjectDelete(projectId: string): Promise<void> {
  const existing = pendingTimers.get(projectId)
  if (existing) {
    clearTimeout(existing)
    pendingTimers.delete(projectId)
  }

  try {
    await deleteProjectFromDb(projectId)
  } catch (err) {
    console.error('Failed to delete project', projectId, err)
    reportSyncError(String(err instanceof Error ? err.message : err))
  }
}

type SyncErrorHandler = (message: string) => void
let syncErrorHandler: SyncErrorHandler | null = null

export function registerSyncErrorHandler(handler: SyncErrorHandler): void {
  syncErrorHandler = handler
}

function reportSyncError(message: string): void {
  syncErrorHandler?.(message)
}
