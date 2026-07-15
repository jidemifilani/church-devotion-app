-- Church Devotion App - fix first-admin bootstrap
-- Run after 0006_outreach.sql. Run with: supabase db push (or paste into the Supabase SQL editor)
--
-- prevent_unauthorized_role_change() called is_admin(), which reads auth.uid().
-- auth.uid() is NULL outside an authenticated app session, so the trigger blocked
-- role changes made from the Supabase SQL editor or a service-role connection too
-- - including the very first admin promotion the README's setup instructions ask
-- for. Only block the change when there IS an authenticated caller who isn't an
-- admin; leave SQL-editor/service-role changes (auth.uid() is null) unrestricted.

create or replace function public.prevent_unauthorized_role_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only admins can change a member''s role.';
  end if;
  return new;
end;
$$;
