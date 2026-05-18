export interface StoredUser {
  fullName: string
  /** Set at sign-up; read-only in profile until Supabase auth is wired. */
  email: string
  phone?: string
  businessName?: string
}

export type SubscriptionPlanId = 'free' | 'pro'

export interface StoredSubscription {
  planId: SubscriptionPlanId
  planName: string
  status: 'active' | 'cancelled'
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string
}

export function userDisplayName(user: StoredUser): string {
  const trimmed = user.fullName.trim()
  if (!trimmed) return 'there'
  return trimmed.split(/\s+/)[0] ?? trimmed
}

export function normalizeUser(raw: unknown): StoredUser {
  const u = (raw ?? {}) as Record<string, unknown>
  const legacyFirst = typeof u.firstName === 'string' ? u.firstName : ''
  const legacyLast = typeof u.lastName === 'string' ? u.lastName : ''
  const fullName =
    typeof u.fullName === 'string' && u.fullName.trim()
      ? u.fullName.trim()
      : [legacyFirst, legacyLast].filter(Boolean).join(' ').trim() || 'Guest User'

  return {
    fullName,
    email:
      typeof u.email === 'string' && u.email.trim()
        ? u.email.trim()
        : 'guest@FOLDS.app',
    phone: typeof u.phone === 'string' && u.phone.trim() ? u.phone.trim() : undefined,
    businessName:
      typeof u.businessName === 'string' && u.businessName.trim()
        ? u.businessName.trim()
        : undefined,
  }
}

export function defaultSubscription(): StoredSubscription {
  const end = new Date()
  end.setMonth(end.getMonth() + 1)
  return {
    planId: 'pro',
    planName: 'Pro',
    status: 'active',
    cancelAtPeriodEnd: false,
    currentPeriodEnd: end.toISOString(),
  }
}

export function normalizeSubscription(raw: unknown): StoredSubscription {
  if (!raw || typeof raw !== 'object') return defaultSubscription()
  const s = raw as Record<string, unknown>
  const planId = s.planId === 'free' ? 'free' : 'pro'
  const status = s.status === 'cancelled' ? 'cancelled' : 'active'
  return {
    planId,
    planName: typeof s.planName === 'string' ? s.planName : planId === 'pro' ? 'Pro' : 'Free',
    status,
    cancelAtPeriodEnd: Boolean(s.cancelAtPeriodEnd),
    currentPeriodEnd:
      typeof s.currentPeriodEnd === 'string'
        ? s.currentPeriodEnd
        : defaultSubscription().currentPeriodEnd,
  }
}

export function formatSubscriptionPeriodEnd(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
