import type { Session } from '@supabase/supabase-js'
import { userFromAuthUser } from '@/lib/authUser'
import type { DbProfileRow } from '@/lib/db/types'
import { supabase } from '@/lib/supabase'
import {
  defaultSubscription,
  normalizeSubscription,
  normalizeUser,
  type StoredSubscription,
  type StoredUser,
} from '@/store/userTypes'

export interface ProfileBundle {
  user: StoredUser
  subscription: StoredSubscription
  onboardingComplete: boolean
}

function profileRowToBundle(row: DbProfileRow): ProfileBundle {
  return {
    user: normalizeUser({
      fullName: row.full_name,
      email: row.email,
      phone: row.phone ?? undefined,
      businessName: row.business_name ?? undefined,
    }),
    subscription: normalizeSubscription(row.subscription),
    onboardingComplete: Boolean(row.onboarding_complete),
  }
}

export async function fetchProfile(userId: string): Promise<ProfileBundle | null> {
  if (!supabase) return null

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  if (!data) return null

  return profileRowToBundle(data as DbProfileRow)
}

export async function upsertProfile(
  userId: string,
  user: StoredUser,
  subscription: StoredSubscription,
  options?: { onboardingComplete?: boolean },
): Promise<void> {
  if (!supabase) return

  const row: Record<string, unknown> = {
    id: userId,
    email: user.email,
    full_name: user.fullName,
    phone: user.phone ?? null,
    business_name: user.businessName ?? null,
    subscription,
  }

  if (options?.onboardingComplete !== undefined) {
    row.onboarding_complete = options.onboardingComplete
  }

  const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' })

  if (error) throw error
}

/**
 * Mirror onboarding data into Supabase Auth user metadata so the user's
 * Display name and phone in the Authentication dashboard reflect the profile.
 */
export async function syncAuthUserMetadata(user: StoredUser): Promise<void> {
  if (!supabase) return

  const data: Record<string, string> = {
    full_name: user.fullName,
    name: user.fullName,
    display_name: user.fullName,
  }
  if (user.businessName) data.business_name = user.businessName
  if (user.phone) data.phone = user.phone

  const payload: { data: Record<string, string>; phone?: string } = { data }
  if (user.phone) payload.phone = user.phone

  const { error } = await supabase.auth.updateUser(payload)
  if (error) {
    // Phone can fail when no SMS provider is configured; retry without it so
    // metadata still saves and the user can finish onboarding.
    if (payload.phone) {
      const { error: retryError } = await supabase.auth.updateUser({ data })
      if (retryError) throw retryError
      return
    }
    throw error
  }
}

export async function completeOnboarding(
  userId: string,
  user: StoredUser,
  subscription: StoredSubscription,
): Promise<void> {
  await upsertProfile(userId, user, subscription, { onboardingComplete: true })
  await syncAuthUserMetadata(user)
}

export async function upsertProfileFromSession(
  session: Session,
  localUser?: StoredUser,
): Promise<ProfileBundle> {
  if (!supabase) {
    const mapped = userFromAuthUser(session.user)
    return {
      user: { ...mapped, ...localUser },
      subscription: defaultSubscription(),
      onboardingComplete: false,
    }
  }

  const mapped = userFromAuthUser(session.user)
  const existing = await fetchProfile(session.user.id)

  const mergedUser = normalizeUser({
    fullName: existing?.user.fullName || localUser?.fullName || mapped.fullName,
    email: mapped.email,
    phone: existing?.user.phone ?? localUser?.phone ?? mapped.phone,
    businessName:
      existing?.user.businessName ?? localUser?.businessName ?? mapped.businessName,
  })

  const subscription = existing?.subscription ?? defaultSubscription()

  await upsertProfile(session.user.id, mergedUser, subscription)

  return {
    user: mergedUser,
    subscription,
    onboardingComplete: existing?.onboardingComplete ?? false,
  }
}
