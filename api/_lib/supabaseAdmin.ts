import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client for the Vercel API routes.
 *
 * Never import this from the browser — it carries `SUPABASE_SERVICE_ROLE_KEY`,
 * which bypasses Row Level Security.
 */

let cached: SupabaseClient | null = null

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} environment variable`)
  return value
}

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  if (!url) throw new Error('Missing SUPABASE_URL (or VITE_SUPABASE_URL) environment variable')
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}

/**
 * Validates the `Authorization: Bearer <jwt>` header against Supabase and
 * returns the authenticated user id. Throws if the header is missing or the
 * token is invalid/expired.
 */
export async function getUserIdFromAuthHeader(
  authorization: string | undefined,
): Promise<string> {
  if (!authorization?.startsWith('Bearer ')) {
    throw new AuthError('Missing Authorization header', 401)
  }
  const token = authorization.slice('Bearer '.length).trim()
  if (!token) throw new AuthError('Missing access token', 401)

  const admin = getSupabaseAdmin()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user?.id) {
    throw new AuthError('Invalid or expired session', 401)
  }
  return data.user.id
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}

export interface ProfileSubscription {
  planId: 'free' | 'pro'
  planName?: string
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string
  trialEndsAt?: string
  provider?: 'paypal'
  paypalSubscriptionId?: string
  lastPaymentAt?: string
}

export async function getProfileSubscription(
  userId: string,
): Promise<ProfileSubscription | null> {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('profiles')
    .select('subscription')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data?.subscription as ProfileSubscription | null) ?? null
}

export async function updateProfileSubscription(
  userId: string,
  subscription: ProfileSubscription,
): Promise<void> {
  const admin = getSupabaseAdmin()
  const { error } = await admin
    .from('profiles')
    .update({ subscription })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function findProfileByPaypalSubscriptionId(
  paypalSubscriptionId: string,
): Promise<{ userId: string; subscription: ProfileSubscription } | null> {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('profiles')
    .select('id, subscription')
    .filter('subscription->>paypalSubscriptionId', 'eq', paypalSubscriptionId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return {
    userId: data.id as string,
    subscription: data.subscription as ProfileSubscription,
  }
}
