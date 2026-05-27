import { Lock, LogOut, MessageCircleCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PaypalIcon } from '@/components/icons/PaypalIcon'
import { CancelSubscriptionSheet } from '@/components/profile/CancelSubscriptionSheet'
import { DeleteAccountSheet } from '@/components/profile/DeleteAccountSheet'
import { UpgradeSubscriptionSheet } from '@/components/profile/UpgradeSubscriptionSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTrialCountdown } from '@/hooks/useTrialCountdown'
import { openAppInviteWhatsApp } from '@/lib/appInvite'
import { PRO_PRICE_LABEL, TRIAL_DAYS } from '@/lib/pricing'
import { isLocalAuthBypass } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import {
  entitlementFor,
  formatSubscriptionPeriodEnd,
  trialCountdownBadgeText,
  trialCountdownSubtext,
} from '@/store/userTypes'

const readOnlyInputClass =
  'cursor-default border-border bg-surface/25 text-muted focus-visible:ring-0'

const profileCardClass =
  'rounded-2xl border border-border bg-surface/40 px-4 py-4.5'

const profileActionButtonClass =
  'h-12 w-full rounded-2xl border-border text-base font-semibold text-foreground/90'

export function ProfileScreen() {
  const user = useAppStore((s) => s.user)
  const subscription = useAppStore((s) => s.subscription)
  const setUser = useAppStore((s) => s.setUser)
  const cancelSubscription = useAppStore((s) => s.cancelSubscription)
  const logout = useAppStore((s) => s.logout)
  const deleteAccount = useAppStore((s) => s.deleteAccount)
  const showSignInScreen = useAuthStore((s) => s.showSignInScreen)

  const [cancelOpen, setCancelOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDeleteConfirm = async () => {
    setDeleteError(null)
    setDeleteLoading(true)
    try {
      await deleteAccount()
      setDeleteOpen(false)
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Could not delete account. Please try again.',
      )
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteOpenChange = (open: boolean) => {
    if (deleteLoading) return
    setDeleteOpen(open)
    if (!open) setDeleteError(null)
  }

  const entitlement = entitlementFor(subscription)
  const isTrial = entitlement === 'trial'
  const isLocked = entitlement === 'locked'
  const isPaid = entitlement === 'paid'
  const isCancelling = isPaid && subscription.cancelAtPeriodEnd
  const trialDays = useTrialCountdown(subscription) ?? 0

  const badge = (() => {
    if (isLocked) {
      return { label: 'Trial ended', className: 'bg-warning/15 text-warning' }
    }
    if (isTrial && trialDays > 0) {
      return {
        label: trialCountdownBadgeText(trialDays),
        className: 'bg-warning/15 text-warning',
      }
    }
    if (isCancelling) {
      return { label: 'Cancelled', className: 'bg-primary/15 text-primary' }
    }
    return { label: 'Active', className: 'bg-secondary/20 text-primary' }
  })()

  const renewLine = (() => {
    if (isLocked) {
      return 'Your free trial has ended. Subscribe to keep building.'
    }
    if (isTrial) {
      return `Free trial · ends ${formatSubscriptionPeriodEnd(
        subscription.trialEndsAt ?? subscription.currentPeriodEnd,
      )}`
    }
    if (isCancelling) {
      return `Cancels on ${formatSubscriptionPeriodEnd(subscription.currentPeriodEnd)}`
    }
    return `Active · renews ${formatSubscriptionPeriodEnd(subscription.currentPeriodEnd)}`
  })()

  return (
    <div className="space-y-3 pb-2">
      <section className={cn(profileCardClass, 'space-y-4')}>
        <h3 className="text-sm font-semibold text-foreground">Personal details</h3>

        <div className="form-stack">
          <div className="form-field">
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

          <div className="form-field">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              readOnly
              className={readOnlyInputClass}
              aria-readonly="true"
            />
            <p className="text-xs leading-relaxed text-muted">
              Email is managed by your account and cannot be changed here.
            </p>
          </div>

          <div className="form-field">
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
              placeholder="+44 7700 900123"
            />
          </div>

          <div className="form-field">
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
        </div>
      </section>

      <section className={cn(profileCardClass, 'space-y-4')}>
        <h3 className="text-sm font-semibold text-foreground">Invite</h3>
        <p className="text-sm leading-relaxed text-muted">
          Share Segments with colleagues so they can start their own fabrication projects.
        </p>
        <Button
          type="button"
          variant="outline"
          className={cn(profileActionButtonClass, 'gap-2')}
          onClick={openAppInviteWhatsApp}
        >
          <MessageCircleCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          Share via WhatsApp
        </Button>
      </section>

      <section className={cn(profileCardClass, 'space-y-4')}>
        <h3 className="text-sm font-semibold text-foreground">Subscription</h3>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-foreground">
              {subscription.planName} plan
              <span className="ml-2 text-sm font-medium text-muted">
                {PRO_PRICE_LABEL}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted">{renewLine}</p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
              badge.className,
            )}
          >
            {badge.label}
          </span>
        </div>

        {isTrial && trialDays > 0 ? (
          <div
            className="rounded-2xl border border-warning/25 bg-warning/10 px-4 py-5 text-center"
            role="status"
            aria-live="polite"
            aria-label={trialCountdownSubtext(trialDays)}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-warning/90">
              Free trial — days remaining
            </p>
            <p className="mt-2 text-6xl font-bold tabular-nums leading-none text-warning">
              {trialDays}
            </p>
            <p className="mt-2 text-sm text-warning/90">{trialCountdownSubtext(trialDays)}</p>
            <p className="mt-1 text-xs text-muted">
              Ends{' '}
              {formatSubscriptionPeriodEnd(
                subscription.trialEndsAt ?? subscription.currentPeriodEnd,
              )}{' '}
              · {TRIAL_DAYS}-day trial
            </p>
          </div>
        ) : null}

        {isLocked ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-3 py-3 text-warning">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div className="space-y-1">
              <p className="text-sm font-semibold">Workspace Locked</p>
              <p className="text-xs leading-relaxed text-warning/85">
                Your 14-day free trial has expired. To resume editing your existing
                profiles and access the profile creation tool, please activate your
                subscription.
              </p>
            </div>
          </div>
        ) : null}

        {(isTrial || isLocked) && (
          <Button
            type="button"
            className="h-12 w-full gap-2 rounded-2xl text-base font-semibold"
            onClick={() => setUpgradeOpen(true)}
          >
            <PaypalIcon className="h-5 w-5 shrink-0" />
            Subscribe via PayPal
          </Button>
        )}

        {isPaid && !isCancelling && (
          <Button
            type="button"
            variant="outline"
            className={profileActionButtonClass}
            onClick={() => setCancelOpen(true)}
          >
            Cancel subscription
          </Button>
        )}

        {isCancelling && (
          <div className="space-y-3">
            <Button
              type="button"
              className="h-12 w-full rounded-2xl text-base font-semibold"
              onClick={() => setUpgradeOpen(true)}
            >
              Resume subscription
            </Button>
            <p className="text-xs leading-relaxed text-muted">
              Pro features remain available until the end of your billing period.
              Resuming starts a new monthly subscription.
            </p>
          </div>
        )}
      </section>

      <section className={cn(profileCardClass, 'space-y-3')}>
        {isLocalAuthBypass ? (
          <Button
            type="button"
            variant="outline"
            className={profileActionButtonClass}
            onClick={showSignInScreen}
          >
            View sign-in screen
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className={cn(
            profileActionButtonClass,
            'gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive',
          )}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
          Delete account
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(profileActionButtonClass, 'gap-2')}
          onClick={logout}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          Log out
        </Button>
      </section>

      <CancelSubscriptionSheet
        open={cancelOpen}
        periodEnd={subscription.currentPeriodEnd}
        onOpenChange={setCancelOpen}
        onConfirm={() => {
          void cancelSubscription()
        }}
      />

      <UpgradeSubscriptionSheet
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
      />

      <DeleteAccountSheet
        open={deleteOpen}
        loading={deleteLoading}
        error={deleteError}
        onOpenChange={handleDeleteOpenChange}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </div>
  )
}
