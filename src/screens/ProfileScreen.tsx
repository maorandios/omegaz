import { LogOut, MessageCircleCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { CancelSubscriptionSheet } from '@/components/profile/CancelSubscriptionSheet'
import { DeleteAccountSheet } from '@/components/profile/DeleteAccountSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { openAppInviteWhatsApp } from '@/lib/appInvite'
import { isLocalAuthBypass } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { formatSubscriptionPeriodEnd } from '@/store/userTypes'

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

  const isCancelled =
    subscription.status === 'cancelled' || subscription.cancelAtPeriodEnd

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
              className={profileActionButtonClass}
              onClick={() => setCancelOpen(true)}
            >
              Cancel subscription
            </Button>
          )}

        {isCancelled && subscription.status !== 'cancelled' && (
          <p className="text-xs leading-relaxed text-muted">
            Pro features remain available until the end of your billing period.
          </p>
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
        onConfirm={cancelSubscription}
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
