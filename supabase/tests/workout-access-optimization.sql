-- Synthetic fixtures only. Execute in an isolated database, never production.
-- Run before and after the optimization, and again after its rollback.
begin;

create function pg_temp.assert_ok(ok boolean, message text)
returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception '%', message; end if;
end;
$$;

insert into auth.users(id, email) values
 ('10000000-0000-4000-8000-000000000001', 'owner@example.test'),
 ('10000000-0000-4000-8000-000000000002', 'other-owner@example.test'),
 ('10000000-0000-4000-8000-000000000003', 'approved-trainer@example.test'),
 ('10000000-0000-4000-8000-000000000004', 'unrelated-trainer@example.test'),
 ('10000000-0000-4000-8000-000000000005', 'admin@example.test'),
 ('10000000-0000-4000-8000-000000000006', 'unlinked-owner@example.test'),
 ('10000000-0000-4000-8000-000000000007', 'empty-linked-owner@example.test');
update public.profiles set role = 'trainer'
where id in ('10000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000004');
update public.profiles set role = 'admin'
where id = '10000000-0000-4000-8000-000000000005';
insert into public.workout_plans(user_id, data) values
 ('10000000-0000-4000-8000-000000000001', '{"fixture":"owner"}'),
 ('10000000-0000-4000-8000-000000000002', '{"fixture":"other"}');
insert into public.user_preferences(user_id, preferences) values
 ('10000000-0000-4000-8000-000000000001', '{}'),
 ('10000000-0000-4000-8000-000000000002', '{}');
insert into public.trainer_clients(trainer_id, client_id) values
 ('10000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001'),
 ('10000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000007');
insert into public.legal_acceptances(user_id, version, language) values
 ('10000000-0000-4000-8000-000000000001', '2026-10-02', 'en'),
 ('10000000-0000-4000-8000-000000000002', '2026-10-02', 'en');
