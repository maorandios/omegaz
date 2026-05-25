import {
  PayPalButtons,
  PayPalScriptProvider,
  type ReactPayPalScriptOptions,
} from '@paypal/react-paypal-js'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { confirmPaypalSubscription } from '@/lib/paypalClient'
import { PRO_CURRENCY, PRO_PRICE_LABEL, TRIAL_DAYS } from '@/lib/pricing'
import { useAppStore } from '@/store/appStore'

interface UpgradeSubscriptionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID
const PAYPAL_PLAN_ID = import.meta.env.VITE_PAYPAL_PLAN_ID

const FEATURE_BULLETS = [
  'Unlimited projects & plates',
  'Branded PDF and ZIP exports',
  'Cancel anytime — keeps Pro until period end',
]

export function UpgradeSubscriptionSheet({
  open,
  onOpenChange,
}: UpgradeSubscriptionSheetProps) {
  const hydrateApp = useAppStore((s) => s.hydrateApp)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const scriptOptions = useMemo<ReactPayPalScriptOptions | null>(() => {
    if (!PAYPAL_CLIENT_ID) return null
    return {
      clientId: PAYPAL_CLIENT_ID,
      intent: 'subscription',
      vault: true,
      currency: PRO_CURRENCY,
      components: 'buttons',
    }
  }, [])

  const handleOpenChange = (next: boolean) => {
    if (confirming) return
    onOpenChange(next)
    if (!next) setError(null)
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

          {scriptOptions && PAYPAL_PLAN_ID ? (
            <div className="space-y-2">
              <PayPalScriptProvider options={scriptOptions}>
                <PayPalButtons
                  style={{
                    layout: 'vertical',
                    label: 'subscribe',
                    color: 'gold',
                    shape: 'rect',
                  }}
                  disabled={confirming}
                  createSubscription={(_data, actions) =>
                    actions.subscription.create({ plan_id: PAYPAL_PLAN_ID })
                  }
                  onApprove={async (data) => {
                    if (!data.subscriptionID) {
                      setError('PayPal did not return a subscription ID.')
                      return
                    }
                    setError(null)
                    setConfirming(true)
                    try {
                      await confirmPaypalSubscription(data.subscriptionID)
                      await hydrateApp()
                      onOpenChange(false)
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : 'Could not confirm subscription. Please contact support.',
                      )
                    } finally {
                      setConfirming(false)
                    }
                  }}
                  onError={(err) => {
                    setError(
                      err instanceof Error
                        ? err.message
                        : 'PayPal could not complete the subscription.',
                    )
                  }}
                  onCancel={() => {
                    setError(null)
                  }}
                />
              </PayPalScriptProvider>
              <p className="text-center text-[11px] leading-relaxed text-muted">
                {TRIAL_DAYS}-day trial included for new accounts. Subscribing now does
                not double-bill your trial.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-muted">
                PayPal isn&apos;t configured for this build yet. The Subscribe button
                will appear once <code>VITE_PAYPAL_CLIENT_ID</code> and{' '}
                <code>VITE_PAYPAL_PLAN_ID</code> are set.
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
