-- Church Devotion App - outreach & ministry (announcements, sermons, ministries, church info, giving)
-- Run after 0005_roles.sql. Run with: supabase db push (or paste into the Supabase SQL editor)

-- ---------------------------------------------------------------------------
-- announcements / events
-- ---------------------------------------------------------------------------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  event_date timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

create policy "announcements are viewable by any signed-in member"
  on public.announcements for select
  using (auth.role() = 'authenticated');

create policy "announcements are writable by editors and admins"
  on public.announcements for all
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

-- ---------------------------------------------------------------------------
-- sermon archive
-- ---------------------------------------------------------------------------
create table public.sermons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  speaker text,
  sermon_date date not null,
  description text,
  audio_url text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.sermons enable row level security;

create policy "sermons are viewable by any signed-in member"
  on public.sermons for select
  using (auth.role() = 'authenticated');

create policy "sermons are writable by editors and admins"
  on public.sermons for all
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

-- ---------------------------------------------------------------------------
-- ministries / small groups directory (read-only for members in v1)
-- ---------------------------------------------------------------------------
create table public.ministries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  leader_name text,
  leader_contact text,
  meeting_schedule text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.ministries enable row level security;

create policy "ministries are viewable by any signed-in member"
  on public.ministries for select
  using (auth.role() = 'authenticated');

create policy "ministries are writable by editors and admins"
  on public.ministries for all
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

-- ---------------------------------------------------------------------------
-- church info (singleton) + staff directory + giving placeholder
-- ---------------------------------------------------------------------------
create table public.church_info (
  id int primary key default 1 check (id = 1),
  name text not null default '',
  address text,
  service_times text,
  phone text,
  email text,
  website text,
  map_url text,
  updated_at timestamptz not null default now()
);

insert into public.church_info (id) values (1);

alter table public.church_info enable row level security;

create policy "church info is viewable by any signed-in member"
  on public.church_info for select
  using (auth.role() = 'authenticated');

create policy "church info is writable by editors and admins"
  on public.church_info for update
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role_title text,
  photo_url text,
  email text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.staff_members enable row level security;

create policy "staff members are viewable by any signed-in member"
  on public.staff_members for select
  using (auth.role() = 'authenticated');

create policy "staff members are writable by editors and admins"
  on public.staff_members for all
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

create table public.giving_settings (
  id int primary key default 1 check (id = 1),
  giving_url text,
  note text,
  updated_at timestamptz not null default now()
);

insert into public.giving_settings (id) values (1);

alter table public.giving_settings enable row level security;

create policy "giving settings are viewable by any signed-in member"
  on public.giving_settings for select
  using (auth.role() = 'authenticated');

create policy "giving settings are writable by editors and admins"
  on public.giving_settings for update
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());
