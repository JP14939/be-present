-- ============================================================
-- Be Present — Initial Schema
-- Run this in Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ATTACHMENT OBJECTS (the plant)
create table public.attachment_objects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'plant',
  health int not null default 80 check (health between 0 and 100),
  updated_at timestamptz default now()
);

alter table public.attachment_objects enable row level security;

create policy "Users can view own attachment object"
  on public.attachment_objects for select
  using (auth.uid() = user_id);

create policy "Users can update own attachment object"
  on public.attachment_objects for update
  using (auth.uid() = user_id);

-- DEEP WORK SESSIONS
create table public.deep_work_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  planned_duration_min int not null,
  actual_duration_min int,
  goal text,
  completed bool not null default false,
  time_away_seconds int not null default 0,
  created_at timestamptz default now()
);

alter table public.deep_work_sessions enable row level security;

create policy "Users can view own sessions"
  on public.deep_work_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.deep_work_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.deep_work_sessions for update
  using (auth.uid() = user_id);

-- HEALTH EVENTS (audit log of every health change)
create table public.health_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta int not null,
  source text not null,
  reason text,
  created_at timestamptz default now()
);

alter table public.health_events enable row level security;

create policy "Users can view own health events"
  on public.health_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own health events"
  on public.health_events for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-create profile + plant when a new user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  insert into public.attachment_objects (user_id, type, health)
  values (new.id, 'plant', 80);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
