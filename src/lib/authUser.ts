import type { User } from '@supabase/supabase-js'
import type { StoredUser } from '@/store/userTypes'

export function userFromAuthUser(authUser: User): StoredUser {
  const meta = authUser.user_metadata ?? {}
  const fullName =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    authUser.email?.split('@')[0]?.trim() ||
    'User'

  return {
    fullName,
    email: authUser.email?.trim() ?? '',
    phone:
      typeof meta.phone === 'string' && meta.phone.trim() ? meta.phone.trim() : undefined,
    businessName:
      typeof meta.business_name === 'string' && meta.business_name.trim()
        ? meta.business_name.trim()
        : undefined,
  }
}

export function isValidEmailForMagicLink(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
