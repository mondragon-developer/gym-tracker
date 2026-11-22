-- Roll back only 20261122211855_optimize_workout_access.sql.
-- Run once after reviewing the release guide; schema drift aborts the transaction.
-- This restores the reviewed original predicates and index definitions.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '30s';
set local search_path = public, pg_catalog;

-- This explicit allowlist is the reviewed, hardened baseline. It preserves
-- policy roles, commands, grants, and row-dependent is_trainer_of(...) checks.
create temporary table gym_access_policy_baseline (
  table_name text, policy_name text, command text,
  original_using text, original_check text
) on commit drop;
insert into gym_access_policy_baseline values
    ('workout_plans', 'workout_plans - select own', 'SELECT', '(auth.uid() = user_id)', null),
    ('workout_plans', 'workout_plans - insert own', 'INSERT', null, '(auth.uid() = user_id)'),
    ('workout_plans', 'workout_plans - update own', 'UPDATE', '(auth.uid() = user_id)', '(auth.uid() = user_id)'),
    ('workout_plans', 'workout_plans - delete own', 'DELETE', '(auth.uid() = user_id)', null),
    ('workout_plans', 'admin - all workout_plans', 'ALL', 'is_admin()', 'is_admin()'),
    ('user_preferences', 'user_preferences - select own', 'SELECT', '(auth.uid() = user_id)', null),
    ('user_preferences', 'user_preferences - insert own', 'INSERT', null, '(auth.uid() = user_id)'),
    ('user_preferences', 'user_preferences - update own', 'UPDATE', '(auth.uid() = user_id)', '(auth.uid() = user_id)'),
    ('user_preferences', 'user_preferences - delete own', 'DELETE', '(auth.uid() = user_id)', null),
    ('user_preferences', 'admin - all user_preferences', 'ALL', 'is_admin()', 'is_admin()'),
    ('profiles', 'profiles - read own or admin', 'SELECT', '((id = auth.uid()) OR is_admin())', null),
    ('profiles', 'profiles - self insert', 'INSERT', null, '((id = auth.uid()) AND (role = ''user''::text))'),
    ('profiles', 'profiles - admin update', 'UPDATE', 'is_admin()', 'is_admin()'),
    ('legal_acceptances', 'legal_acceptances - read own or admin', 'SELECT', '((user_id = auth.uid()) OR is_admin())', null),
    ('trainer_clients', 'trainer_clients - admin all', 'ALL', 'is_admin()', 'is_admin()'),
    ('trainer_invites', 'trainer_invites - admin all', 'ALL', 'is_admin()', 'is_admin()'),
    ('trainer_clients', 'trainer_clients - trainer reads own', 'SELECT', '(trainer_id = auth.uid())', null),
    ('trainer_clients', 'trainer_clients - client reads own', 'SELECT', '(client_id = auth.uid())', null),
    ('trainer_clients', 'trainer_clients - trainer drops client', 'DELETE', '(trainer_id = auth.uid())', null),
    ('trainer_clients', 'trainer_clients - client leaves trainer', 'DELETE', '(client_id = auth.uid())', null);

-- PostgreSQL deparses a scalar SELECT with its result-column alias. Flatten
-- only the two exact wrappers introduced by the forward migration.
do $$
declare expected record; actual record; restored_using text; restored_check text;
begin
  for expected in select * from gym_access_policy_baseline loop
    select * into actual from pg_policies
    where schemaname = 'public' and tablename = expected.table_name
      and policyname = expected.policy_name;
    if not found or actual.roles <> array['authenticated']::name[]
      or actual.permissive <> 'PERMISSIVE' or actual.cmd <> expected.command then
      raise exception 'Unexpected policy scope during rollback: %.%', expected.table_name, expected.policy_name;
    end if;
    restored_using := regexp_replace(regexp_replace(actual.qual,
      '\(\s*SELECT auth\.uid\(\) AS uid\s*\)', 'auth.uid()', 'g'),
      '\(\s*SELECT is_admin\(\) AS is_admin\s*\)', 'is_admin()', 'g');
    restored_check := regexp_replace(regexp_replace(actual.with_check,
      '\(\s*SELECT auth\.uid\(\) AS uid\s*\)', 'auth.uid()', 'g'),
      '\(\s*SELECT is_admin\(\) AS is_admin\s*\)', 'is_admin()', 'g');
    if restored_using is distinct from expected.original_using
      or restored_check is distinct from expected.original_check
      or (actual.qual is not distinct from expected.original_using
        and actual.with_check is not distinct from expected.original_check) then
      raise exception 'Unexpected policy expression during rollback: %.%', expected.table_name, expected.policy_name;
    end if;
  end loop;
  if to_regclass('public.workout_plans_user_id_idx') is not null
    or to_regclass('public.user_preferences_user_id_idx') is not null
    or pg_get_indexdef(to_regclass('public.trainer_invites_created_by_idx')) is distinct from
      'CREATE INDEX trainer_invites_created_by_idx ON public.trainer_invites USING btree (created_by)'
    or pg_get_indexdef(to_regclass('public.trainer_invites_used_by_idx')) is distinct from
      'CREATE INDEX trainer_invites_used_by_idx ON public.trainer_invites USING btree (used_by)' then
    raise exception 'Unexpected index state during rollback; review schema drift.';
  end if;
end;
$$;

do $$
declare item record; statement text;
begin
  for item in select * from gym_access_policy_baseline loop
    statement := format('alter policy %I on public.%I', item.policy_name, item.table_name);
    if item.original_using is not null then
      statement := statement || format(' using (%s)', item.original_using);
    end if;
    if item.original_check is not null then
      statement := statement || format(' with check (%s)', item.original_check);
    end if;
    execute statement;
  end loop;
end;
$$;

create index workout_plans_user_id_idx on public.workout_plans (user_id);
create index user_preferences_user_id_idx on public.user_preferences (user_id);
drop index public.trainer_invites_created_by_idx;
drop index public.trainer_invites_used_by_idx;

commit;
