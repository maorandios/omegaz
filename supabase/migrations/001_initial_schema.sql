-- Segments: profiles + projects (plates stored as JSONB per project)

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  phone text,
  business_name text,
  subscription jsonb not null default jsonb_build_object(
    'planId', 'pro',
    'planName', 'Pro',
    'status', 'active',
    'cancelAtPeriodEnd', false,
    'currentPeriodEnd', (now() + interval '1 month')::text
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  serial text not null,
  name text not null,
  weight_kg numeric not null default 0,
  plates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_user_id_updated_at_idx
  on public.projects (user_id, updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'User'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;

create policy profiles_select_own
  on public.profiles
  for select
  using (id = auth.uid());

create policy profiles_insert_own
  on public.profiles
  for insert
  with check (id = auth.uid());

create policy profiles_update_own
  on public.profiles
  for update
  using (id = auth.uid());

create policy projects_select_own
  on public.projects
  for select
  using (user_id = auth.uid());

create policy projects_insert_own
  on public.projects
  for insert
  with check (user_id = auth.uid());

create policy projects_update_own
  on public.projects
  for update
  using (user_id = auth.uid());

create policy projects_delete_own
  on public.projects
  for delete
  using (user_id = auth.uid());
