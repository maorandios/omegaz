import { isSupabaseConfigured, supabase } from '@/lib/supabase'

/** Client helpers that POST to the Vercel API routes backing PayPal subs. */

async function getAuthHeaders(): Promise<HeadersInit> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Sign in is required to manage your subscription.')
  }
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error(error.message)
  const token = data.session?.access_token
  if (!token) throw new Error('Your session has expired. Please sign in again.')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string; message?: string }
    return body.error || body.message || fallback
  } catch {
    return fallback
  }
}

/** Path PayPal redirects users to after subscription approval. */
export const PAYPAL_RETURN_PATH = '/billing/paypal/return'
/** Path PayPal redirects users to if they cancel the approval flow. */
export const PAYPAL_CANCEL_PATH = '/billing/paypal/cancel'

/**
 * Creates a PayPal subscription server-side and navigates the browser to the
 * PayPal approval URL. Replaces the popup-based Smart Button flow so mobile /
 * PWA users get a clean full-page redirect.
 */
export async function startPaypalSubscription(): Promise<void> {
  const headers = await getAuthHeaders()
  const origin = window.location.origin
  const response = await fetch('/api/paypal/create-subscription', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      returnUrl: `${origin}${PAYPAL_RETURN_PATH}`,
      cancelUrl: `${origin}${PAYPAL_CANCEL_PATH}`,
    }),
  })
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Could not start subscription.'))
  }
  const data = (await response.json()) as { approveUrl?: string }
  if (!data.approveUrl) {
    throw new Error('PayPal did not return an approval URL.')
  }
  window.location.href = data.approveUrl
}

export async function confirmPaypalSubscription(subscriptionId: string): Promise<void> {
  const headers = await getAuthHeaders()
  const response = await fetch('/api/paypal/confirm-subscription', {
    method: 'POST',
    headers,
    body: JSON.stringify({ subscriptionId }),
  })
  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, 'Could not confirm subscription.'),
    )
  }
}

export async function cancelPaypalSubscription(): Promise<void> {
  const headers = await getAuthHeaders()
  const response = await fetch('/api/paypal/cancel-subscription', {
    method: 'POST',
    headers,
  })
  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, 'Could not cancel subscription.'),
    )
  }
}
