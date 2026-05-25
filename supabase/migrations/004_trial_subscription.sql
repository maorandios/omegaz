-- 14-day Pro trial on signup + backfill existing users with a fresh trial.
--
-- Adds the PayPal-specific fields to the subscription JSONB shape and shifts
-- new signups from "Pro forever" to a 14-day trial. Existing rows that have
-- never been billed (everyone, since payment isn't wired yet) are reset to a
-- trial starting now so the new paywall applies uniformly.

-- 1. New default for the `subscription` JSONB column on profiles.
alter table public.profiles
  alter column subscription set default jsonb_build_object(
    'planId', 'pro',
    'status', 'trial',
    'trialEndsAt', (now() + interval '14 days')::text,
    'cancelAtPeriodEnd', false,
    'currentPeriodEnd', (now() + interval '14 days')::text
  );

-- 2. Replace handle_new_user so the seed row reflects the trial.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, subscription)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'User'
    ),
    jsonb_build_object(
      'planId', 'pro',
      'status', 'trial',
      'trialEndsAt', (now() + interval '14 days')::text,
      'cancelAtPeriodEnd', false,
      'currentPeriodEnd', (now() + interval '14 days')::text
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3. One-time backfill: anyone currently sitting on the legacy "active Pro
-- with no provider" state was never actually billed, so move them onto a
-- fresh 14-day trial. Real paid subscriptions (provider='paypal') are left
-- untouched.
update public.profiles
set subscription = jsonb_build_object(
  'planId', 'pro',
  'status', 'trial',
  'trialEndsAt', (now() + interval '14 days')::text,
  'cancelAtPeriodEnd', false,
  'currentPeriodEnd', (now() + interval '14 days')::text
)
where coalesce(subscription ->> 'provider', '') <> 'paypal';
