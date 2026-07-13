-- Church Devotion App - granular admin roles (member/editor/moderator/admin)
-- Run after 0004_personalization.sql. Run with: supabase db push (or paste into the Supabase SQL editor)

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('member', 'editor', 'moderator', 'admin'));

-- editor: content (devotions/plans/hymns/tags). moderator: prayer wall moderation.
-- admin: everything, including role management. all security definer to avoid recursive RLS.
create function public.is_editor_or_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('editor', 'admin')
  );
$$;

create function public.is_moderator_or_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin')
  );
$$;

-- content tables: admin-only writes widen to editor-or-admin
drop policy "devotions are writable by admins only" on public.devotions;
create policy "devotions are writable by editors and admins"
  on public.devotions for all
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

drop policy "reading plans are writable by admins only" on public.reading_plans;
create policy "reading plans are writable by editors and admins"
  on public.reading_plans for all
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

drop policy "reading plan days are writable by admins only" on public.reading_plan_days;
create policy "reading plan days are writable by editors and admins"
  on public.reading_plan_days for all
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

drop policy "hymns are writable by admins only" on public.hymns;
create policy "hymns are writable by editors and admins"
  on public.hymns for all
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

drop policy "scripture versions are writable by admins only" on public.devotion_scripture_versions;
create policy "scripture versions are writable by editors and admins"
  on public.devotion_scripture_versions for all
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

drop policy "tags are writable by admins only" on public.tags;
create policy "tags are writable by editors and admins"
  on public.tags for all
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

drop policy "devotion tags are writable by admins only" on public.devotion_tags;
create policy "devotion tags are writable by editors and admins"
  on public.devotion_tags for all
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

drop policy "plan tags are writable by admins only" on public.plan_tags;
create policy "plan tags are writable by editors and admins"
  on public.plan_tags for all
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

-- prayer moderation: admin-only widens to moderator-or-admin
drop policy "owners and admins update or delete prayer requests" on public.prayer_requests;
create policy "owners and moderators update prayer requests"
  on public.prayer_requests for update
  using (auth.uid() = user_id or public.is_moderator_or_admin());

drop policy "owners and admins delete prayer requests" on public.prayer_requests;
create policy "owners and moderators delete prayer requests"
  on public.prayer_requests for delete
  using (auth.uid() = user_id or public.is_moderator_or_admin());

drop policy "admins view and manage prayer reports" on public.prayer_reports;
create policy "moderators view prayer reports"
  on public.prayer_reports for select
  using (public.is_moderator_or_admin());

drop policy "admins update prayer reports" on public.prayer_reports;
create policy "moderators update prayer reports"
  on public.prayer_reports for update
  using (public.is_moderator_or_admin());

-- security fix: the existing "owner or admin" update policy has no WITH CHECK,
-- so a signed-in member could call the API directly and set their own role to
-- 'admin' (the app UI never exposes this, but RLS itself didn't block it).
-- Only an existing admin may change the `role` column; everyone else can still
-- update their own non-role fields (name, avatar, reminder/theme/locale prefs).
create function public.prevent_unauthorized_role_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change a member''s role.';
  end if;
  return new;
end;
$$;

create trigger before_profile_role_change
  before update on public.profiles
  for each row execute procedure public.prevent_unauthorized_role_change();
