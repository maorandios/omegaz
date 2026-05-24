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
): Promise<void> {
  if (!supabase) return

  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      email: user.email,
      full_name: user.fullName,
      phone: user.phone ?? null,
      business_name: user.businessName ?? null,
      subscription,
    },
    { onConflict: 'id' },
  )

  if (error) throw error
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
    }
  }

  const mapped = userFromAuthUser(session.user)
  const mergedUser = normalizeUser({
    fullName: localUser?.fullName ?? mapped.fullName,
    email: mapped.email,
    phone: localUser?.phone ?? mapped.phone,
    businessName: localUser?.businessName ?? mapped.businessName,
  })

  const existing = await fetchProfile(session.user.id)
  const subscription = existing?.subscription ?? defaultSubscription()

  await upsertProfile(session.user.id, mergedUser, subscription)

  return { user: mergedUser, subscription }
}
