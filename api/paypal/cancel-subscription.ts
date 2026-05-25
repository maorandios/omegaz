import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cancelSubscription as cancelPaypalSubscription } from '../_lib/paypal.js'
import {
  AuthError,
  getProfileSubscription,
  getUserIdFromAuthHeader,
  updateProfileSubscription,
} from '../_lib/supabaseAdmin.js'

/**
 * POST /api/paypal/cancel-subscription
 *
 * Auth:  Authorization: Bearer <supabase-jwt>
 *
 * Calls PayPal to cancel the user's active subscription and flips
 * `cancelAtPeriodEnd: true` so the UI shows the right state immediately. The
 * webhook will later flip `status` to `cancelled` / `expired`.
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
    const existing = await getProfileSubscription(userId)
    if (!existing?.paypalSubscriptionId) {
      res.status(409).json({ error: 'No active PayPal subscription on file.' })
      return
    }

    await cancelPaypalSubscription(existing.paypalSubscriptionId)

    await updateProfileSubscription(userId, {
      ...existing,
      cancelAtPeriodEnd: true,
    })

    res.status(200).json({ ok: true })
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    console.error('cancel-subscription failed', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    })
  }
}
