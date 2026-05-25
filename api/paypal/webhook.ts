import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSubscription, verifyWebhookSignature } from '../_lib/paypal.js'
import {
  findProfileByPaypalSubscriptionId,
  updateProfileSubscription,
  type ProfileSubscription,
} from '../_lib/supabaseAdmin.js'

/**
 * POST /api/paypal/webhook
 *
 * Public endpoint hit by PayPal whenever a subscription's lifecycle changes.
 * We verify the signature with PayPal's `verify-webhook-signature` API, then
 * map the relevant events onto our `subscription` JSONB.
 */

interface PaypalWebhookEvent {
  event_type: string
  resource?: {
    id?: string
    /** Sale events carry the subscription id under `billing_agreement_id`. */
    billing_agreement_id?: string
    billing_info?: {
      next_billing_time?: string
      last_payment?: { time?: string }
    }
    update_time?: string
  }
}

type EventName =
  | 'BILLING.SUBSCRIPTION.ACTIVATED'
  | 'PAYMENT.SALE.COMPLETED'
  | 'BILLING.SUBSCRIPTION.SUSPENDED'
  | 'BILLING.SUBSCRIPTION.PAYMENT.FAILED'
  | 'BILLING.SUBSCRIPTION.CANCELLED'
  | 'BILLING.SUBSCRIPTION.EXPIRED'

const HANDLED_EVENTS: Readonly<Record<string, EventName>> = {
  'BILLING.SUBSCRIPTION.ACTIVATED': 'BILLING.SUBSCRIPTION.ACTIVATED',
  'PAYMENT.SALE.COMPLETED': 'PAYMENT.SALE.COMPLETED',
  'BILLING.SUBSCRIPTION.SUSPENDED': 'BILLING.SUBSCRIPTION.SUSPENDED',
  'BILLING.SUBSCRIPTION.PAYMENT.FAILED': 'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
  'BILLING.SUBSCRIPTION.CANCELLED': 'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.EXPIRED': 'BILLING.SUBSCRIPTION.EXPIRED',
}

function header(req: VercelRequest, name: string): string | undefined {
  const value = req.headers[name.toLowerCase()]
  if (Array.isArray(value)) return value[0]
  return value
}

function pickSubscriptionId(event: PaypalWebhookEvent): string | undefined {
  const resource = event.resource
  if (!resource) return undefined
  // Subscription events: resource.id is the subscription id.
  // Sale events: resource.id is the sale id; resource.billing_agreement_id
  // is the subscription id.
  if (event.event_type.startsWith('PAYMENT.SALE.')) {
    return resource.billing_agreement_id
  }
  return resource.id
}

async function applyEvent(
  eventName: EventName,
  subscriptionId: string,
  event: PaypalWebhookEvent,
): Promise<void> {
  const match = await findProfileByPaypalSubscriptionId(subscriptionId)
  if (!match) {
    console.warn(`Webhook for unknown subscription ${subscriptionId} (${eventName})`)
    return
  }
  const { userId, subscription } = match
  const next: ProfileSubscription = { ...subscription }

  switch (eventName) {
    case 'BILLING.SUBSCRIPTION.ACTIVATED': {
      next.status = 'active'
      next.cancelAtPeriodEnd = false
      // Refresh `currentPeriodEnd` from the live subscription state so the UI
      // always shows the real next billing time.
      try {
        const live = await getSubscription(subscriptionId)
        if (live.billing_info?.next_billing_time) {
          next.currentPeriodEnd = live.billing_info.next_billing_time
        }
        if (live.billing_info?.last_payment?.time) {
          next.lastPaymentAt = live.billing_info.last_payment.time
        }
      } catch (err) {
        console.warn('Failed to refresh PayPal subscription on ACTIVATED', err)
      }
      delete next.trialEndsAt
      break
    }
    case 'PAYMENT.SALE.COMPLETED': {
      next.status = 'active'
      if (event.resource?.update_time) {
        next.lastPaymentAt = event.resource.update_time
      }
      try {
        const live = await getSubscription(subscriptionId)
        if (live.billing_info?.next_billing_time) {
          next.currentPeriodEnd = live.billing_info.next_billing_time
        }
      } catch (err) {
        console.warn('Failed to refresh PayPal subscription on SALE_COMPLETED', err)
      }
      break
    }
    case 'BILLING.SUBSCRIPTION.SUSPENDED':
    case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
      next.status = 'past_due'
      break
    }
    case 'BILLING.SUBSCRIPTION.CANCELLED': {
      next.status = 'cancelled'
      next.cancelAtPeriodEnd = true
      break
    }
    case 'BILLING.SUBSCRIPTION.EXPIRED': {
      next.status = 'expired'
      next.cancelAtPeriodEnd = false
      break
    }
  }

  await updateProfileSubscription(userId, next)
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).end()
    return
  }

  const body = req.body as PaypalWebhookEvent | undefined
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Invalid body' })
    return
  }

  try {
    const verified = await verifyWebhookSignature({
      transmissionId: header(req, 'paypal-transmission-id'),
      transmissionTime: header(req, 'paypal-transmission-time'),
      certUrl: header(req, 'paypal-cert-url'),
      authAlgo: header(req, 'paypal-auth-algo'),
      transmissionSig: header(req, 'paypal-transmission-sig'),
      body,
    })

    if (!verified) {
      res.status(401).json({ error: 'Signature verification failed' })
      return
    }

    const eventName = HANDLED_EVENTS[body.event_type]
    if (!eventName) {
      // Acknowledge unknown events so PayPal does not keep retrying.
      res.status(200).json({ ok: true, ignored: body.event_type })
      return
    }

    const subscriptionId = pickSubscriptionId(body)
    if (!subscriptionId) {
      console.warn(`Webhook missing subscription id for ${body.event_type}`)
      res.status(200).json({ ok: true, ignored: 'missing-subscription-id' })
      return
    }

    await applyEvent(eventName, subscriptionId, body)
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('PayPal webhook failed', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    })
  }
}
