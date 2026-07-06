-- =============================================================================
-- Gym Tracker — TRAINER hierarchy (super admin → trainers → assigned users)
-- =============================================================================
-- Run this AFTER schema.sql and admin.sql (Supabase → SQL Editor). Idempotent.
--
-- ROLES:
--   * admin   — super admin. Full access to every profile and every plan
--               (the existing is_admin() policies from admin.sql already grant
--               this; nothing here restricts admins).
--   * trainer — sees and edits ONLY the users assigned to them via
--               profiles.trainer_id. Cannot change roles, cannot delete plans,
--               cannot touch unassigned ("individual") users or other
--               trainers' clients.
--   * user    — unchanged; owns their own data.
--
-- ASSIGNMENT (invite-code flow):
--   * Every trainer gets an auto-generated 6-char invite_code.
--   * A new user may enter that code at sign-up (stored in auth metadata as
--     trainer_code); the signup trigger resolves it and sets trainer_id.
--   * The super admin can also assign/reassign trainer_id from the admin
--     panel at any time (covered by the existing "profiles - admin update"
--     policy).
--
-- REVOCATION: is_trainer_of() checks the trainer's CURRENT role, so demoting
-- a trainer instantly cuts their access even if trainer_id assignments still
-- point at them.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles: three-value role + assignment + invite code
-- ---------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('user', 'trainer', 'admin'));

-- on delete set null: deleting a trainer account must not delete or orphan
-- their clients — they just become individual accounts again.
alter table public.profiles
  add column if not exists trainer_id uuid references public.profiles (id) on delete set null;

alter table public.profiles
  add column if not exists invite_code text unique;

create index if not exists profiles_trainer_id_idx on public.profiles (trainer_id);

-- ---------------------------------------------------------------------------
-- 2. Role helpers — SECURITY DEFINER avoids RLS recursion on profiles
-- ---------------------------------------------------------------------------
create or replace function public.is_trainer()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'trainer'
  );
$$;

-- True when the caller is a trainer AND the target user is assigned to them.
create or replace function public.is_trainer_of(target_user uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles target
    where target.id = target_user
      and target.trainer_id = auth.uid()
  ) and public.is_trainer();
$$;

-- ---------------------------------------------------------------------------
-- 3. Invite codes: auto-generate when a profile becomes a trainer
-- ---------------------------------------------------------------------------
create or replace function public.ensure_trainer_invite_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'trainer' and (new.invite_code is null or new.invite_code = '') then
    loop
      -- 6 hex chars, uppercase: short enough to share verbally at the gym.
      new.invite_code := upper(substr(md5(gen_random_uuid()::text), 1, 6));
      exit when not exists (
        select 1 from public.profiles
        where invite_code = new.invite_code and id <> new.id
      );
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ensure_trainer_invite_code on public.profiles;
create trigger trg_ensure_trainer_invite_code
  before insert or update of role on public.profiles
  for each row execute function public.ensure_trainer_invite_code();

-- ---------------------------------------------------------------------------
-- 4. Sign-up: resolve an optional trainer code from the auth metadata
--    (replaces the handle_new_user() from admin.sql — superset of it)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code    text;
  v_trainer uuid;
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  -- Unknown or empty codes are ignored: the account is simply individual.
  v_code := upper(trim(coalesce(new.raw_user_meta_data ->> 'trainer_code', '')));
  if v_code <> '' then
    select id into v_trainer
    from public.profiles
    where role = 'trainer' and invite_code = v_code;

    if v_trainer is not null then
      update public.profiles set trainer_id = v_trainer where id = new.id;
    end if;
  end if;

  return new;
end;
$$;

-- (Trigger on_auth_user_created from admin.sql already points here.)

-- Pre-signup validation for the sign-up form: returns the trainer's email for
-- a valid code, null otherwise. SECURITY DEFINER + callable by anon, which is
-- acceptable: codes are random and the only thing revealed is the email of a
-- trainer who handed the code out.
create or replace function public.lookup_trainer_code(code text)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select email from public.profiles
  where role = 'trainer'
    and invite_code = upper(trim(coalesce(code, '')));
$$;

-- ---------------------------------------------------------------------------
-- 5. RLS: trainer read access to assigned profiles
-- ---------------------------------------------------------------------------
drop policy if exists "profiles - trainer reads assigned" on public.profiles;
create policy "profiles - trainer reads assigned" on public.profiles
  for select using (public.is_trainer() and trainer_id = auth.uid());

-- NOTE: trainers get NO insert/update/delete on profiles. Role changes and
-- (re)assignment remain super-admin-only via "profiles - admin update".

-- ---------------------------------------------------------------------------
-- 6. RLS: trainer plan access for assigned users (view/edit — NOT delete)
-- ---------------------------------------------------------------------------
drop policy if exists "trainer - select assigned workout_plans" on public.workout_plans;
create policy "trainer - select assigned workout_plans" on public.workout_plans
  for select using (public.is_trainer_of(user_id));

drop policy if exists "trainer - insert assigned workout_plans" on public.workout_plans;
create policy "trainer - insert assigned workout_plans" on public.workout_plans
  for insert with check (public.is_trainer_of(user_id));

drop policy if exists "trainer - update assigned workout_plans" on public.workout_plans;
create policy "trainer - update assigned workout_plans" on public.workout_plans
  for update using (public.is_trainer_of(user_id)) with check (public.is_trainer_of(user_id));
