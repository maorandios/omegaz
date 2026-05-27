-- Per-user saved plate presets (favourites) for quick reuse in Create plate.

create table public.plate_favorites (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  selected_template text,
  fingerprint text not null,
  profile jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index plate_favorites_user_id_updated_at_idx
  on public.plate_favorites (user_id, updated_at desc);

create unique index plate_favorites_user_fingerprint_idx
  on public.plate_favorites (user_id, fingerprint);

create trigger plate_favorites_set_updated_at
  before update on public.plate_favorites
  for each row
  execute function public.set_updated_at();

alter table public.plate_favorites enable row level security;

create policy plate_favorites_select_own
  on public.plate_favorites
  for select
  using (user_id = auth.uid());

create policy plate_favorites_insert_own
  on public.plate_favorites
  for insert
  with check (user_id = auth.uid());

create policy plate_favorites_update_own
  on public.plate_favorites
  for update
  using (user_id = auth.uid());

create policy plate_favorites_delete_own
  on public.plate_favorites
  for delete
  using (user_id = auth.uid());
