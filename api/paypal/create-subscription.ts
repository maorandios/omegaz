import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createSubscription } from '../_lib/paypal.js'
import {
  AuthError,
  getUserIdFromAuthHeader,
} from '../_lib/supabaseAdmin.js'

/**
 * POST /api/paypal/create-subscription
 *
 * Body:  { returnUrl: string, cancelUrl: string }
 * Auth:  Authorization: Bearer <supabase-jwt>
 *
 * Creates a PayPal subscription with the configured Pro plan id and returns
 * the approval URL. The client should then navigate the user to that URL
 * (full-page redirect). After the user approves, PayPal redirects back to
 * `returnUrl` with `?subscription_id=...`.
 */
const PLAN_ID = process.env.PAYPAL_PLAN_ID || process.env.VITE_PAYPAL_PLAN_ID

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!PLAN_ID) {
    res
      .status(500)
      .json({ error: 'Server is missing PAYPAL_PLAN_ID / VITE_PAYPAL_PLAN_ID' })
    return
  }

  try {
    const userId = await getUserIdFromAuthHeader(req.headers.authorization)
    const body = (req.body ?? {}) as { returnUrl?: string; cancelUrl?: string }
    const returnUrl = body.returnUrl?.trim()
    const cancelUrl = body.cancelUrl?.trim()
    if (!returnUrl || !cancelUrl) {
      res.status(400).json({ error: 'Missing returnUrl / cancelUrl' })
      return
    }

    const subscription = await createSubscription({
      planId: PLAN_ID,
      returnUrl,
      cancelUrl,
      customId: userId,
    })

    const approveLink = subscription.links?.find((link) => link.rel === 'approve')
    if (!approveLink?.href) {
      res.status(502).json({ error: 'PayPal did not return an approval link' })
      return
    }

    res.status(200).json({
      subscriptionId: subscription.id,
      approveUrl: approveLink.href,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    console.error('create-subscription failed', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    })
  }
}
