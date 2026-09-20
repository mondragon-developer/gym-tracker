-- =============================================================================
-- Gym Tracker — MULTIPLE TRAINERS PER CLIENT
-- =============================================================================
-- Run AFTER schema.sql, admin.sql, trainers.sql and trainer-invites.sql
-- (Supabase → SQL Editor). Idempotent.
--
-- profiles.trainer_id allowed exactly one trainer per client. Assignments now
-- live in a join table so a client can be coached by several trainers at
-- once. Every linked trainer can view and edit that client's plan, and the
-- app keeps whichever save lands last, whether it came from the client or
-- from any of their trainers.
--
-- HOW A CLIENT GETS A TRAINER:
--   * At sign-up, by entering a trainer's invite code (signup trigger below).
--   * Later, by entering a code in their profile menu or opening a trainer's
--     invite link while signed in (join_trainer() below).
--   * By the super admin, from the admin panel (direct inserts, RLS-gated).
--
-- profiles.trainer_id stays in place but is no longer read or written. Once
-- nothing else depends on it:
--   alter table public.profiles drop column trainer_id;
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Join table + backfill from the old single-trainer column
-- ---------------------------------------------------------------------------
create table if not exists public.trainer_clients (
  trainer_id uuid        not null references public.profiles (id) on delete cascade,
  client_id  uuid        not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trainer_id, client_id),
  check (trainer_id <> client_id)
);

create index if not exists trainer_clients_client_id_idx on public.trainer_clients (client_id);

insert into public.trainer_clients (trainer_id, client_id)
select trainer_id, id
from public.profiles
where trainer_id is not null and trainer_id <> id
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 2. is_trainer_of() now answers from the join table
--    (same signature, so the workout_plans policies from trainers.sql keep
--    working unchanged)
-- ---------------------------------------------------------------------------
create or replace function public.is_trainer_of(target_user uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_trainer() and exists (
    select 1
    from public.trainer_clients
    where trainer_id = auth.uid()
      and client_id = target_user
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. RLS on trainer_clients
--    Inserts come only from the super admin or from SECURITY DEFINER
--    functions (signup trigger, join_trainer). Either side of a link may
--    remove it: a trainer can drop a client, a client can leave a trainer.
-- ---------------------------------------------------------------------------
alter table public.trainer_clients enable row level security;

drop policy if exists "trainer_clients - admin all" on public.trainer_clients;
create policy "trainer_clients - admin all" on public.trainer_clients
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "trainer_clients - trainer reads own" on public.trainer_clients;
create policy "trainer_clients - trainer reads own" on public.trainer_clients
  for select using (trainer_id = auth.uid());

drop policy if exists "trainer_clients - client reads own" on public.trainer_clients;
create policy "trainer_clients - client reads own" on public.trainer_clients
  for select using (client_id = auth.uid());

drop policy if exists "trainer_clients - trainer drops client" on public.trainer_clients;
create policy "trainer_clients - trainer drops client" on public.trainer_clients
  for delete using (trainer_id = auth.uid());

drop policy if exists "trainer_clients - client leaves trainer" on public.trainer_clients;
create policy "trainer_clients - client leaves trainer" on public.trainer_clients
  for delete using (client_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. Trainers read the profiles of their linked clients
-- ---------------------------------------------------------------------------
drop policy if exists "profiles - trainer reads assigned" on public.profiles;
create policy "profiles - trainer reads assigned" on public.profiles
  for select using (public.is_trainer_of(id));

-- ---------------------------------------------------------------------------
-- 5. join_trainer(code): a signed-in user links themselves to a trainer
--    Returns true when the code belongs to an active trainer (linking is
--    idempotent), false otherwise. A trainer cannot be their own client.
-- ---------------------------------------------------------------------------
create or replace function public.join_trainer(code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trainer uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  select id into v_trainer
  from public.profiles
  where role = 'trainer'
    and invite_code = upper(trim(coalesce(code, '')));

  if v_trainer is null or v_trainer = auth.uid() then
    return false;
  end if;

  insert into public.trainer_clients (trainer_id, client_id)
  values (v_trainer, auth.uid())
  on conflict do nothing;

  return true;
end;
$$;

revoke execute on function public.join_trainer(text) from anon;
grant execute on function public.join_trainer(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Signup trigger v4: same as trainer-invites.sql, but a client code now
--    creates a trainer_clients link instead of writing profiles.trainer_id
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

  -- Client invite code: link the new user to their first trainer.
  v_code := upper(trim(coalesce(new.raw_user_meta_data ->> 'trainer_code', '')));
  if v_code <> '' then
    select id into v_trainer
    from public.profiles
    where role = 'trainer' and invite_code = v_code;

    if v_trainer is not null then
      insert into public.trainer_clients (trainer_id, client_id)
      values (v_trainer, new.id)
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$f$;
