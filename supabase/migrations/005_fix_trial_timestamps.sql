-- Fix iOS Safari trial-locked bug.
--
-- `004_trial_subscription.sql` stored trial timestamps as
-- `(now() + interval '14 days')::text`, which Postgres serializes as
-- `YYYY-MM-DD HH:MM:SS.fff+TZ` (note the SPACE between date and time).
-- iOS Safari refuses to parse that, so `new Date(value)` returns NaN, which
-- made `entitlementFor()` treat brand-new mobile users as `'locked'`.
--
-- The fix is to drop the `::text` cast so jsonb_build_object serializes the
-- timestamp via to_jsonb, producing proper ISO 8601 (`YYYY-MM-DDTHH:MM:SS...`).

-- 1. New column default with ISO-safe serialization.
alter table public.profiles
  alter column subscription set default jsonb_build_object(
    'planId', 'pro',
    'status', 'trial',
    'trialEndsAt', now() + interval '14 days',
    'cancelAtPeriodEnd', false,
    'currentPeriodEnd', now() + interval '14 days'
  );

-- 2. Re-create handle_new_user without the broken `::text` cast.
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
      'trialEndsAt', now() + interval '14 days',
      'cancelAtPeriodEnd', false,
      'currentPeriodEnd', now() + interval '14 days'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3. Surgical backfill: rewrite any existing space-separated timestamps to
-- ISO format in-place. Only touches rows that actually have the bad format
-- so trial countdowns are preserved as-is.
update public.profiles
set subscription = jsonb_set(
  jsonb_set(
    subscription,
    '{trialEndsAt}',
    to_jsonb(replace(subscription ->> 'trialEndsAt', ' ', 'T'))
  ),
  '{currentPeriodEnd}',
  to_jsonb(replace(subscription ->> 'currentPeriodEnd', ' ', 'T'))
)
where (subscription ->> 'trialEndsAt') ~ '\d\s\d'
   or (subscription ->> 'currentPeriodEnd') ~ '\d\s\d';
