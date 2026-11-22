-- Apply once, after all existing setup scripts including security-hardening.sql.
-- This migration is intentionally drift-checked, not a schema bootstrap.
-- Read docs/DATABASE_OPTIMIZATION_RELEASE.md before deployment.
-- No workout data, table grants, function grants, or trainer scopes are changed.
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

do $$
declare expected record; actual record;
begin
  for expected in select * from gym_access_policy_baseline loop
    select * into actual from pg_policies
    where schemaname = 'public' and tablename = expected.table_name
      and policyname = expected.policy_name;
    if not found or actual.roles <> array['authenticated']::name[]
      or actual.permissive <> 'PERMISSIVE' or actual.cmd <> expected.command then
      raise exception 'Unexpected policy scope: %.%. Review schema drift before applying.',
        expected.table_name, expected.policy_name;
    end if;
    if actual.qual is distinct from expected.original_using
      or actual.with_check is distinct from expected.original_check then
      raise exception 'Unexpected policy expression: %.%. Review schema drift before applying.',
        expected.table_name, expected.policy_name;
    end if;
  end loop;
end;
$$;

-- Refuse to remove an index whose definition or uniqueness guarantee differs
-- from the reviewed baseline. No unrelated unused indexes are removed.
do $$
declare item record;
begin
  for item in select * from (values
    ('workout_plans', 'workout_plans_user_id_idx'),
    ('user_preferences', 'user_preferences_user_id_idx')
  ) as indexes(table_name, index_name) loop
    if not exists (
      select 1 from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid and a.attname = 'user_id'
      join pg_index i on i.indexrelid = c.conindid
      where c.conrelid = format('public.%I', item.table_name)::regclass
        and c.contype = 'u' and c.conkey = array[a.attnum]::smallint[]
        and i.indisvalid and i.indisready
    ) then
      raise exception 'Missing valid unique user_id constraint on %', item.table_name;
    end if;
    if pg_get_indexdef(to_regclass(format('public.%I', item.index_name))) is distinct from
      format('CREATE INDEX %I ON public.%I USING btree (user_id)', item.index_name, item.table_name) then
      raise exception 'Unexpected redundant index definition: %', item.index_name;
    end if;
  end loop;
  if to_regclass('public.trainer_invites_created_by_idx') is not null
    or to_regclass('public.trainer_invites_used_by_idx') is not null then
    raise exception 'Invitation indexes already exist; review migration state before applying.';
  end if;
end;
$$;

do $$
declare item record; statement text; using_expression text; check_expression text;
begin
  for item in select * from gym_access_policy_baseline loop
    using_expression := replace(replace(item.original_using,
      'auth.uid()', '(select auth.uid())'), 'is_admin()', '(select public.is_admin())');
    check_expression := replace(replace(item.original_check,
      'auth.uid()', '(select auth.uid())'), 'is_admin()', '(select public.is_admin())');
    statement := format('alter policy %I on public.%I', item.policy_name, item.table_name);
    if using_expression is not null then
      statement := statement || format(' using (%s)', using_expression);
    end if;
    if check_expression is not null then
      statement := statement || format(' with check (%s)', check_expression);
    end if;
    execute statement;
  end loop;
end;
$$;

-- These cover child-row lookups for profile deletion: created_by cascades;
-- used_by is set to null. The code primary key remains the invitation lookup.
create index trainer_invites_created_by_idx on public.trainer_invites (created_by);
create index trainer_invites_used_by_idx on public.trainer_invites (used_by);

drop index public.workout_plans_user_id_idx;
drop index public.user_preferences_user_id_idx;

commit;
