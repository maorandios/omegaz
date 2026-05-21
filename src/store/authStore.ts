import type { Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { userFromAuthUser } from '@/lib/authUser'
import {
  authRedirectUrl,
  isLocalAuthBypass,
  isSupabaseConfigured,
  supabase,
} from '@/lib/supabase'
import { useAppStore } from '@/store/appStore'

interface AuthState {
  ready: boolean
  session: Session | null
  /** Local dev without Supabase: false = in app, true = show sign-in screen. */
  localDevSignedOut: boolean
  magicLinkSent: boolean
  authError: string | null
  loadingAction: 'google' | 'magic-link' | null
  initAuth: () => () => void
  signInWithGoogle: () => Promise<void>
  sendMagicLink: (email: string) => Promise<void>
  resetMagicLinkState: () => void
  clearAuthError: () => void
  signOut: () => Promise<void>
  continueLocalDev: () => void
  showSignInScreen: () => void
}

function syncAppUserFromSession(session: Session | null): void {
  if (!session?.user) return

  const mapped = userFromAuthUser(session.user)
  const current = useAppStore.getState().user

  useAppStore.getState().setUser({
    ...mapped,
    phone: current.phone ?? mapped.phone,
    businessName: current.businessName ?? mapped.businessName,
  })
}

function wantsAuthPreviewOnLoad(): boolean {
  if (!isLocalAuthBypass || typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('auth')
}

export const useAuthStore = create<AuthState>((set) => ({
  ready: false,
  session: null,
  localDevSignedOut: false,
  magicLinkSent: false,
  authError: null,
  loadingAction: null,

  initAuth: () => {
    if (!supabase) {
      set({
        ready: true,
        session: null,
        localDevSignedOut: wantsAuthPreviewOnLoad(),
      })
      return () => {}
    }

    let cancelled = false

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (cancelled) return
      if (error) {
        set({ ready: true, session: null, authError: error.message })
        return
      }
      set({ ready: true, session })
      syncAppUserFromSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, authError: null })
      if (session) syncAppUserFromSession(session)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  },

  signInWithGoogle: async () => {
    if (!supabase) {
      set({ authError: 'Sign-in is not configured yet.' })
      return
    }

    set({ authError: null, loadingAction: 'google' })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirectUrl() },
    })
    set({ loadingAction: null })
    if (error) set({ authError: error.message })
  },

  sendMagicLink: async (email) => {
    if (!supabase) {
      set({ authError: 'Sign-in is not configured yet.' })
      return
    }

    const trimmed = email.trim()
    set({ authError: null, loadingAction: 'magic-link' })
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: authRedirectUrl() },
    })
    set({ loadingAction: null })
    if (error) {
      set({ authError: error.message })
      return
    }
    set({ magicLinkSent: true })
  },

  resetMagicLinkState: () => set({ magicLinkSent: false, authError: null }),

  clearAuthError: () => set({ authError: null }),

  signOut: async () => {
    if (supabase) await supabase.auth.signOut()
    set({
      session: null,
      magicLinkSent: false,
      authError: null,
      localDevSignedOut: isLocalAuthBypass,
    })
  },

  continueLocalDev: () => set({ localDevSignedOut: false, authError: null }),

  showSignInScreen: () => set({ localDevSignedOut: true, authError: null }),
}))

export function isAuthenticatedSession(
  session: Session | null,
  localDevSignedOut: boolean,
): boolean {
  if (isLocalAuthBypass && !localDevSignedOut) return true
  return session != null && isSupabaseConfigured
}
