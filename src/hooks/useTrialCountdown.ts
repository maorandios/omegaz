import { useEffect, useState } from 'react'
import type { StoredSubscription } from '@/store/userTypes'
import { entitlementFor, trialDaysRemaining } from '@/store/userTypes'

/** Recomputes trial days left every minute and when the tab regains focus. */
export function useTrialCountdown(subscription: StoredSubscription): number | null {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (subscription.status !== 'trial') return

    const bump = () => setTick((n) => n + 1)
    const interval = window.setInterval(bump, 60_000)
    document.addEventListener('visibilitychange', bump)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', bump)
    }
  }, [subscription.status, subscription.trialEndsAt, subscription.currentPeriodEnd])

  if (entitlementFor(subscription) !== 'trial') return null
  return trialDaysRemaining(subscription)
}
