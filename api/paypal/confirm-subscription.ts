import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSubscription } from '../_lib/paypal.js'
import {
  AuthError,
  getProfileSubscription,
  getUserIdFromAuthHeader,
  updateProfileSubscription,
  type ProfileSubscription,
} from '../_lib/supabaseAdmin.js'

/**
 * POST /api/paypal/confirm-subscription
 *
 * Body:  { subscriptionId: string }
 * Auth:  Authorization: Bearer <supabase-jwt>
 *
 * Verifies the PayPal subscription is ACTIVE / APPROVED, then writes the
 * `subscription` JSONB on the user's profile.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const userId = await getUserIdFromAuthHeader(req.headers.authorization)
    const body = (req.body ?? {}) as { subscriptionId?: string }
    const subscriptionId = body.subscriptionId?.trim()
    if (!subscriptionId) {
      res.status(400).json({ error: 'Missing subscriptionId' })
      return
    }

    const paypalSub = await getSubscription(subscriptionId)
    if (paypalSub.status !== 'ACTIVE' && paypalSub.status !== 'APPROVED') {
      res.status(409).json({
        error: `PayPal subscription is not active (status: ${paypalSub.status}).`,
      })
      return
    }

    const existing = await getProfileSubscription(userId)
    const nextPeriodEnd =
      paypalSub.billing_info?.next_billing_time ??
      existing?.currentPeriodEnd ??
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const subscription: ProfileSubscription = {
      ...(existing ?? {
        planId: 'pro',
        planName: 'Pro',
        status: 'active',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: nextPeriodEnd,
      }),
      planId: 'pro',
      planName: existing?.planName ?? 'Pro',
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: nextPeriodEnd,
      provider: 'paypal',
      paypalSubscriptionId: subscriptionId,
      lastPaymentAt:
        paypalSub.billing_info?.last_payment?.time ?? existing?.lastPaymentAt,
    }
    // Trial is consumed once paid; drop the field if it was carried over.
    delete subscription.trialEndsAt

    await updateProfileSubscription(userId, subscription)
    res.status(200).json({ ok: true, subscription })
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    console.error('confirm-subscription failed', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    })
  }
}
