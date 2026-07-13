-- Church Devotion App - initial schema
-- Run with: supabase db push  (or paste into the Supabase SQL editor)

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('member', 'admin')),
  reminder_time time not null default '06:00:00',
  reminder_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- creates a profile row automatically whenever someone signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- helper used by policies below; security definer avoids recursive RLS checks
create function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create policy "profiles are viewable by the owner and admins"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles are updatable by the owner and admins"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

-- ---------------------------------------------------------------------------
-- devotions
-- ---------------------------------------------------------------------------
create table public.devotions (
  id uuid primary key default gen_random_uuid(),
  devotion_date date not null unique,
  title text not null,
  scripture_reference text not null,
  scripture_text text,
  body text not null,
  author text,
  image_url text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.devotions enable row level security;

create policy "devotions are viewable by any signed-in member"
  on public.devotions for select
  using (auth.role() = 'authenticated');

create policy "devotions are writable by admins only"
  on public.devotions for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- reading plans
-- ---------------------------------------------------------------------------
create table public.reading_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_image_url text,
  duration_days int not null check (duration_days > 0),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.reading_plans enable row level security;

create policy "reading plans are viewable by any signed-in member"
  on public.reading_plans for select
  using (auth.role() = 'authenticated');

create policy "reading plans are writable by admins only"
  on public.reading_plans for all
  using (public.is_admin())
  with check (public.is_admin());

create table public.reading_plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.reading_plans (id) on delete cascade,
  day_number int not null check (day_number > 0),
  title text,
  scripture_reference text,
  content text not null,
  unique (plan_id, day_number)
);

alter table public.reading_plan_days enable row level security;

create policy "reading plan days are viewable by any signed-in member"
  on public.reading_plan_days for select
  using (auth.role() = 'authenticated');

create policy "reading plan days are writable by admins only"
  on public.reading_plan_days for all
  using (public.is_admin())
  with check (public.is_admin());

create table public.user_plan_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.reading_plans (id) on delete cascade,
  current_day int not null default 1,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, plan_id)
);

alter table public.user_plan_progress enable row level security;

create policy "users manage their own plan progress"
  on public.user_plan_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- bookmarks
-- ---------------------------------------------------------------------------
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  devotion_id uuid not null references public.devotions (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, devotion_id)
);

alter table public.bookmarks enable row level security;

create policy "users manage their own bookmarks"
  on public.bookmarks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- prayer requests
-- ---------------------------------------------------------------------------
create table public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  display_name text,
  is_anonymous boolean not null default false,
  content text not null,
  status text not null default 'active' check (status in ('active', 'answered')),
  prayer_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.prayer_requests enable row level security;

create policy "prayer requests are viewable by any signed-in member"
  on public.prayer_requests for select
  using (auth.role() = 'authenticated');

create policy "members create their own prayer requests"
  on public.prayer_requests for insert
  with check (auth.uid() = user_id);

create policy "owners and admins update or delete prayer requests"
  on public.prayer_requests for update
  using (auth.uid() = user_id or public.is_admin());

create policy "owners and admins delete prayer requests"
  on public.prayer_requests for delete
  using (auth.uid() = user_id or public.is_admin());

create table public.prayer_interactions (
  id uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null references public.prayer_requests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (prayer_request_id, user_id)
);

alter table public.prayer_interactions enable row level security;

create policy "prayer interactions are viewable by any signed-in member"
  on public.prayer_interactions for select
  using (auth.role() = 'authenticated');

create policy "members manage their own prayer interactions"
  on public.prayer_interactions for insert
  with check (auth.uid() = user_id);

create policy "members remove their own prayer interactions"
  on public.prayer_interactions for delete
  using (auth.uid() = user_id);

-- keep prayer_count in sync
create function public.handle_prayer_interaction_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.prayer_requests set prayer_count = prayer_count + 1 where id = new.prayer_request_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.prayer_requests set prayer_count = greatest(prayer_count - 1, 0) where id = old.prayer_request_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_prayer_interaction_change
  after insert or delete on public.prayer_interactions
  for each row execute procedure public.handle_prayer_interaction_change();

-- ---------------------------------------------------------------------------
-- hymns
-- ---------------------------------------------------------------------------
create table public.hymns (
  id uuid primary key default gen_random_uuid(),
  number int unique,
  title text not null,
  lyrics text not null,
  author text,
  category text,
  audio_url text,
  created_at timestamptz not null default now()
);

alter table public.hymns enable row level security;

create policy "hymns are viewable by any signed-in member"
  on public.hymns for select
  using (auth.role() = 'authenticated');

create policy "hymns are writable by admins only"
  on public.hymns for all
  using (public.is_admin())
  with check (public.is_admin());

create table public.hymn_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  hymn_id uuid not null references public.hymns (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, hymn_id)
);

alter table public.hymn_favorites enable row level security;

create policy "users manage their own hymn favorites"
  on public.hymn_favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- push tokens (one row per device)
-- ---------------------------------------------------------------------------
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null,
  device_type text,
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

alter table public.push_tokens enable row level security;

create policy "users manage their own push tokens"
  on public.push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
