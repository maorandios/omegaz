-- Track whether a user has completed the in-app onboarding flow.
-- Existing profiles created before this migration are treated as already
-- onboarded so we don't force the form on current users.

alter table public.profiles
  add column if not exists onboarding_complete boolean not null default false;

update public.profiles
  set onboarding_complete = true
  where onboarding_complete = false
    and (
      coalesce(trim(full_name), '') <> ''
      and full_name <> 'User'
    );
