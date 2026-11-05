-- Synthetic fixtures only, for an isolated database with all migrations applied.
begin;
create function pg_temp.assert_ok(ok boolean, message text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception '%', message; end if; end; $$;
select pg_temp.assert_ok(not has_function_privilege('anon', 'public.is_admin()', 'execute'), 'Anonymous role helper exposed');
select pg_temp.assert_ok(not has_function_privilege('authenticated', 'public.handle_new_user()', 'execute'), 'Signup trigger exposed as RPC');
select pg_temp.assert_ok(not has_function_privilege('authenticated', 'public.reserve_invite_send(uuid)', 'execute'), 'Client can reserve sends');
select pg_temp.assert_ok(not has_function_privilege('anon', 'public.reserve_invite_send(uuid)', 'execute'), 'Anonymous quota RPC exposed');
select pg_temp.assert_ok(has_function_privilege('service_role', 'public.reserve_invite_send(uuid)', 'execute'), 'Worker cannot reserve sends');
select pg_temp.assert_ok(not has_table_privilege('authenticated', 'public.invite_send_attempts', 'insert'), 'Client can manipulate quota');
insert into auth.users(id,email) values
  ('11111111-1111-4111-8111-111111111111','limit-trainer@example.test'),
  ('22222222-2222-4222-8222-222222222222','limit-other@example.test'),
  ('33333333-3333-4333-8333-333333333333','limit-client@example.test');
update public.profiles set role = 'trainer' where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222');
select pg_temp.assert_ok((select invite_code is not null from public.profiles where id='11111111-1111-4111-8111-111111111111'), 'Trainer trigger stopped working');
insert into public.workout_plans(user_id,data) values ('33333333-3333-4333-8333-333333333333','{}');
set local role anon;
select pg_temp.assert_ok((select count(*)=0 from public.workout_plans), 'Anonymous workout exposure');
select pg_temp.assert_ok((select count(*)=0 from public.profiles), 'Anonymous profile exposure');
select pg_temp.assert_ok(not public.lookup_trainer_invite('INVALID'), 'Signup lookup failed');
reset role;
set local role service_role;
select pg_temp.assert_ok(not public.reserve_invite_send('33333333-3333-4333-8333-333333333333'), 'Ordinary user can send');
select pg_temp.assert_ok(public.reserve_invite_send('11111111-1111-4111-8111-111111111111'), 'First attempt blocked');
reset role;
insert into public.invite_send_attempts(user_id) select '11111111-1111-4111-8111-111111111111'::uuid from generate_series(1,4);
select pg_temp.assert_ok(not public.reserve_invite_send('11111111-1111-4111-8111-111111111111'), 'Sixth attempt allowed');
select pg_temp.assert_ok(public.reserve_invite_send('22222222-2222-4222-8222-222222222222'), 'Other trainer shares per-user quota');
update public.invite_send_attempts set created_at=now()-interval '11 minutes' where user_id='11111111-1111-4111-8111-111111111111';
select pg_temp.assert_ok(public.reserve_invite_send('11111111-1111-4111-8111-111111111111'), 'Window did not expire');
insert into public.invite_send_attempts(user_id,created_at) select '11111111-1111-4111-8111-111111111111'::uuid, now()-interval '1 hour' from generate_series(1,24);
select pg_temp.assert_ok(not public.reserve_invite_send('11111111-1111-4111-8111-111111111111'), 'Daily caller limit bypassed');
insert into public.invite_send_attempts(user_id,created_at) select '11111111-1111-4111-8111-111111111111'::uuid, now()-interval '2 hours' from generate_series(1,169);
select pg_temp.assert_ok(not public.reserve_invite_send('22222222-2222-4222-8222-222222222222'), 'Project cap bypassed');
update public.invite_send_attempts set created_at=now()-interval '25 hours';
select pg_temp.assert_ok(public.reserve_invite_send('11111111-1111-4111-8111-111111111111'), 'Daily window did not expire');
select pg_temp.assert_ok((select count(*)=1 from public.invite_send_attempts), 'Expired attempts were retained');
rollback;
