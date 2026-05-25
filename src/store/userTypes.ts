export interface StoredUser {
  fullName: string
  /** Set at sign-up; read-only in profile until Supabase auth is wired. */
  email: string
  phone?: string
  businessName?: string
}

export type SubscriptionPlanId = 'free' | 'pro'

/**
 * Lifecycle states for a subscription.
 * - `trial`: 14 days free after signup, no payment yet.
 * - `active`: paid subscription, PayPal billing successfully.
 * - `past_due`: PayPal payment failed / subscription suspended.
 * - `cancelled`: user cancelled but still inside the paid period
 *   (entitlement remains until `currentPeriodEnd`).
 * - `expired`: trial elapsed without subscribing, or post-cancel period ended.
 */
export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired'

export interface StoredSubscription {
  planId: SubscriptionPlanId
  /** Human label for the active plan. Always 'Pro' today; kept for future plans. */
  planName: string
  status: SubscriptionStatus
  cancelAtPeriodEnd: boolean
  /** Renewal date for paid / cancel-at-period-end states. */
  currentPeriodEnd: string
  /** When the free trial ends. Only meaningful while `status === 'trial'`. */
  trialEndsAt?: string
  provider?: 'paypal'
  paypalSubscriptionId?: string
  lastPaymentAt?: string
}

/** What the UI gates against — never read `status` directly. */
export type Entitlement = 'trial' | 'paid' | 'locked'

/**
 * Parses an ISO-ish timestamp returning ms-since-epoch, or NaN. If the date
 * fails to parse (e.g. an unexpected Postgres format slipped past
 * normalization on Safari/iOS), we treat the user as *not yet* expired so we
 * don't incorrectly lock a paying / trial user out of the app. The opposite
 * default (treat as expired) was the old bug.
 */
function parseTime(value: string | undefined): number {
  if (!value) return Number.NaN
  return new Date(value).getTime()
}

/**
 * Single source of truth for "can the user use the app?" — combines
 * lifecycle status + clock so the same selector handles trial expiry,
 * cancel-at-period-end grace, and locked states.
 */
export function entitlementFor(
  subscription: StoredSubscription,
  now: Date = new Date(),
): Entitlement {
  switch (subscription.status) {
    case 'trial': {
      const end = parseTime(subscription.trialEndsAt ?? subscription.currentPeriodEnd)
      // Unparseable end date -> assume trial is still valid (fail-open).
      if (!Number.isFinite(end)) return 'trial'
      return end > now.getTime() ? 'trial' : 'locked'
    }
    case 'active':
    case 'past_due':
      return 'paid'
    case 'cancelled': {
      const end = parseTime(subscription.currentPeriodEnd)
      if (!Number.isFinite(end)) return 'paid'
      return end > now.getTime() ? 'paid' : 'locked'
    }
    case 'expired':
    default:
      return 'locked'
  }
}

export function isSubscriptionLocked(
  subscription: StoredSubscription,
  now: Date = new Date(),
): boolean {
  return entitlementFor(subscription, now) === 'locked'
}

/** Whole days of trial remaining (>= 0). Use for "Trial · N days left" UI. */
export function trialDaysRemaining(
  subscription: StoredSubscription,
  now: Date = new Date(),
): number {
  if (subscription.status !== 'trial') return 0
  const end = parseTime(subscription.trialEndsAt ?? subscription.currentPeriodEnd)
  if (!Number.isFinite(end)) return TRIAL_DAYS
  const diffMs = end - now.getTime()
  if (diffMs <= 0) return 0
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000))
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
        : 'guest@getsegments.co',
    phone: typeof u.phone === 'string' && u.phone.trim() ? u.phone.trim() : undefined,
    businessName:
      typeof u.businessName === 'string' && u.businessName.trim()
        ? u.businessName.trim()
        : undefined,
  }
}

const TRIAL_DAYS = 14

function isoNDaysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

/**
 * Local-state fallback used before Supabase hydration (or in dev bypass mode).
 * Real users get their `subscription` row from `public.profiles`, seeded by
 * the `handle_new_user` trigger — see `004_trial_subscription.sql`.
 */
export function defaultSubscription(): StoredSubscription {
  const end = isoNDaysFromNow(TRIAL_DAYS)
  return {
    planId: 'pro',
    planName: 'Pro',
    status: 'trial',
    cancelAtPeriodEnd: false,
    currentPeriodEnd: end,
    trialEndsAt: end,
  }
}

const STATUS_VALUES: SubscriptionStatus[] = [
  'trial',
  'active',
  'past_due',
  'cancelled',
  'expired',
]

function normalizeStatus(raw: unknown): SubscriptionStatus {
  return STATUS_VALUES.includes(raw as SubscriptionStatus)
    ? (raw as SubscriptionStatus)
    : 'trial'
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

/**
 * Postgres `timestamptz::text` produces `YYYY-MM-DD HH:MM:SS.fff+TZ`, which
 * iOS Safari (and therefore every iOS browser, since they all use WebKit)
 * refuses to parse. We replace the space with `T` so `new Date(value)` works
 * everywhere. Already-ISO values pass through unchanged.
 *
 * Also rewrites timezone offsets like `+00` into `+00:00` since Safari is
 * picky about that too.
 */
function toIsoDateString(value: string | undefined): string | undefined {
  if (!value) return value
  let normalized = value.includes(' ') ? value.replace(' ', 'T') : value
  // `+00` -> `+00:00`, `-05` -> `-05:00`. Leave already-colon-formatted
  // offsets (`+00:00`, `+0530`) alone.
  normalized = normalized.replace(/([+-]\d{2})$/, '$1:00')
  return normalized
}

function optionalIsoString(value: unknown): string | undefined {
  return toIsoDateString(optionalString(value))
}

export function normalizeSubscription(raw: unknown): StoredSubscription {
  if (!raw || typeof raw !== 'object') return defaultSubscription()
  const s = raw as Record<string, unknown>
  const planId = s.planId === 'free' ? 'free' : 'pro'
  const status = normalizeStatus(s.status)
  const fallback = defaultSubscription()
  const provider = s.provider === 'paypal' ? 'paypal' : undefined

  return {
    planId,
    planName: typeof s.planName === 'string' ? s.planName : planId === 'pro' ? 'Pro' : 'Free',
    status,
    cancelAtPeriodEnd: Boolean(s.cancelAtPeriodEnd),
    currentPeriodEnd:
      optionalIsoString(s.currentPeriodEnd) ?? fallback.currentPeriodEnd,
    trialEndsAt:
      optionalIsoString(s.trialEndsAt) ??
      (status === 'trial' ? fallback.trialEndsAt : undefined),
    provider,
    paypalSubscriptionId: optionalString(s.paypalSubscriptionId),
    lastPaymentAt: optionalIsoString(s.lastPaymentAt),
  }
}

export function formatSubscriptionPeriodEnd(iso: string): string {
  // Defensive: normalize in case a caller passes a raw Postgres timestamp.
  const safe = toIsoDateString(iso) ?? iso
  return new Date(safe).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
