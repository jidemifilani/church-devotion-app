-- Church Devotion App - engagement features (streaks, drafts, translations, tags, highlights)
-- Run after 0001_init.sql. Run with: supabase db push (or paste into the Supabase SQL editor)

-- ---------------------------------------------------------------------------
-- devotions: draft/publish workflow, multi-language content, audio narration
-- ---------------------------------------------------------------------------
alter table public.devotions add column status text not null default 'published' check (status in ('draft', 'published'));
alter table public.devotions add column published_at timestamptz;
alter table public.devotions add column language text not null default 'en' check (language in ('en', 'fr', 'yo', 'ig', 'ha'));
alter table public.devotions add column audio_url text;

update public.devotions set published_at = created_at where status = 'published';

alter table public.devotions drop constraint devotions_devotion_date_key;
alter table public.devotions add constraint devotions_date_language_key unique (devotion_date, language);

drop policy "devotions are viewable by any signed-in member" on public.devotions;
create policy "published devotions are viewable by any signed-in member"
  on public.devotions for select
  using (auth.role() = 'authenticated' and (status = 'published' or public.is_admin()));

-- ---------------------------------------------------------------------------
-- multiple bible translations per devotion (admin-authored, not machine-translated)
-- ---------------------------------------------------------------------------
create table public.devotion_scripture_versions (
  id uuid primary key default gen_random_uuid(),
  devotion_id uuid not null references public.devotions (id) on delete cascade,
  translation_code text not null,
  translation_name text not null,
  scripture_text text not null,
  created_at timestamptz not null default now(),
  unique (devotion_id, translation_code)
);

alter table public.devotion_scripture_versions enable row level security;

create policy "scripture versions are viewable by any signed-in member"
  on public.devotion_scripture_versions for select
  using (auth.role() = 'authenticated');

create policy "scripture versions are writable by admins only"
  on public.devotion_scripture_versions for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- reading streaks
-- ---------------------------------------------------------------------------
alter table public.profiles add column current_streak int not null default 0;
alter table public.profiles add column longest_streak int not null default 0;
alter table public.profiles add column last_read_date date;

create table public.devotion_reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  devotion_id uuid not null references public.devotions (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, devotion_id)
);

alter table public.devotion_reads enable row level security;

create policy "users manage their own devotion reads"
  on public.devotion_reads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- records a read and updates the caller's streak; security definer so it can
-- update profiles.current_streak/longest_streak without a separate update policy
create function public.record_devotion_read(p_devotion_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_last date;
begin
  insert into public.devotion_reads (user_id, devotion_id)
  values (v_user, p_devotion_id)
  on conflict (user_id, devotion_id) do nothing;

  select last_read_date into v_last from public.profiles where id = v_user;

  if v_last = current_date then
    return;
  elsif v_last = current_date - 1 then
    update public.profiles
      set current_streak = current_streak + 1,
          longest_streak = greatest(longest_streak, current_streak + 1),
          last_read_date = current_date
      where id = v_user;
  else
    update public.profiles
      set current_streak = 1,
          longest_streak = greatest(longest_streak, 1),
          last_read_date = current_date
      where id = v_user;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- verse highlighting (tap-to-toggle segment, not free-text annotation)
-- ---------------------------------------------------------------------------
create table public.devotion_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  devotion_id uuid not null references public.devotions (id) on delete cascade,
  segment_index int not null,
  color text not null default 'yellow',
  created_at timestamptz not null default now(),
  unique (user_id, devotion_id, segment_index)
);

alter table public.devotion_highlights enable row level security;

create policy "users manage their own highlights"
  on public.devotion_highlights for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- topic tags (devotions and reading plans)
-- ---------------------------------------------------------------------------
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.tags enable row level security;

create policy "tags are viewable by any signed-in member"
  on public.tags for select
  using (auth.role() = 'authenticated');

create policy "tags are writable by admins only"
  on public.tags for all
  using (public.is_admin())
  with check (public.is_admin());

create table public.devotion_tags (
  devotion_id uuid not null references public.devotions (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (devotion_id, tag_id)
);

alter table public.devotion_tags enable row level security;

create policy "devotion tags are viewable by any signed-in member"
  on public.devotion_tags for select
  using (auth.role() = 'authenticated');

create policy "devotion tags are writable by admins only"
  on public.devotion_tags for all
  using (public.is_admin())
  with check (public.is_admin());

create table public.plan_tags (
  plan_id uuid not null references public.reading_plans (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (plan_id, tag_id)
);

alter table public.plan_tags enable row level security;

create policy "plan tags are viewable by any signed-in member"
  on public.plan_tags for select
  using (auth.role() = 'authenticated');

create policy "plan tags are writable by admins only"
  on public.plan_tags for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- full text search (devotions + hymns)
-- ---------------------------------------------------------------------------
alter table public.devotions add column search_vector tsvector
  generated always as (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, '') || ' ' || coalesce(scripture_reference, ''))) stored;
create index devotions_search_idx on public.devotions using gin (search_vector);

alter table public.hymns add column search_vector tsvector
  generated always as (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(lyrics, ''))) stored;
create index hymns_search_idx on public.hymns using gin (search_vector);
