import { useEffect, useRef, useState } from 'react'
import { ScreenStack, type StackDirection } from '@/components/shell/ScreenStack'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/store/appStore'

const APP_LOGO_SRC = '/segments-logo.svg'

const STEP_KEYS = ['fullName', 'businessName', 'phone'] as const
type StepKey = (typeof STEP_KEYS)[number]

function onboardingStackDirection(fromKey: string, toKey: string): StackDirection {
  const fromIndex = STEP_KEYS.indexOf(fromKey as StepKey)
  const toIndex = STEP_KEYS.indexOf(toKey as StepKey)
  if (fromIndex === -1 || toIndex === -1) return 'forward'
  return toIndex > fromIndex ? 'forward' : 'back'
}

interface StepShellProps {
  title: string
  description?: string
  inputId: string
  inputLabel: string
  inputPlaceholder: string
  inputType?: 'text' | 'tel'
  inputMode?: 'text' | 'tel'
  autoComplete?: string
  value: string
  onChange: (next: string) => void
  onSubmit: () => void
  primaryLabel: string
  secondaryLabel?: string
  onSecondary?: () => void
  primaryDisabled?: boolean
  primaryLoading?: boolean
  error?: string | null
  active: boolean
}

function StepShell({
  title,
  description,
  inputId,
  inputLabel,
  inputPlaceholder,
  inputType = 'text',
  inputMode,
  autoComplete,
  value,
  onChange,
  onSubmit,
  primaryLabel,
  secondaryLabel,
  onSecondary,
  primaryDisabled,
  primaryLoading,
  error,
  active,
}: StepShellProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!active) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 220)
    return () => window.clearTimeout(t)
  }, [active])

  return (
    <form
      className="flex h-full w-full flex-1 flex-col items-center justify-center px-4 py-8"
      onSubmit={(e) => {
        e.preventDefault()
        if (!primaryDisabled && !primaryLoading) onSubmit()
      }}
    >
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>

        <div className="form-field mt-7 w-full text-left">
          <Label htmlFor={inputId} className="text-center">
            {inputLabel}
          </Label>
          <Input
            ref={inputRef}
            id={inputId}
            type={inputType}
            inputMode={inputMode}
            autoComplete={autoComplete}
            placeholder={inputPlaceholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="text-center"
          />
        </div>

        {description ? (
          <p className="mt-4 text-sm leading-relaxed text-muted">{description}</p>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-7 flex w-full flex-col items-center gap-2">
          <Button
            type="submit"
            className="h-12 w-full rounded-2xl text-base font-semibold"
            disabled={primaryDisabled || primaryLoading}
          >
            {primaryLoading ? 'Saving…' : primaryLabel}
          </Button>
          {secondaryLabel && onSecondary ? (
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full rounded-2xl text-sm text-muted hover:text-foreground"
              onClick={onSecondary}
              disabled={primaryLoading}
            >
              {secondaryLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  )
}

export function OnboardingScreen() {
  const currentUser = useAppStore((s) => s.user)
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)

  const [stepKey, setStepKey] = useState<StepKey>('fullName')
  const [fullName, setFullName] = useState(() =>
    currentUser.fullName && currentUser.fullName !== 'User' && currentUser.fullName !== 'Guest User'
      ? currentUser.fullName
      : '',
  )
  const [businessName, setBusinessName] = useState(currentUser.businessName ?? '')
  const [phone, setPhone] = useState(currentUser.phone ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const stepIndex = STEP_KEYS.indexOf(stepKey)
  const progressPct = ((stepIndex + 1) / STEP_KEYS.length) * 100

  const handleNameSubmit = () => {
    if (!fullName.trim()) {
      setNameError('Enter your full name.')
      return
    }
    setNameError(null)
    setStepKey('businessName')
  }

  const goToPhone = () => {
    setError(null)
    setStepKey('phone')
  }

  const handleFinish = async () => {
    setError(null)
    setSubmitting(true)
    try {
      await completeOnboarding({
        fullName: fullName.trim(),
        businessName: businessName.trim() ? businessName.trim() : undefined,
        phone: phone.trim() ? phone.trim() : undefined,
      })
    } catch (err) {
      console.error('Failed to complete onboarding', err)
      setError(err instanceof Error ? err.message : 'Could not save your profile. Try again.')
      setSubmitting(false)
    }
  }

  const screens: Record<StepKey, React.ReactNode> = {
    fullName: (
      <StepShell
        active={stepKey === 'fullName'}
        title="What's your full name?"
        inputId="onboarding-full-name"
        inputLabel="Full name"
        inputPlaceholder="Jane Smith"
        autoComplete="name"
        value={fullName}
        onChange={(v) => {
          setFullName(v)
          if (nameError) setNameError(null)
        }}
        onSubmit={handleNameSubmit}
        primaryLabel="Continue"
        primaryDisabled={!fullName.trim()}
        error={nameError}
      />
    ),
    businessName: (
      <StepShell
        active={stepKey === 'businessName'}
        title="Your business name"
        description="Optional, but recommended — it appears on every PDF drawing you generate so fabricators know who the request is from."
        inputId="onboarding-business-name"
        inputLabel="Business name (optional)"
        inputPlaceholder="Smith Metalworks"
        autoComplete="organization"
        value={businessName}
        onChange={setBusinessName}
        onSubmit={goToPhone}
        primaryLabel="Continue"
        primaryDisabled={!businessName.trim()}
        secondaryLabel="Skip for now"
        onSecondary={goToPhone}
      />
    ),
    phone: (
      <StepShell
        active={stepKey === 'phone'}
        title="Your phone number"
        description="Optional, but recommended — fabricators will see it on your drawings so they can call back with questions."
        inputId="onboarding-phone"
        inputLabel="Phone (optional)"
        inputPlaceholder="+44 7700 900123"
        inputType="tel"
        inputMode="tel"
        autoComplete="tel"
        value={phone}
        onChange={setPhone}
        onSubmit={() => void handleFinish()}
        primaryLabel="Enter Segments"
        primaryDisabled={!phone.trim()}
        secondaryLabel="Skip for now"
        onSecondary={() => {
          setPhone('')
          void handleFinish()
        }}
        primaryLoading={submitting}
        error={error}
      />
    ),
  }

  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <div className="flex w-full flex-col items-center px-4 pt-8">
        <img
          src={APP_LOGO_SRC}
          alt="Segments"
          className="h-[2.25rem] w-auto max-w-[12rem] object-contain"
          height={36}
          width={140}
        />
        <div className="mt-6 w-full max-w-sm">
          <div
            className="h-0.5 w-full overflow-hidden rounded-full bg-surface"
            role="progressbar"
            aria-valuenow={stepIndex + 1}
            aria-valuemin={1}
            aria-valuemax={STEP_KEYS.length}
            aria-label={`Step ${stepIndex + 1} of ${STEP_KEYS.length}`}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-center text-xs font-medium uppercase tracking-wider text-muted">
            Step {stepIndex + 1} of {STEP_KEYS.length}
          </p>
        </div>
      </div>

      <div className="relative mt-2 flex min-h-0 flex-1">
        <ScreenStack
          activeKey={stepKey}
          getDirection={onboardingStackDirection}
          screens={screens}
          className="h-full min-h-0 flex-1"
        />
      </div>
    </div>
  )
}
