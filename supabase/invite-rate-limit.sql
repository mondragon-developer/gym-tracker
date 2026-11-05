-- Apply before deploying the updated send-invite function.
-- Only the service role may reserve email sends. No recipient data is stored.
begin;
create table if not exists public.invite_send_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists invite_send_attempts_created_idx
  on public.invite_send_attempts(created_at);
create index if not exists invite_send_attempts_user_created_idx
  on public.invite_send_attempts(user_id, created_at);
alter table public.invite_send_attempts enable row level security;
revoke all on public.invite_send_attempts from public, anon, authenticated;

create or replace function public.reserve_invite_send(caller_id uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare stamp timestamptz; recent_count integer; daily_count integer; total_count integer;
begin
  -- Serialize reservations across workers, including the project-wide cap.
  perform pg_catalog.pg_advisory_xact_lock(734182901);
  stamp := clock_timestamp();
  if not exists (select 1 from public.profiles where id = caller_id
    and role in ('trainer', 'admin') and invite_code is not null) then
    return false;
  end if;
  delete from public.invite_send_attempts where created_at <= stamp - interval '24 hours';
  select count(*), count(*) filter (where user_id = caller_id),
    count(*) filter (where user_id = caller_id and created_at > stamp - interval '10 minutes')
    into total_count, daily_count, recent_count from public.invite_send_attempts;
  if recent_count >= 5 or daily_count >= 30 or total_count >= 200 then return false; end if;
  insert into public.invite_send_attempts(user_id, created_at) values (caller_id, stamp);
  return true;
end;
$$;
revoke all on function public.reserve_invite_send(uuid) from public, anon, authenticated;
grant execute on function public.reserve_invite_send(uuid) to service_role;
commit;
