import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { CancelSubscriptionSheet } from '@/components/profile/CancelSubscriptionSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import { formatSubscriptionPeriodEnd } from '@/store/userTypes'

const readOnlyInputClass =
  'cursor-not-allowed border-border bg-background/80 text-muted opacity-100'

export function ProfileScreen() {
  const user = useAppStore((s) => s.user)
  const subscription = useAppStore((s) => s.subscription)
  const setUser = useAppStore((s) => s.setUser)
  const cancelSubscription = useAppStore((s) => s.cancelSubscription)
  const logout = useAppStore((s) => s.logout)

  const [cancelOpen, setCancelOpen] = useState(false)

  const isCancelled =
    subscription.status === 'cancelled' || subscription.cancelAtPeriodEnd

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Profile</h2>
        <p className="mt-1 text-sm text-muted">Account, subscription, and sign out</p>
      </div>

      <section className="space-y-4 rounded-lg border border-border bg-surface/80 p-4">
        <h3 className="text-sm font-medium text-foreground/90">Personal details</h3>

        <div className="space-y-2">
          <Label htmlFor="full-name">Full name</Label>
          <Input
            id="full-name"
            value={user.fullName}
            onChange={(e) => setUser({ fullName: e.target.value })}
            onBlur={(e) => {
              const trimmed = e.target.value.trim()
              if (trimmed !== user.fullName) setUser({ fullName: trimmed || 'Guest User' })
            }}
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user.email}
            readOnly
            disabled
            className={readOnlyInputClass}
            aria-readonly="true"
          />
          <p className="text-xs text-muted">
            Email is managed by your account and cannot be changed here.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            type="tel"
            value={user.phone ?? ''}
            onChange={(e) => setUser({ phone: e.target.value || undefined })}
            onBlur={(e) => {
              const trimmed = e.target.value.trim()
              setUser({ phone: trimmed || undefined })
            }}
            autoComplete="tel"
            placeholder="+1 555 000 0000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="business-name">Business name (optional)</Label>
          <Input
            id="business-name"
            value={user.businessName ?? ''}
            onChange={(e) => setUser({ businessName: e.target.value || undefined })}
            onBlur={(e) => {
              const trimmed = e.target.value.trim()
              setUser({ businessName: trimmed || undefined })
            }}
            autoComplete="organization"
            placeholder="Your company"
          />
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-surface/80 p-4">
        <h3 className="text-sm font-medium text-foreground/90">Subscription</h3>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-foreground">{subscription.planName} plan</p>
            <p className="mt-1 text-sm text-muted">
              {subscription.status === 'cancelled' ? (
                'Subscription ended'
              ) : subscription.cancelAtPeriodEnd ? (
                <>Cancels on {formatSubscriptionPeriodEnd(subscription.currentPeriodEnd)}</>
              ) : (
                <>
                  Active · renews {formatSubscriptionPeriodEnd(subscription.currentPeriodEnd)}
                </>
              )}
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
              subscription.status === 'cancelled'
                ? 'bg-surface-raised text-muted'
                : subscription.cancelAtPeriodEnd
                  ? 'bg-primary/15 text-primary'
                  : 'bg-secondary/20 text-primary',
            )}
          >
            {subscription.status === 'cancelled'
              ? 'Ended'
              : subscription.cancelAtPeriodEnd
                ? 'Cancelling'
                : 'Active'}
          </span>
        </div>

        {subscription.planId !== 'free' &&
          subscription.status === 'active' &&
          !subscription.cancelAtPeriodEnd && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-border text-foreground/90"
              onClick={() => setCancelOpen(true)}
            >
              Cancel subscription
            </Button>
          )}

        {isCancelled && subscription.status !== 'cancelled' && (
          <p className="text-xs text-muted">
            Pro features remain available until the end of your billing period.
          </p>
        )}
      </section>

      <Separator className="bg-border" />

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 border-border text-foreground/90"
        onClick={logout}
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Log out
      </Button>

      <CancelSubscriptionSheet
        open={cancelOpen}
        periodEnd={subscription.currentPeriodEnd}
        onOpenChange={setCancelOpen}
        onConfirm={cancelSubscription}
      />
    </div>
  )
}
