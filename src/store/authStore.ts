import type { Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { upsertProfileFromSession } from '@/lib/db/profilesRepository'
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
  /** Email the OTP/magic link was sent to (used by the verify-code screen). */
  pendingEmail: string | null
  authError: string | null
  loadingAction: 'google' | 'magic-link' | 'verify-otp' | null
  initAuth: () => () => void
  signInWithGoogle: () => Promise<void>
  sendMagicLink: (email: string) => Promise<void>
  verifyEmailOtp: (token: string) => Promise<boolean>
  resetMagicLinkState: () => void
  clearAuthError: () => void
  signOut: () => Promise<void>
  continueLocalDev: () => void
  showSignInScreen: () => void
}

async function syncAppUserFromSession(session: Session | null): Promise<void> {
  if (!session?.user || !isSupabaseConfigured) return

  const current = useAppStore.getState().user

  try {
    const bundle = await upsertProfileFromSession(session, current)
    useAppStore
      .getState()
      .setProfileBundle(bundle.user, bundle.subscription, bundle.onboardingComplete)
  } catch (err) {
    console.error('Failed to sync profile from session', err)
  }
}

function wantsAuthPreviewOnLoad(): boolean {
  if (!isLocalAuthBypass || typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('auth')
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ready: false,
  session: null,
  localDevSignedOut: false,
  magicLinkSent: false,
  pendingEmail: null,
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
      void syncAppUserFromSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, authError: null })
      void syncAppUserFromSession(session)
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
    set({ magicLinkSent: true, pendingEmail: trimmed })
  },

  verifyEmailOtp: async (token) => {
    if (!supabase) {
      set({ authError: 'Sign-in is not configured yet.' })
      return false
    }

    const email = get().pendingEmail
    if (!email) {
      set({ authError: 'Send the code again — no email on file.' })
      return false
    }

    const cleaned = token.replace(/\D/g, '')
    if (cleaned.length !== 6) {
      set({ authError: 'Enter all 6 digits.' })
      return false
    }

    set({ authError: null, loadingAction: 'verify-otp' })
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: cleaned,
      type: 'email',
    })
    set({ loadingAction: null })

    if (error || !data.session) {
      set({
        authError:
          error?.message ?? 'That code is invalid or expired. Request a new one.',
      })
      return false
    }

    set({
      session: data.session,
      magicLinkSent: false,
      pendingEmail: null,
      authError: null,
    })
    return true
  },

  resetMagicLinkState: () =>
    set({ magicLinkSent: false, pendingEmail: null, authError: null }),

  clearAuthError: () => set({ authError: null }),

  signOut: async () => {
    if (supabase) await supabase.auth.signOut()
    set({
      session: null,
      magicLinkSent: false,
      pendingEmail: null,
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
