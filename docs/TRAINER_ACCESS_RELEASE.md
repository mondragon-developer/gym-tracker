# Trainer access release

Prepared 2026-10-02. Release verification is recorded below.

## Behavior

- An invitation URL opens **Connected trainers**, with the code filled in. It does not grant access.
- **Review invitation** shows the trainer's self-reported display name, the access scope, and an identity/qualification warning. **Allow this trainer to view and edit my workouts** is the grant action.
- Changing the code clears the reviewed identity. The server checks that the code still belongs to that same active trainer when approval arrives.
- Signup stores `pending_trainer_code` as a reminder. After email confirmation, sign-in and the legal gate, the user reviews the invitation. No client link is created by the signup trigger, including when an old frontend sends `trainer_code`.
- Profile → **Connected trainers** lists existing connections. **Remove access** deletes only the caller's relationship. It keeps workouts and other clients' connections.
- Errors do not report successful approval or removal. A failed list refresh after a successful mutation is reported separately.
- English and Spanish are included. The disclosure version is `2026-10-02`; a new self-service link records server time, version and language. Existing links are not backfilled with fictional consent.

## Deployment order

1. Apply the existing schema/setup files to staging, then run [`supabase/trainer-access.sql`](../supabase/trainer-access.sql) **last**. Do not re-run `multi-trainer.sql` or earlier trigger migrations afterward without reapplying this migration.
2. Run [`supabase/tests/trainer-access.sql`](../supabase/tests/trainer-access.sql) as the staging SQL editor owner. It creates synthetic fixtures inside a transaction and rolls back. Any assertion failure blocks release; issue `ROLLBACK` after an aborted transaction.
3. Test the staging UI with an ordinary client and two independent trainer accounts. Confirm invite review/cancel, signup confirmation on another device, both languages, a revoked/changed code, offline errors and removal while the trainer editor is open. A subsequent save/read by the removed trainer must be denied. Previously downloaded information cannot be recalled.
4. Apply the migration to production before deploying the frontend. Old frontends temporarily fail when trying to join a trainer; existing workouts and links are preserved. Update both in one release window and prompt testers to reload their installed PWA.
5. Verify the deployed client against the acceptance cases above. Record the migration date, frontend commit, operator and staging results here.

The isolated PostgreSQL 17 migration and rollback-only SQL regression passed on 2026-10-02, including a second migration application and repeated regression. The local fixture supplies Supabase-compatible auth roles/auth.uid and applies the repository schema; it is not a full hosted Supabase stack. Production's relevant policies and signup function were inspected before deployment. No real account or workout data was used in these tests.

## Rollback and limitations

- Prefer a forward fix. Reverting only the frontend leaves old automatic joins denied, intentionally. Do not restore the old join grant or signup auto-link trigger as an availability workaround.
- Existing links and administrator assignment powers are preserved. This release does **not** claim every historical/admin-created link has client approval. Decide with counsel whether those assignments must move to a client-approval queue; implement that before making a universal consent claim.
- Staff/admin access is separate from trainer access. Removing a trainer relationship does not revoke an administrator's independent privileges.
- Removal blocks subsequent database access through the relationship, not information already loaded/exported or a transaction already authorized before removal.
- Link consent fields disappear with the relationship or account. They are not an immutable historical audit log. Counsel must decide retention before adding one.
- Preview reveals only a display name and trainer id to authenticated holders of a valid code, not email. Names are user-supplied; this is not credential verification. Production RPC/signup rate limits remain an operational check.
- Pending invitation metadata is cleared when the review window closes. If this cleanup fails offline, it may appear again next session, but never grants access automatically.

## Local validation

- Full test suite: 457 passing tests after the trainer-access changes.
- ESLint: passed.
- Production build: passed; the pre-existing large main-chunk warning remains.
- Dialog layout: inspected in a local browser with synthetic data, without live account changes.
- Isolated PostgreSQL SQL regression: passed twice, including migration idempotence, signup without auto-link, reviewed identity checks, language/version evidence, two trainers/two clients, and removal blocking later reads/edits.
- Browser layout: synthetic fixture only; a full hosted staging signup/email flow has not been exercised.
- Production migration and frontend deployment: pending at release preparation.
