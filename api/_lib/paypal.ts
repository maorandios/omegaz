/**
 * Thin server-side wrapper over the PayPal REST API.
 *
 * Lives under `api/_lib` so Vercel does not expose it as an endpoint. The
 * underscore prefix is the convention Vercel uses to keep files out of the
 * routing tree.
 */

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com'

type TokenCache = { token: string; expiresAt: number }
let cachedToken: TokenCache | null = null

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} environment variable`)
  return value
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token
  }

  const clientId = requireEnv('PAYPAL_CLIENT_ID')
  const secret = requireEnv('PAYPAL_SECRET')
  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64')

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`PayPal token request failed (${response.status}): ${text}`)
  }

  const data = (await response.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return cachedToken.token
}

export interface PaypalSubscription {
  id: string
  status:
    | 'APPROVAL_PENDING'
    | 'APPROVED'
    | 'ACTIVE'
    | 'SUSPENDED'
    | 'CANCELLED'
    | 'EXPIRED'
  custom_id?: string
  billing_info?: {
    next_billing_time?: string
    last_payment?: { time?: string }
  }
}

export async function getSubscription(
  subscriptionId: string,
): Promise<PaypalSubscription> {
  const token = await getAccessToken()
  const response = await fetch(
    `${PAYPAL_API_BASE}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`PayPal getSubscription failed (${response.status}): ${text}`)
  }
  return (await response.json()) as PaypalSubscription
}

export async function cancelSubscription(
  subscriptionId: string,
  reason = 'User requested cancellation',
): Promise<void> {
  const token = await getAccessToken()
  const response = await fetch(
    `${PAYPAL_API_BASE}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    },
  )
  // 204 No Content is the success response.
  if (response.status !== 204 && !response.ok) {
    const text = await response.text()
    throw new Error(`PayPal cancelSubscription failed (${response.status}): ${text}`)
  }
}

interface WebhookVerifyArgs {
  transmissionId: string | undefined
  transmissionTime: string | undefined
  certUrl: string | undefined
  authAlgo: string | undefined
  transmissionSig: string | undefined
  body: unknown
}

/**
 * Verifies a PayPal webhook signature server-side. Returns true only if PayPal
 * confirms the event is authentic and intended for our webhook id.
 */
export async function verifyWebhookSignature(args: WebhookVerifyArgs): Promise<boolean> {
  const webhookId = requireEnv('PAYPAL_WEBHOOK_ID')
  const {
    transmissionId,
    transmissionTime,
    certUrl,
    authAlgo,
    transmissionSig,
    body,
  } = args

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false
  }

  const token = await getAccessToken()
  const response = await fetch(
    `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: body,
      }),
    },
  )

  if (!response.ok) return false
  const data = (await response.json()) as { verification_status?: string }
  return data.verification_status === 'SUCCESS'
}
