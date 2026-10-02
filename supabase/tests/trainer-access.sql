-- STAGING ONLY. Run as the SQL editor owner after trainer-access.sql.
-- Uses synthetic accounts, no emails/passwords are sent. Always rolls back.
-- An assertion failure aborts the transaction; issue ROLLBACK before retrying.
begin;

create function pg_temp.assert_ok(ok boolean, message text)
returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception '%', message; end if;
end;
$$;

select pg_temp.assert_ok(not has_function_privilege('authenticated', 'public.join_trainer(text)', 'execute'), 'Old join API is callable');
select pg_temp.assert_ok(not has_function_privilege('anon', 'public.preview_trainer_access(text)', 'execute'), 'Anonymous identity lookup is callable');
select pg_temp.assert_ok(not has_function_privilege('anon', 'public.approve_trainer_access(text,uuid,text,text)', 'execute'), 'Anonymous approval is callable');

insert into auth.users (id, email, raw_user_meta_data) values
 ('11111111-1111-4111-8111-111111111111', 'trainer-access-a@example.test', '{"name":"Trainer A"}'),
 ('22222222-2222-4222-8222-222222222222', 'trainer-access-b@example.test', '{"name":"Trainer B"}');
update public.profiles set role = 'trainer', invite_code = 'TESTA1' where id = '11111111-1111-4111-8111-111111111111';
update public.profiles set role = 'trainer', invite_code = 'TESTB2' where id = '22222222-2222-4222-8222-222222222222';
insert into auth.users (id, email, raw_user_meta_data) values
 ('33333333-3333-4333-8333-333333333333', 'trainer-access-client@example.test', '{"trainer_code":"TESTA1","pending_trainer_code":"TESTA1"}'),
 ('44444444-4444-4444-8444-444444444444', 'trainer-access-other@example.test', '{}');
select pg_temp.assert_ok(not exists(select 1 from public.trainer_clients where client_id = '33333333-3333-4333-8333-333333333333'), 'Signup granted access');
insert into public.workout_plans(user_id, data) values
 ('33333333-3333-4333-8333-333333333333', '{"test":true}'),
 ('44444444-4444-4444-8444-444444444444', '{"other":true}');
-- A legacy/admin-created link for another client must survive self-service removal.
insert into public.trainer_clients(trainer_id, client_id) values
 ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444');

set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select pg_temp.assert_ok((select count(*) = 0 from public.list_my_trainers()), 'List exposed another client link');
select pg_temp.assert_ok((select display_name = 'Trainer A' from public.preview_trainer_access('testa1')), 'Preview identity mismatch');
select pg_temp.assert_ok((select count(*) = 0 from public.list_my_trainers()), 'Preview granted access');
select pg_temp.assert_ok(not public.approve_trainer_access('TESTA1', '22222222-2222-4222-8222-222222222222', '2026-10-02', 'en'), 'Changed identity was accepted');
select pg_temp.assert_ok(not public.approve_trainer_access('TESTA1', '11111111-1111-4111-8111-111111111111', 'old', 'en'), 'Old disclosure accepted');
select pg_temp.assert_ok(not public.approve_trainer_access('TESTA1', '11111111-1111-4111-8111-111111111111', '2026-10-02', null), 'Missing language accepted');
select pg_temp.assert_ok(public.approve_trainer_access('TESTA1', '11111111-1111-4111-8111-111111111111', '2026-10-02', 'es'), 'Approval failed');
select pg_temp.assert_ok(public.approve_trainer_access('TESTA1', '11111111-1111-4111-8111-111111111111', '2026-10-02', 'en'), 'Repeat approval failed');
select pg_temp.assert_ok((select count(*) = 1 from public.list_my_trainers()), 'Repeated approval duplicated link');
select pg_temp.assert_ok((select consent_language = 'es' and consent_version = '2026-10-02' and consent_at is not null from public.trainer_clients where client_id = auth.uid()), 'First approval evidence was overwritten');

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select pg_temp.assert_ok((select count(*) = 1 from public.workout_plans where user_id = '33333333-3333-4333-8333-333333333333'), 'Approved trainer cannot read plan');
with updated as (update public.workout_plans set data = '{"edited":true}' where user_id = '33333333-3333-4333-8333-333333333333' returning id)
select pg_temp.assert_ok((select count(*) = 1 from updated), 'Approved trainer cannot edit');

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select pg_temp.assert_ok((select count(*) = 0 from public.workout_plans where user_id = '33333333-3333-4333-8333-333333333333'), 'Unrelated trainer can read plan');
select public.remove_my_trainer('11111111-1111-4111-8111-111111111111');

select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select pg_temp.assert_ok((select count(*) = 1 from public.list_my_trainers()), 'Another user removed client link');
select pg_temp.assert_ok(public.remove_my_trainer('11111111-1111-4111-8111-111111111111'), 'Removal failed');
select pg_temp.assert_ok((select count(*) = 0 from public.list_my_trainers()), 'Removal left access');
select pg_temp.assert_ok((select count(*) = 1 from public.workout_plans where user_id = auth.uid()), 'Removal deleted client workout');

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select pg_temp.assert_ok((select count(*) = 0 from public.workout_plans where user_id = '33333333-3333-4333-8333-333333333333'), 'Removed trainer can still read');
with updated as (update public.workout_plans set data = '{"bad":true}' where user_id = '33333333-3333-4333-8333-333333333333' returning id)
select pg_temp.assert_ok((select count(*) = 0 from updated), 'Removed trainer can still edit');
select pg_temp.assert_ok((select count(*) = 1 from public.workout_plans where user_id = '44444444-4444-4444-8444-444444444444'), 'Other client access was removed');
reset role;
rollback;
