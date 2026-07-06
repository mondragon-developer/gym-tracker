-- =============================================================================
-- Gym Tracker — TRAINER INVITATIONS (super admin invites someone AS a trainer)
-- =============================================================================
-- Run AFTER trainers.sql (Supabase → SQL Editor). Idempotent.
--
-- Flow: the super admin creates a single-use invite code from the admin panel
-- and sends the link (/?trainer-invite=CODE). Signing up through it creates
-- the account with role = 'trainer' directly (the invite-code trigger from
-- trainers.sql then auto-generates the new trainer's own client code).
--
-- SECURITY: only admins can create/list/revoke invites (RLS); each code is
-- single-use (used_by marks consumption atomically); the signup trigger runs
-- as SECURITY DEFINER so anonymous signups can consume — but never create —
-- invites.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Invitation table
-- ---------------------------------------------------------------------------
create table if not exists public.trainer_invites (
  code       text        primary key,
  created_by uuid        not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  used_by    uuid        references public.profiles (id) on delete set null,
  used_at    timestamptz
);

alter table public.trainer_invites enable row level security;

drop policy if exists "trainer_invites - admin all" on public.trainer_invites;
create policy "trainer_invites - admin all" on public.trainer_invites
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Pre-signup validation for the sign-up form (anon-callable, boolean only)
-- ---------------------------------------------------------------------------
create or replace function public.lookup_trainer_invite(invite text)
returns boolean
language sql
security definer
stable
set search_path = public
as $f$
  select exists (
    select 1 from public.trainer_invites t
    where t.code = upper(trim(coalesce(invite, '')))
      and t.used_by is null
  );
$f$;

-- ---------------------------------------------------------------------------
-- 3. Signup trigger v3: trainer invite first, then client trainer code
--    (replaces handle_new_user from trainers.sql — superset of it)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $f$
declare
  v_invite  text;
  v_code    text;
  v_trainer uuid;
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  -- Trainer invitation: consume atomically (the WHERE used_by IS NULL makes
  -- double-spending impossible) and promote the new account.
  v_invite := upper(trim(coalesce(new.raw_user_meta_data ->> 'trainer_invite_code', '')));
  if v_invite <> '' then
    update public.trainer_invites
       set used_by = new.id, used_at = now()
     where code = v_invite and used_by is null;
    if found then
      update public.profiles set role = 'trainer' where id = new.id;
      return new; -- a new trainer is never simultaneously someone's trainee
    end if;
  end if;

  -- Client invite code: assign the new user to their trainer.
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
$f$;
