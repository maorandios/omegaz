import { CheckCircle2, CircleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { confirmPaypalSubscription } from '@/lib/paypalClient'
import { useAppStore } from '@/store/appStore'

type Phase = 'pending' | 'success' | 'error' | 'cancelled'

interface BillingReturnScreenProps {
  /** If true, the user clicked "Cancel" on PayPal instead of approving. */
  cancelled?: boolean
}

/**
 * Landing screen for the PayPal full-page redirect flow.
 *
 * Reads `subscription_id` from the query string, calls our confirm route to
 * activate the subscription server-side, then re-hydrates the app state. URL
 * is cleared on completion so reloads don't re-trigger the confirm call.
 */
export function BillingReturnScreen({ cancelled = false }: BillingReturnScreenProps) {
  const hydrateApp = useAppStore((s) => s.hydrateApp)
  const setMainTab = useAppStore((s) => s.setMainTab)
  const [phase, setPhase] = useState<Phase>(cancelled ? 'cancelled' : 'pending')
  const [error, setError] = useState<string | null>(null)
  // StrictMode + dev double-invokes effects, so guard the confirm call.
  const startedRef = useRef(false)

  useEffect(() => {
    if (cancelled) return
    if (startedRef.current) return
    startedRef.current = true

    const params = new URLSearchParams(window.location.search)
    const subscriptionId = params.get('subscription_id')

    if (!subscriptionId) {
      setPhase('error')
      setError(
        "PayPal didn't send back a subscription id. Please try again from the Profile tab.",
      )
      return
    }

    void (async () => {
      try {
        await confirmPaypalSubscription(subscriptionId)
        await hydrateApp()
        setMainTab('profile')
        window.history.replaceState({}, '', '/')
        setPhase('success')
      } catch (err) {
        setPhase('error')
        setError(
          err instanceof Error
            ? err.message
            : 'Could not activate your subscription. Please contact support.',
        )
      }
    })()
  }, [cancelled, hydrateApp, setMainTab])

  const goHome = () => {
    window.history.replaceState({}, '', '/')
    window.location.reload()
  }

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center px-6 text-center">
      {phase === 'pending' && (
        <>
          <div
            className="mb-5 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden
          />
          <p className="text-base font-semibold text-foreground">
            Activating your subscription…
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Don&apos;t close this tab. PayPal confirmed your approval — we&apos;re
            unlocking Pro now.
          </p>
        </>
      )}

      {phase === 'success' && (
        <>
          <CheckCircle2
            className="mb-4 h-10 w-10 text-primary"
            strokeWidth={1.75}
            aria-hidden
          />
          <p className="text-lg font-semibold text-foreground">You&apos;re on Pro!</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Taking you to your profile…
          </p>
          <Button type="button" className="mt-6 h-11 rounded-2xl px-6" onClick={goHome}>
            Continue
          </Button>
        </>
      )}

      {phase === 'cancelled' && (
        <>
          <CircleAlert
            className="mb-4 h-10 w-10 text-muted"
            strokeWidth={1.75}
            aria-hidden
          />
          <p className="text-base font-semibold text-foreground">
            Checkout cancelled
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            No charge was made. You can subscribe anytime from the Profile tab.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-6 h-11 rounded-2xl px-6"
            onClick={goHome}
          >
            Back to Segments
          </Button>
        </>
      )}

      {phase === 'error' && (
        <>
          <CircleAlert
            className="mb-4 h-10 w-10 text-destructive"
            strokeWidth={1.75}
            aria-hidden
          />
          <p className="text-base font-semibold text-foreground">
            Something went wrong
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{error}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-6 h-11 rounded-2xl px-6"
            onClick={goHome}
          >
            Back to Segments
          </Button>
        </>
      )}
    </div>
  )
}
