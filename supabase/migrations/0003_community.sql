-- Church Devotion App - community features (prayer replies, reports, rate limiting)
-- Run after 0002_engagement.sql. Run with: supabase db push (or paste into the Supabase SQL editor)

-- ---------------------------------------------------------------------------
-- prayer replies (encouragement, not just the "praying" tap)
-- ---------------------------------------------------------------------------
create table public.prayer_replies (
  id uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null references public.prayer_requests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.prayer_replies enable row level security;

create policy "prayer replies are viewable by any signed-in member"
  on public.prayer_replies for select
  using (auth.role() = 'authenticated');

create policy "members create their own prayer replies"
  on public.prayer_replies for insert
  with check (auth.uid() = user_id);

create policy "owners and admins delete prayer replies"
  on public.prayer_replies for delete
  using (auth.uid() = user_id or public.is_admin());

-- ---------------------------------------------------------------------------
-- prayer wall abuse protection: member reports + posting rate limit
-- ---------------------------------------------------------------------------
create table public.prayer_reports (
  id uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null references public.prayer_requests (id) on delete cascade,
  reported_by uuid not null references public.profiles (id) on delete cascade,
  reason text,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (prayer_request_id, reported_by)
);

alter table public.prayer_reports enable row level security;

create policy "members create their own prayer reports"
  on public.prayer_reports for insert
  with check (auth.uid() = reported_by);

create policy "admins view and manage prayer reports"
  on public.prayer_reports for select
  using (public.is_admin());

create policy "admins update prayer reports"
  on public.prayer_reports for update
  using (public.is_admin());

-- max 3 prayer requests per user per rolling hour
create function public.enforce_prayer_rate_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (select count(*) from public.prayer_requests
      where user_id = new.user_id and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'You can only post 3 prayer requests per hour.';
  end if;
  return new;
end;
$$;

create trigger before_prayer_request_insert
  before insert on public.prayer_requests
  for each row execute procedure public.enforce_prayer_rate_limit();
