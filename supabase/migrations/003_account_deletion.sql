-- Allow signed-in users to permanently delete their own account.
-- The function runs as security definer so it can remove the row from
-- auth.users (clients cannot touch the auth schema directly). Cascades on
-- public.profiles and public.projects clean up related rows automatically.

create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_user_account() from public;
grant execute on function public.delete_user_account() to authenticated;
