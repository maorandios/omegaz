import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { startPaypalSubscription } from '@/lib/paypalClient'
import { PRO_CURRENCY, PRO_PRICE_LABEL } from '@/lib/pricing'

interface UpgradeSubscriptionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PAYPAL_CONFIGURED = Boolean(import.meta.env.VITE_PAYPAL_PLAN_ID)

const FEATURE_BULLETS = [
  'Unlimited projects & plates',
  'Branded PDF and ZIP exports',
  'Cancel anytime — keeps Pro until period end',
]

export function UpgradeSubscriptionSheet({
  open,
  onOpenChange,
}: UpgradeSubscriptionSheetProps) {
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Mirror submitting into a ref so the bfcache/visibility handlers below can
  // read the current value without re-binding the listeners on every render.
  const submittingRef = useRef(false)
  submittingRef.current = submitting

  // The PayPal flow does a full-page navigation away. If the user backs out
  // of PayPal without completing checkout (browser back button, iOS "Done",
  // or closing the in-app browser), our page is restored from bfcache with
  // `submitting === true` from before the redirect. That leaves the button
  // disabled and the sheet looking frozen. Reset on return so the UI is
  // immediately usable again.
  useEffect(() => {
    const reset = () => {
      if (!submittingRef.current) return
      setSubmitting(false)
      setError(null)
      onOpenChange(false)
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) reset()
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') reset()
    }

    window.addEventListener('pageshow', handlePageShow)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [onOpenChange])

  const handleOpenChange = (next: boolean) => {
    // Never trap the user. If they want to dismiss the sheet (swipe down,
    // escape, tap outside) we let them, even mid-submit — the redirect will
    // either fire or it won't.
    onOpenChange(next)
    if (!next) {
      setError(null)
      setSubmitting(false)
    }
  }

  const handleSubscribe = async () => {
    setError(null)
    setSubmitting(true)
    try {
      // This call ends with `window.location.href = approveUrl` so the user
      // is navigated away. We deliberately don't reset `submitting` after
      // success so the button stays disabled while the page unloads.
      await startPaypalSubscription()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not start the PayPal checkout. Please try again.',
      )
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg">
        <div
          className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-border"
          aria-hidden
        />
        <SheetHeader>
          <SheetTitle>Subscribe to Pro</SheetTitle>
        </SheetHeader>

        <div className="mt-2 space-y-4">
          <div className="rounded-2xl border border-border bg-surface/40 px-4 py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-base font-semibold text-foreground">Pro</span>
              <span className="text-lg font-semibold text-foreground">
                {PRO_PRICE_LABEL}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Billed monthly in {PRO_CURRENCY} via PayPal. Cancel anytime.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-foreground/90">
              {FEATURE_BULLETS.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <span
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary"
                    aria-hidden
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          {PAYPAL_CONFIGURED ? (
            <div className="space-y-2">
              <Button
                type="button"
                className="h-12 w-full rounded-2xl text-base font-semibold"
                disabled={submitting}
                onClick={() => {
                  void handleSubscribe()
                }}
              >
                {submitting ? 'Redirecting to PayPal…' : `Continue with PayPal`}
              </Button>
              <p className="text-center text-[11px] leading-relaxed text-muted">
                You&apos;ll be redirected to PayPal to approve the subscription, then
                brought straight back to Segments.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-muted">
                PayPal isn&apos;t configured for this build yet. The Subscribe button
                will appear once <code>VITE_PAYPAL_PLAN_ID</code> is set.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
