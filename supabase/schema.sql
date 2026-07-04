-- =============================================================================
-- Gym Tracker — core schema
-- =============================================================================
-- Run in Supabase → SQL Editor. Idempotent — safe to re-run.
--
-- The app stores each user's whole workout plan as one JSONB document
-- (matching the shape produced by workoutService), plus a preferences blob.
-- Row Level Security scopes every row to its owner; admin access is layered
-- on top by admin.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------
create table if not exists public.workout_plans (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  data       jsonb       not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.user_preferences (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  preferences jsonb       not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id)
);

create index if not exists workout_plans_user_id_idx on public.workout_plans (user_id);
create index if not exists user_preferences_user_id_idx on public.user_preferences (user_id);

-- ---------------------------------------------------------------------------
-- 2. Row Level Security — owners only (admin policies come from admin.sql)
-- ---------------------------------------------------------------------------
alter table public.workout_plans    enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists "workout_plans - select own" on public.workout_plans;
create policy "workout_plans - select own" on public.workout_plans
  for select using (auth.uid() = user_id);

drop policy if exists "workout_plans - insert own" on public.workout_plans;
create policy "workout_plans - insert own" on public.workout_plans
  for insert with check (auth.uid() = user_id);

drop policy if exists "workout_plans - update own" on public.workout_plans;
create policy "workout_plans - update own" on public.workout_plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "workout_plans - delete own" on public.workout_plans;
create policy "workout_plans - delete own" on public.workout_plans
  for delete using (auth.uid() = user_id);

drop policy if exists "user_preferences - select own" on public.user_preferences;
create policy "user_preferences - select own" on public.user_preferences
  for select using (auth.uid() = user_id);

drop policy if exists "user_preferences - insert own" on public.user_preferences;
create policy "user_preferences - insert own" on public.user_preferences
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_preferences - update own" on public.user_preferences;
create policy "user_preferences - update own" on public.user_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_preferences - delete own" on public.user_preferences;
create policy "user_preferences - delete own" on public.user_preferences
  for delete using (auth.uid() = user_id);
