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
