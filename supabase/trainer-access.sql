-- Run LAST, after multi-trainer.sql, trainer-invites.sql and legal-acceptance.sql.
-- Deploy this before the frontend. Older clients fail closed when joining.
-- Existing links (including admin assignments) are preserved and removable.
begin;

alter table public.trainer_clients
  add column if not exists consent_at timestamptz,
  add column if not exists consent_version text,
  add column if not exists consent_language text;

-- Stop the old automatic-link API, including PUBLIC's default function grant.
revoke all on function public.join_trainer(text) from public, anon, authenticated;

-- Signup may create a trainer role from a single-use invitation, but never
-- grants that trainer access to a client based on signup metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_invite text;
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  v_invite := upper(trim(coalesce(new.raw_user_meta_data ->> 'trainer_invite_code', '')));
  if v_invite <> '' then
    update public.trainer_invites set used_by = new.id, used_at = now()
    where code = v_invite and used_by is null;
    if found then
      update public.profiles set role = 'trainer' where id = new.id;
    end if;
  end if;
  return new;
end;
$$;

-- Deliberately reveals only a self-reported display name to a signed-in
-- account possessing the invitation code. Never exposes email or auth metadata.
create or replace function public.preview_trainer_access(code text)
returns table (trainer_id uuid, display_name text)
language sql stable security definer set search_path = public
as $$
  select p.id, coalesce(nullif(left(trim(u.raw_user_meta_data ->> 'name'), 120), ''), 'Trainer')
  from public.profiles p join auth.users u on u.id = p.id
  where auth.uid() is not null and p.id <> auth.uid() and p.role = 'trainer'
    and p.invite_code = upper(trim(coalesce(code, '')));
$$;

create or replace function public.list_my_trainers()
returns table (trainer_id uuid, display_name text)
language sql stable security definer set search_path = public
as $$
  select tc.trainer_id, coalesce(nullif(left(trim(u.raw_user_meta_data ->> 'name'), 120), ''), 'Trainer')
  from public.trainer_clients tc join auth.users u on u.id = tc.trainer_id
  where tc.client_id = auth.uid()
  order by tc.created_at, tc.trainer_id;
$$;

create or replace function public.approve_trainer_access(
  code text, expected_trainer uuid, consent_version text, consent_language text
)
returns boolean language plpgsql security definer set search_path = public
as $$
declare v_trainer uuid;
begin
  if auth.uid() is null or consent_version is distinct from '2026-10-02'
    or consent_language is null or consent_language not in ('en', 'es') then
    return false;
  end if;
  -- The same trainer the user reviewed must still own this active code.
  -- Lock the profile so its role/code cannot change during this grant.
  select id into v_trainer from public.profiles
  where id = expected_trainer and id <> auth.uid() and role = 'trainer'
    and invite_code = upper(trim(coalesce(code, '')))
  for share;
  if v_trainer is null then return false; end if;
  insert into public.trainer_clients
    (trainer_id, client_id, consent_at, consent_version, consent_language)
  values (v_trainer, auth.uid(), now(), consent_version, consent_language)
  on conflict (trainer_id, client_id) do nothing;
  return true;
end;
$$;

create or replace function public.remove_my_trainer(target_trainer uuid)
returns boolean language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then return false; end if;
  delete from public.trainer_clients
  where client_id = auth.uid() and trainer_id = target_trainer;
  -- Idempotent: already absent means access has also been removed.
  return true;
end;
$$;

revoke all on function public.preview_trainer_access(text) from public, anon;
revoke all on function public.list_my_trainers() from public, anon;
revoke all on function public.approve_trainer_access(text, uuid, text, text) from public, anon;
revoke all on function public.remove_my_trainer(uuid) from public, anon;
grant execute on function public.preview_trainer_access(text) to authenticated;
grant execute on function public.list_my_trainers() to authenticated;
grant execute on function public.approve_trainer_access(text, uuid, text, text) to authenticated;
grant execute on function public.remove_my_trainer(uuid) to authenticated;

commit;