insert into public.trainer_invites(code, created_by) values
 ('OPTIMIZATION_FIXTURE', '10000000-0000-4000-8000-000000000005');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select pg_temp.assert_ok((select count(*) = 1 from public.workout_plans
  where user_id in ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002')), 'Owner scope changed');
with changed as (update public.workout_plans set data = '{"owner_edit":true}'
  where user_id = '10000000-0000-4000-8000-000000000001' returning id)
select pg_temp.assert_ok((select count(*) = 1 from changed), 'Owner cannot update own plan');
with changed as (update public.workout_plans set data = '{"unauthorized":true}'
  where user_id = '10000000-0000-4000-8000-000000000002' returning id)
select pg_temp.assert_ok((select count(*) = 0 from changed), 'Owner updated another plan');
do $$ begin
  begin
    insert into public.workout_plans(user_id, data)
    values ('10000000-0000-4000-8000-000000000006', '{}');
    raise exception 'Owner inserted another user''s plan';
  exception when insufficient_privilege then null; end;
  begin
    update public.workout_plans set user_id = '10000000-0000-4000-8000-000000000006'
    where user_id = '10000000-0000-4000-8000-000000000001';
    raise exception 'Owner reassigned a plan';
  exception when insufficient_privilege then null; end;
end; $$;
with removed as (delete from public.workout_plans
  where user_id = '10000000-0000-4000-8000-000000000001' returning id)
select pg_temp.assert_ok((select count(*) = 1 from removed), 'Owner cannot delete own plan');
insert into public.workout_plans(user_id, data)
values ('10000000-0000-4000-8000-000000000001', '{"owner_recreated":true}');
delete from public.user_preferences where user_id = '10000000-0000-4000-8000-000000000001';
insert into public.user_preferences(user_id, preferences)
values ('10000000-0000-4000-8000-000000000001', '{"units":"metric"}');
with changed as (update public.user_preferences set preferences = '{"units":"imperial"}'
  where user_id = '10000000-0000-4000-8000-000000000001' returning id)
select pg_temp.assert_ok((select count(*) = 1 from changed), 'Own preference write failed');
select pg_temp.assert_ok((select count(*) = 0 from public.user_preferences
  where user_id = '10000000-0000-4000-8000-000000000002'), 'Other preferences exposed');
select pg_temp.assert_ok((select count(*) = 1 from public.legal_acceptances
  where user_id in ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002')), 'Legal acceptance scope changed');
select pg_temp.assert_ok((select count(*) = 0 from public.trainer_invites
  where code = 'OPTIMIZATION_FIXTURE'), 'Invitation exposed to ordinary user');
with changed as (update public.profiles set role = 'admin'
  where id = '10000000-0000-4000-8000-000000000001' returning id)
select pg_temp.assert_ok((select count(*) = 0 from changed), 'Self-promotion permitted');
select pg_temp.assert_ok((select count(*) = 1 from public.trainer_clients), 'Client link-read scope changed');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select pg_temp.assert_ok((select count(*) = 1 from public.workout_plans
  where user_id in ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002')), 'Trainer scope changed');
with changed as (update public.workout_plans set data = '{"trainer_edit":true}'
  where user_id = '10000000-0000-4000-8000-000000000001' returning id)
select pg_temp.assert_ok((select count(*) = 1 from changed), 'Approved trainer cannot update');
insert into public.workout_plans(user_id, data)
values ('10000000-0000-4000-8000-000000000007', '{"trainer_created":true}');
with removed as (delete from public.workout_plans
  where user_id = '10000000-0000-4000-8000-000000000001' returning id)
select pg_temp.assert_ok((select count(*) = 0 from removed), 'Trainer can delete client plan');
select pg_temp.assert_ok((select count(*) = 0 from public.user_preferences
  where user_id = '10000000-0000-4000-8000-000000000001'), 'Trainer can read client preferences');
select pg_temp.assert_ok((select count(*) = 1 from public.profiles
  where id = '10000000-0000-4000-8000-000000000001'), 'Approved trainer cannot read client profile');
select pg_temp.assert_ok((select count(*) = 2 from public.trainer_clients), 'Trainer link-read scope changed');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
select pg_temp.assert_ok((select count(*) = 0 from public.workout_plans
  where user_id = '10000000-0000-4000-8000-000000000001'), 'Unrelated trainer can read plan');
with changed as (update public.workout_plans set data = '{"unrelated_edit":true}'
  where user_id = '10000000-0000-4000-8000-000000000001' returning id)
select pg_temp.assert_ok((select count(*) = 0 from changed), 'Unrelated trainer can update plan');

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.assert_ok((select count(*) = 0 from public.workout_plans), 'Anonymous plan exposure');
select pg_temp.assert_ok((select count(*) = 0 from public.profiles), 'Anonymous profile exposure');
select pg_temp.assert_ok((select count(*) = 0 from public.user_preferences), 'Anonymous preference exposure');
select pg_temp.assert_ok((select count(*) = 0 from public.legal_acceptances), 'Anonymous legal acceptance exposure');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000005', true);
select pg_temp.assert_ok((select count(*) = 2 from public.workout_plans
  where user_id in ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002')), 'Admin read scope changed');
with changed as (update public.workout_plans set data = '{"admin_edit":true}'
  where user_id = '10000000-0000-4000-8000-000000000002' returning id)
select pg_temp.assert_ok((select count(*) = 1 from changed), 'Admin cannot update another plan');
select pg_temp.assert_ok((select count(*) = 1 from public.trainer_invites
  where code = 'OPTIMIZATION_FIXTURE'), 'Admin invitation access changed');
insert into public.trainer_invites(code, created_by)
values ('OPTIMIZATION_ADMIN_WRITE', '10000000-0000-4000-8000-000000000005');
with changed as (update public.trainer_invites set used_by = '10000000-0000-4000-8000-000000000001'
  where code = 'OPTIMIZATION_ADMIN_WRITE' returning code)
select pg_temp.assert_ok((select count(*) = 1 from changed), 'Admin invitation update failed');
with removed as (delete from public.trainer_invites where code = 'OPTIMIZATION_ADMIN_WRITE' returning code)
select pg_temp.assert_ok((select count(*) = 1 from removed), 'Admin invitation delete failed');
with changed as (update public.user_preferences set preferences = '{"admin_edit":true}'
  where user_id = '10000000-0000-4000-8000-000000000002' returning id)
select pg_temp.assert_ok((select count(*) = 1 from changed), 'Admin preference update failed');
with changed as (update public.profiles set role = 'trainer'
  where id = '10000000-0000-4000-8000-000000000006' returning id)
select pg_temp.assert_ok((select count(*) = 1 from changed), 'Admin profile update failed');
insert into public.trainer_clients(trainer_id, client_id) values
 ('10000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002'),
 ('10000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000006');
with changed as (update public.trainer_clients set consent_language = 'en'
  where trainer_id = '10000000-0000-4000-8000-000000000004' returning client_id)
select pg_temp.assert_ok((select count(*) = 2 from changed), 'Admin link update failed');
select pg_temp.assert_ok((select count(*) = 2 from public.legal_acceptances
  where user_id in ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002')), 'Admin legal acceptance scope changed');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
with removed as (delete from public.trainer_clients
  where client_id = '10000000-0000-4000-8000-000000000002' returning client_id)
select pg_temp.assert_ok((select count(*) = 1 from removed), 'Trainer cannot remove own client link');
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000006', true);
with removed as (delete from public.trainer_clients
  where trainer_id = '10000000-0000-4000-8000-000000000004' returning client_id)
select pg_temp.assert_ok((select count(*) = 1 from removed), 'Client cannot remove own trainer link');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select pg_temp.assert_ok(public.remove_my_trainer('10000000-0000-4000-8000-000000000003'), 'Trainer removal failed');
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select pg_temp.assert_ok((select count(*) = 0 from public.workout_plans
  where user_id = '10000000-0000-4000-8000-000000000001'), 'Revoked trainer retains access');
with changed as (update public.workout_plans set data = '{"revoked_edit":true}'
  where user_id = '10000000-0000-4000-8000-000000000001' returning id)
select pg_temp.assert_ok((select count(*) = 0 from changed), 'Revoked trainer retains write access');
select pg_temp.assert_ok((select count(*) = 1 from public.workout_plans
  where user_id = '10000000-0000-4000-8000-000000000007'), 'Removing one link revoked another client');

reset role;
update public.profiles set role = 'user' where id = '10000000-0000-4000-8000-000000000003';
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select pg_temp.assert_ok((select count(*) = 0 from public.workout_plans
  where user_id = '10000000-0000-4000-8000-000000000007'), 'Demoted trainer retains access');
reset role;
delete from public.profiles where id = '10000000-0000-4000-8000-000000000006';
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000006', true);
do $$ begin
  begin
    insert into public.profiles(id, role)
    values ('10000000-0000-4000-8000-000000000006', 'admin');
    raise exception 'Self-insert allowed an elevated role';
  exception when insufficient_privilege then null; end;
end; $$;
insert into public.profiles(id, role)
values ('10000000-0000-4000-8000-000000000006', 'user');
select pg_temp.assert_ok((select role = 'user' from public.profiles
  where id = '10000000-0000-4000-8000-000000000006'), 'Ordinary self-insert failed');
reset role;
rollback;
