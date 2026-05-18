import { useAppStore } from '@/store/appStore'
import { useProfileStore } from '@/store/profileStore'

/** Pull-to-refresh: reload data and check for a newer app version. */
export async function refreshApp(): Promise<void> {
  useAppStore.getState().hydrateApp()
  useProfileStore.getState().hydrateFromSession()

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      await registration?.update()
    } catch {
      // ignore SW errors; still reload
    }
  }

  window.location.reload()
}
