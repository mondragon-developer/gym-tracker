-- =============================================================================
-- Gym Tracker — ADMIN roles & policies
-- =============================================================================
-- Run this AFTER schema.sql (Supabase → SQL Editor → paste → Run). Idempotent.
--
-- WHAT THIS ADDS:
--   * A `profiles` table (id + email + role), auto-filled when a user signs up.
--     We need it because the browser cannot read auth.users directly, and we
--     need somewhere to store each user's role.
--   * is_admin(): a SECURITY DEFINER helper that checks the caller's role
--     WITHOUT tripping RLS on profiles (which would cause infinite recursion).
--   * Admin policies granting full (view + edit) access to every table.
--
-- PROMOTE YOURSELF (run once, after you've signed up):
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid        primary key references auth.users (id) on delete cascade,
  email      text,
  role       text        not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Auto-create a profile row for every new auth user
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users who signed up before this migration.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. is_admin() — SECURITY DEFINER avoids RLS recursion on profiles
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. RLS on profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles - read own or admin" on public.profiles;
create policy "profiles - read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles - self insert" on public.profiles;
create policy "profiles - self insert" on public.profiles
  for insert with check (id = auth.uid());

-- Only admins may change roles (or edit any profile).
drop policy if exists "profiles - admin update" on public.profiles;
create policy "profiles - admin update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Admin full-access policies on the data tables
--    Permissive policies are OR-ed together, so these ADD admin access on top
--    of the existing "own rows" policies without removing anything.
-- ---------------------------------------------------------------------------
drop policy if exists "admin - all exercises" on public.exercises;
create policy "admin - all exercises" on public.exercises
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin - all progress" on public.progress;
create policy "admin - all progress" on public.progress
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin - all day_notes" on public.day_notes;
create policy "admin - all day_notes" on public.day_notes
  for all using (public.is_admin()) with check (public.is_admin());
