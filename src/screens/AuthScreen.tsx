import { Mail } from 'lucide-react'
import { useState } from 'react'
import { GoogleIcon } from '@/components/auth/GoogleIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isValidEmailForMagicLink } from '@/lib/authUser'
import { isLocalAuthBypass, isSupabaseConfigured } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

const APP_LOGO_SRC = '/segments-logo.svg'

const authCardClass = 'rounded-2xl border border-border bg-surface/40 px-4 py-5'

const authButtonClass = 'h-12 w-full rounded-2xl text-base font-semibold'

export function AuthScreen() {
  const magicLinkSent = useAuthStore((s) => s.magicLinkSent)
  const authError = useAuthStore((s) => s.authError)
  const loadingAction = useAuthStore((s) => s.loadingAction)
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)
  const sendMagicLink = useAuthStore((s) => s.sendMagicLink)
  const resetMagicLinkState = useAuthStore((s) => s.resetMagicLinkState)
  const clearAuthError = useAuthStore((s) => s.clearAuthError)
  const continueLocalDev = useAuthStore((s) => s.continueLocalDev)

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)

  const isDevPreview = isLocalAuthBypass && !isSupabaseConfigured

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isDevPreview) return
    clearAuthError()
    const trimmed = email.trim()
    if (!isValidEmailForMagicLink(trimmed)) {
      setEmailError('Enter a valid email address.')
      return
    }
    setEmailError(null)
    await sendMagicLink(trimmed)
  }

  const signInForm = (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn(authButtonClass, 'gap-3 border-border bg-surface/25')}
        onClick={() => void signInWithGoogle()}
        disabled={isDevPreview || loadingAction != null}
      >
        <GoogleIcon className="h-5 w-5 shrink-0" />
        {loadingAction === 'google' ? 'Opening Google…' : 'Continue with Google'}
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" aria-hidden />
        <span className="text-xs font-medium uppercase tracking-wider text-muted">or</span>
        <div className="h-px flex-1 bg-border" aria-hidden />
      </div>

      <form className="space-y-3" onSubmit={(e) => void handleMagicLink(e)}>
        <div className="form-field">
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setEmailError(null)
              clearAuthError()
            }}
            disabled={isDevPreview || loadingAction != null}
          />
        </div>
        {(emailError || authError) && (
          <p className="text-sm text-destructive" role="alert">
            {emailError ?? authError}
          </p>
        )}
        <Button
          type="submit"
          className={authButtonClass}
          disabled={isDevPreview || loadingAction != null || !email.trim()}
        >
          {loadingAction === 'magic-link' ? 'Sending link…' : 'Send magic link'}
        </Button>
      </form>

      <p className="text-center text-xs leading-relaxed text-muted">
        No password needed — we email you a one-time sign-in link.
      </p>
    </>
  )

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center text-center">
          <img
            src={APP_LOGO_SRC}
            alt="Segments"
            className="h-[2.75rem] w-auto max-w-[14rem] object-contain"
            height={44}
            width={168}
          />
          <p className="mt-5 max-w-[18rem] text-sm leading-relaxed text-muted">
            Sign in to save projects and pick up where you left off.
          </p>
        </div>

        <section className={cn(authCardClass, 'space-y-4')}>
          {isDevPreview ? (
            <>
              <p className="rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-center text-xs leading-relaxed text-muted">
                Local preview — add your Supabase URL and anon key to{' '}
                <span className="font-mono text-foreground/80">.env.local</span> (same as Vercel),
                restart <span className="font-mono text-foreground/80">npm run dev</span>, then
                Google and magic-link sign-in work here too.
              </p>
              {signInForm}
              <Button type="button" className={authButtonClass} onClick={continueLocalDev}>
                Continue locally (dev)
              </Button>
            </>
          ) : magicLinkSent ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                <Mail className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Check your email</p>
                <p className="text-sm leading-relaxed text-muted">
                  We sent a sign-in link to{' '}
                  <span className="font-medium text-foreground">{email.trim()}</span>. Open it on
                  this device to continue.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full rounded-2xl text-sm text-muted hover:text-foreground"
                onClick={() => {
                  resetMagicLinkState()
                  setEmailError(null)
                }}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            signInForm
          )}
        </section>
      </div>
    </div>
  )
}
