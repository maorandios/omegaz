import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

/** Local `npm run dev` without Supabase env — skip sign-in until auth is wired up. */
export const isLocalAuthBypass = !isSupabaseConfigured && import.meta.env.DEV

/**
 * Resilient auth-token storage. iOS Safari in some modes (Private browsing,
 * full quota, locked-down PWAs) will throw on `localStorage.setItem` and the
 * default Supabase storage shim silently degrades to "no persistence", which
 * looks to the user like "the app keeps logging me out".
 *
 * We wrap localStorage so:
 *   1) reads/writes that throw fall through to an in-memory mirror,
 *   2) the mirror keeps the session alive for the lifetime of the tab even
 *      if persistent storage is unavailable, and
 *   3) we never break the app by throwing during sign-in.
 */
function createAuthStorage(): {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
} {
  const memory = new Map<string, string>()
  const hasLocalStorage = (() => {
    if (typeof window === 'undefined') return false
    try {
      const probe = '__segments-storage-probe__'
      window.localStorage.setItem(probe, probe)
      window.localStorage.removeItem(probe)
      return true
    } catch {
      return false
    }
  })()

  return {
    getItem(key) {
      if (hasLocalStorage) {
        try {
          const v = window.localStorage.getItem(key)
          if (v !== null) return v
        } catch {
          // fall through to memory
        }
      }
      return memory.get(key) ?? null
    },
    setItem(key, value) {
      memory.set(key, value)
      if (!hasLocalStorage) return
      try {
        window.localStorage.setItem(key, value)
      } catch {
        // memory fallback already holds the value — caller still gets a working session
      }
    },
    removeItem(key) {
      memory.delete(key)
      if (!hasLocalStorage) return
      try {
        window.localStorage.removeItem(key)
      } catch {
        // ignore
      }
    },
  }
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        // Keep the default storageKey (`sb-<projectref>-auth-token`) so
        // sessions persisted before this storage wrapper landed still load.
        storage: createAuthStorage(),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export function authRedirectUrl(): string {
  return typeof window !== 'undefined' ? window.location.origin : ''
}
