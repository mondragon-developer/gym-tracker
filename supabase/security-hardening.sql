-- Apply after trainer-access.sql. Existing access scopes stay unchanged.
begin;
-- Anonymous sessions do not use these tables. Restrict policy evaluation
-- before removing anonymous execution of the role helpers they reference.
do $$
declare p record;
begin
  for p in select tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in
      ('profiles', 'workout_plans', 'user_preferences', 'trainer_clients', 'trainer_invites', 'legal_acceptances')
  loop
    execute format('alter policy %I on public.%I to authenticated', p.policyname, p.tablename);
  end loop;
end;
$$;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_trainer() from public, anon;
revoke execute on function public.is_trainer_of(uuid) from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.is_trainer() to authenticated, service_role;
grant execute on function public.is_trainer_of(uuid) to authenticated, service_role;
-- Trigger execution does not require a client-callable RPC grant.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.ensure_trainer_invite_code() from public, anon, authenticated;
-- lookup_trainer_code and lookup_trainer_invite intentionally remain public:
-- the sign-up form uses their boolean results before authentication.
commit;
