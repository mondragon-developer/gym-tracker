# Database Access Optimization

## Scope and deployment status

This release prepares a targeted optimization of the existing PostgreSQL access paths. The SQL has been verified in disposable PostgreSQL 17 using synthetic data. It has not been applied to the hosted Supabase project by this change.

The migration was created with Supabase CLI 3.2.0 using `supabase migration new optimize_workout_access`. Its path is:

- Forward: `supabase/migrations/20261122211855_optimize_workout_access.sql`
- Rollback: `supabase/rollbacks/20261122211855_optimize_workout_access.sql`

The repository's existing standalone setup scripts remain prerequisites. The new migrations directory contains an incremental change, not a complete database bootstrap. Do not run a migration command against an empty database and assume it installs the application schema.

## What changes

1. Twenty existing policies use scalar subqueries for caller-only `auth.uid()` and `is_admin()` checks. PostgreSQL can evaluate these as statement-level initPlans rather than repeatedly evaluating them for every candidate row.
2. The four policies containing the row-dependent `is_trainer_of(id)` or `is_trainer_of(user_id)` predicate remain unchanged.
3. The redundant nonunique `workout_plans_user_id_idx` and `user_preferences_user_id_idx` indexes are removed. Their unique `user_id` constraints and supporting indexes are retained.
4. Two indexes cover foreign-key lookups on `trainer_invites.created_by` and `trainer_invites.used_by`. These support finding invitation rows when a referenced profile is deleted: the former relationship cascades and the latter sets the reference to null.

The change does not alter policy roles, policy commands, grants, the role-helper functions, trainer consent, workout payloads, or optimistic save-version checks. It does not merge permissive policies or remove unrelated indexes labeled unused.

Supabase describes the statement-level optimization and its row-independence requirement in its [RLS performance guidance](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select).

## Preconditions and drift checks

Apply the existing setup scripts in their established order, including `trainer-access.sql`, `invite-rate-limit.sql`, and `security-hardening.sql`, before this migration.

The migration compares the twenty targeted policies against the reviewed hardened baseline. It requires the expected policy expressions, commands, permissiveness, and `authenticated` scope. It also checks that both retained unique constraints are valid, that the two indexes being removed have their expected definitions, and that the two new index names are not already present.

Unexpected state aborts the transaction. Review the difference rather than deleting a preflight guard to force deployment. This versioned migration is intended to run once; rerunning it after successful application is rejected by the baseline checks.

The forward and rollback scripts use a three-second lock timeout and a thirty-second statement timeout. They run transactionally. These bounded settings are intended to fail instead of waiting indefinitely for a busy table. Validate the actual table sizes and lock behavior in the target staging environment. A substantially larger installation may need a separately reviewed concurrent-index procedure rather than increasing the timeout without analysis.

## Local verification

The verification harness creates an in-memory PostgreSQL instance and never accepts a database URL. It cannot connect to the hosted Supabase project. The test dependency is installed outside the application and is not shipped to users.

From the repository root:

```bash
gym_db_test_dir="$(mktemp -d)"
npm install --prefix "$gym_db_test_dir" --no-audit --no-fund --save-exact @electric-sql/pglite@0.3.14
PGLITE_MODULE="$gym_db_test_dir/node_modules/@electric-sql/pglite/dist/index.js" \
  node scripts/verify-database-optimizations.mjs > "$gym_db_test_dir/results.json"
```

The harness requires the pinned PGlite version and verifies that the embedded PostgreSQL major version is 17. It loads the actual repository setup SQL into a minimal synthetic Supabase auth environment, runs the migration and rollback, and reports its results as JSON.

It runs these fixtures before the migration, after the migration, and after rollback:

- `supabase/tests/workout-access-optimization.sql`
- `supabase/tests/trainer-access.sql`
- `supabase/tests/security-hardening.sql`

The new fixture exercises owner reads and writes, denied cross-owner writes, denied ownership reassignment, self-promotion rejection, ordinary profile self-insertion, approved trainer read/write access, denied trainer deletion, unrelated trainer denial, anonymous denial, administrator access, trainer-link removal, and immediate loss of access after removal or demotion.

Additional checks verify unchanged policy scope, unchanged row-dependent trainer predicates, retained unique constraints, exact rollback of policies and indexes, transactional rejection of policy drift, and rejection when a required unique constraint is missing.

These fixtures insert synthetic users and modify schema in a disposable environment. Do not execute them against production, even though their fixture transactions roll back. A rollback does not make a production test free of locks, triggers, logging, or operational side effects.

## Recorded evidence

The committed [local verification result](performance/database-access-optimization.json) records the runtime, fixture outcomes, five warm execution observations per query phase, and complete JSON query plans for a 3,000-row synthetic dataset.

The meaningful plan changes are:

- The administrator's preference read obtains two initPlans for the caller checks, each with one execution in the observed plan.
- The invitation lookup by `created_by` uses `trainer_invites_created_by_idx` after migration, whereas the baseline uses a sequential scan.
- All three authorization suites pass at each of the three schema stages.
- Rollback restores the original policy and index metadata exactly.

The execution times are local observations from PostgreSQL compiled to WebAssembly. They are not production latency targets, a hosted throughput benchmark, or evidence that the application supports 300 concurrent users. The timing values are intentionally not test pass/fail thresholds.

The harness models SQL authorization with synthetic roles and `auth.uid()`. It does not reproduce the hosted Auth service, PostgREST, extensions, connection pooling, multi-connection contention, network time, or the project's PostgreSQL minor version exactly. Those require staging verification.

## Staging release procedure

1. Record the current schema revision and review the targeted policy/index definitions. Confirm that all prerequisite scripts, especially security hardening and trainer consent, are present.
2. Retain the current definitions and an appropriate database recovery point using the project's normal release process.
3. Apply the forward migration to an isolated staging database. Use the script as a single transaction. If using CLI migration tracking, reconcile the existing manually managed schema history first; do not invent a history baseline or repair hosted history as part of this optimization.
4. Run the SQL access fixtures in staging with synthetic users and verify relevant application flows with owner, approved trainer, unrelated user, administrator, and revoked trainer accounts.
5. Inspect representative query plans and application latency with the actual runtime, authorization, and dataset. Confirm the remaining unique indexes continue to serve the application's `user_id` lookup.
6. Run the Supabase performance advisor. The caller-auth reevaluation findings should be reassessed; multiple permissive-policy warnings may remain because role scopes were deliberately preserved.
7. Verify the rollback in staging, then reapply the forward migration. Confirm that current and older frontends continue to read and save plans with their existing conflict checks.
8. Apply the reviewed migration through the project's normal database release process. A frontend deployment alone does not run this SQL file.

If the transaction fails, issue `ROLLBACK` in the same SQL session if the client leaves an aborted transaction open. Investigate the failure before retrying. Do not remove a drift or uniqueness guard merely to obtain a successful run.

## Rollback

Run the rollback SQL once against a database with this migration applied and no conflicting changes to the targeted objects. Its preflight validates the optimized predicates and expected index state. It restores the reviewed original predicates and original nonunique indexes, then removes the two invitation indexes introduced by the forward migration.

Rollback does not change application data or revert unrelated database changes. If policy or index definitions have evolved since this release, prepare a reviewed follow-up migration rather than overwriting that newer state. If a migration tracker was used, reconcile its recorded status according to the project's established process after a rollback; do not leave the schema and migration history disagreeing.

## Deferred work

The growing whole-history JSON document, large-scale history pagination, additional ordering/search indexes, and a different database topology remain measurement-driven decisions. This release does not add frame-level persistence or claim that caching can replace the measurement of a new movement.
