import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

/** Local `npm run dev` without Supabase env — skip sign-in until auth is wired up. */
export const isLocalAuthBypass = !isSupabaseConfigured && import.meta.env.DEV

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export function authRedirectUrl(): string {
  return typeof window !== 'undefined' ? window.location.origin : ''
}
