/**
 * Runs the actual SQL setup, migration, rollback, and authorization fixtures in
 * disposable PostgreSQL 17 (PGlite). It never connects to a hosted database.
 * See docs/DATABASE_OPTIMIZATION_RELEASE.md for the pinned external dependency.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const modulePath = process.env.PGLITE_MODULE || '@electric-sql/pglite';
const moduleSpecifier = isAbsolute(modulePath) ? pathToFileURL(modulePath).href : modulePath;
const moduleUrl = import.meta.resolve(moduleSpecifier);
const runtimePackage = JSON.parse(await readFile(new URL('../package.json', moduleUrl), 'utf8'));
assert.equal(runtimePackage.name, '@electric-sql/pglite', 'Use the documented PGlite runtime');
assert.equal(runtimePackage.version, '0.3.14', 'Use the pinned PGlite version for reproducible database checks');
const { PGlite } = await import(moduleSpecifier);
const db = new PGlite();
const migration = 'supabase/migrations/20261122211855_optimize_workout_access.sql';
const rollback = 'supabase/rollbacks/20261122211855_optimize_workout_access.sql';
const source = path => readFile(resolve(root, path), 'utf8');
const runFile = async path => db.exec(await source(path));
const report = {
  capturedAt: new Date().toISOString(),
  runtime: null,
  pgliteVersion: runtimePackage.version,
  syntheticRows: 3000,
  authorization: [],
  checks: [],
  plans: {},
};

const schemaFiles = [
  'schema.sql', 'admin.sql', 'trainers.sql', 'trainer-invites.sql',
  'multi-trainer.sql', 'rest-timer-push.sql', 'account-activity.sql',
  'legal-acceptance.sql', 'trainer-access.sql', 'invite-rate-limit.sql',
  'security-hardening.sql',
];
const fixtureFiles = [
  'workout-access-optimization.sql', 'trainer-access.sql', 'security-hardening.sql',
];
const policySnapshot = async () => (await db.query(`
  select tablename, policyname, permissive, roles, cmd, qual, with_check
  from pg_policies where schemaname = 'public' order by tablename, policyname
`)).rows;
const indexSnapshot = async () => (await db.query(`
  select tablename, indexname, indexdef from pg_indexes
  where schemaname = 'public' order by tablename, indexname
`)).rows;

async function verifyAuthorization(phase) {
  for (const file of fixtureFiles) {
    await runFile(`supabase/tests/${file}`);
    report.authorization.push({ phase, fixture: file, result: 'passed' });
  }
}

function walkPlans(plan, visit) {
  visit(plan);
  for (const child of plan.Plans || []) walkPlans(child, visit);
}

async function queryPlans() {
  await db.exec(`
    begin;
    set local role authenticated;
    select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', true);
  `);
  try {
    // Warming is explicit. EXPLAIN timings here are local observations, not a
    // production capacity claim or a pass/fail speed threshold.
    await db.query('select count(*) from public.user_preferences');
    const preferenceRuns = [];
    let preferencePlan;
    for (let i = 0; i < 5; i += 1) {
      const result = await db.query('explain (analyze, buffers, format json) select count(*) from public.user_preferences');
      preferencePlan = result.rows[0]['QUERY PLAN'][0];
      preferenceRuns.push(preferencePlan['Execution Time']);
    }
    const invitationResult = await db.query(`
      explain (analyze, buffers, format json)
      select code from public.trainer_invites
      where created_by = '20000000-0000-4000-8000-000000000101'
    `);
    const invitationPlan = invitationResult.rows[0]['QUERY PLAN'][0];
    const initPlans = [];
    const invitationAccess = [];
    walkPlans(preferencePlan.Plan, plan => {
      if (plan['Parent Relationship'] === 'InitPlan') {
        initPlans.push({ name: plan['Subplan Name'], loops: plan['Actual Loops'] });
      }
    });
    walkPlans(invitationPlan.Plan, plan => {
      if (plan['Relation Name'] === 'trainer_invites' || plan['Index Name']) {
        invitationAccess.push({ node: plan['Node Type'], index: plan['Index Name'] || null });
      }
    });
    return {
      preferenceExecutionMs: preferenceRuns,
      preferenceMedianExecutionMs: [...preferenceRuns].sort((a, b) => a - b)[2],
      preferenceInitPlans: initPlans,
      invitationAccess,
      preferencePlan,
      invitationPlan,
    };
  } finally {
    await db.exec('rollback');
  }
}

try {
  report.runtime = (await db.query('select version() as version')).rows[0].version;
  const majorVersion = (await db.query("select current_setting('server_version_num')::int / 10000 as major")).rows[0].major;
  assert.equal(majorVersion, 17, 'Use the documented PostgreSQL 17 PGlite version for this harness');

  // This minimal auth schema supplies the Supabase functions and role names
  // needed by the repository SQL. It is not a simulation of the Auth service,
  // PostgREST, hosted extensions, pooling, or concurrent connections.
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (
      id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb,
      last_sign_in_at timestamptz
    );
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    alter default privileges in schema public
      grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public
      grant usage, select on sequences to anon, authenticated, service_role;
  `);
  for (const file of schemaFiles) await runFile(`supabase/${file}`);

  const initialPolicies = await policySnapshot();
  const initialIndexes = await indexSnapshot();
  await verifyAuthorization('before');

  await db.exec(`
    insert into auth.users(id, email)
    select ('20000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
      'synthetic-' || n || '@example.test'
    from generate_series(1, 3000) as n;
    update public.profiles set role = 'admin'
    where id = '20000000-0000-4000-8000-000000000001';
    insert into public.user_preferences(user_id, preferences)
    select id, '{"units":"metric"}'::jsonb from auth.users;
    insert into public.trainer_invites(code, created_by, used_by)
    select 'SYNTHETIC-' || n,
      ('20000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
      case when n % 2 = 0 then ('20000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid end
    from generate_series(1, 3000) as n;
    analyze public.profiles;
    analyze public.user_preferences;
    analyze public.trainer_invites;
  `);
  report.plans.before = await queryPlans();
  await runFile(migration);
  const optimizedPolicies = await policySnapshot();
  assert.deepEqual(
    optimizedPolicies.map(({ qual: _qual, with_check: _check, ...scope }) => scope),
    initialPolicies.map(({ qual: _qual, with_check: _check, ...scope }) => scope),
    'Policy names, roles, permissiveness, and commands must remain unchanged',
  );
  assert.deepEqual(
    optimizedPolicies.filter(p => p.qual?.includes('is_trainer_of') || p.with_check?.includes('is_trainer_of')),
    initialPolicies.filter(p => p.qual?.includes('is_trainer_of') || p.with_check?.includes('is_trainer_of')),
    'Row-dependent trainer policies must remain unchanged',
  );
  const optimizedIndexes = await indexSnapshot();
  for (const name of ['workout_plans_user_id_idx', 'user_preferences_user_id_idx']) {
    assert.equal(optimizedIndexes.some(index => index.indexname === name), false);
  }
  for (const name of ['workout_plans_user_id_key', 'user_preferences_user_id_key', 'trainer_invites_created_by_idx', 'trainer_invites_used_by_idx']) {
    assert.equal(optimizedIndexes.some(index => index.indexname === name), true);
  }
  await verifyAuthorization('after');
  report.plans.after = await queryPlans();
  assert.ok(report.plans.after.preferenceInitPlans.length >= 2, 'Caller checks must produce initPlans');
  assert.ok(report.plans.after.preferenceInitPlans.every(plan => plan.loops <= 1), 'Caller checks must not run per visible row');
  assert.ok(report.plans.after.invitationAccess.some(plan => plan.index === 'trainer_invites_created_by_idx'), 'Invitation lookup should use the new covering index');
  report.checks.push('Policy scope preserved', 'Trainer predicates unchanged', 'Unique constraints retained', 'Caller checks execute as initPlans', 'Invitation lookup uses its covering index');

  await runFile(rollback);
  assert.deepEqual(await policySnapshot(), initialPolicies, 'Rollback must restore every original policy expression');
  assert.deepEqual(await indexSnapshot(), initialIndexes, 'Rollback must restore the original index definitions');
  await verifyAuthorization('rolled_back');
  report.checks.push('Rollback restores original policies and indexes');

  // A policy edited after review must stop the complete migration. This checks
  // transactional failure rather than silently replacing an unknown rule.
  await db.exec('alter policy "workout_plans - select own" on public.workout_plans using (false)');
  let driftRejected = false;
  try {
    await runFile(migration);
  } catch (error) {
    driftRejected = error.message.includes('Unexpected policy expression');
    await db.exec('rollback');
  }
  assert.equal(driftRejected, true, 'Unexpected policy changes must reject the migration');
  assert.deepEqual(await indexSnapshot(), initialIndexes, 'Failed preflight must not change indexes');
  report.checks.push('Policy drift aborts the migration without index changes');

  await db.exec('alter policy "workout_plans - select own" on public.workout_plans using (auth.uid() = user_id)');
  await db.exec('alter table public.user_preferences drop constraint user_preferences_user_id_key');
  const beforeInvalidIndex = await indexSnapshot();
  let missingConstraintRejected = false;
  try {
    await runFile(migration);
  } catch (error) {
    missingConstraintRejected = error.message.includes('Missing valid unique user_id constraint');
    await db.exec('rollback');
  }
  assert.equal(missingConstraintRejected, true, 'Index removal must require the retained unique constraint');
  assert.deepEqual(await indexSnapshot(), beforeInvalidIndex, 'Failed uniqueness preflight must not change indexes');
  assert.deepEqual(await policySnapshot(), initialPolicies, 'Failed uniqueness preflight must not change policies');
  report.checks.push('Missing unique constraint aborts before policy or index changes');
  report.result = 'passed';
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  await db.close();
}
