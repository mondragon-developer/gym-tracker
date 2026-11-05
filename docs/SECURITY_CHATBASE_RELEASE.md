# Security and Chatbase release

Prepared 2026-11-05. Anthropic integration is deferred. Chatbase remains the
assistant provider and GPT-6 Luna remains the selected dashboard model.

## Changes

- Workout request variations in English and Spanish use one GYMPLAN v1 flow.
  A single-day request includes only that day. A revision returns the complete
  revised draft. The app previews changes before the user applies them.
- The welcome message and persistent suggestions explain creation and import.
- The widget is closed and its user/chat reset is requested on account changes
  and unmount. Pending import suggestions are cleared. A new page load requests
  a fresh anonymous chat. This is not signed Chatbase identity or deletion of
  Chatbase's stored conversations.
- Plan extraction and parsing reject input over 20,000 characters.
- Response headers restrict framing, base URLs and objects, disable MIME
  sniffing, and reduce cross-origin referrer information. The CSP intentionally
  does not claim comprehensive script isolation.
- Database role helpers no longer have unnecessary anonymous execution grants.
  Trigger functions are not exposed as client RPCs. Existing owner, trainer and
  administrator data scopes are retained.
- Invitation sending reserves an atomic database quota before contacting Brevo:
  5 attempts per 10 minutes and 30 per 24 hours per trainer, 200 per 24 hours
  project-wide. Provider failures count. Database errors fail closed.

## Deployment record

- Applied `supabase/security-hardening.sql` to linked project
  `dtzovlvgmymlptprdxcz` on 2026-11-05.
- Applied `supabase/invite-rate-limit.sql`, then deployed `send-invite`.
- The deployed invitation endpoint returned HTTP 401 to an unauthenticated
  POST. No invitation email was sent by this check.
- Chatbase monthly cap: 500 credits, selected by the owner and verified after
  reloading Settings. This allowance is separate from Anthropic credits.
- Chatbase domain allowlist: `https://gym.mdragonsolutions.com`; direct iframe
  access blocking enabled. Saved through the immediate-change confirmation.
- Chatbase instructions/display are currently a draft. Source refresh and
  publication are in progress. Frontend deployment is pending.

## Validation

- Full Vitest suite: 68 files, 495 tests passed.
- ESLint and production build passed. The existing large chunk warning remains.
- Dependency audit reported zero vulnerabilities at the time of this review.
- Isolated PGlite schema fixture applied both security migrations twice, then
  passed `supabase/tests/trainer-access.sql` and
  `supabase/tests/security-hardening.sql`. This fixture is not a hosted Supabase
  stack. Concurrent worker behavior is serialized by a PostgreSQL advisory
  transaction lock; the local fixture did not exercise multiple connections.
- Draft Chatbase preview returned valid-looking GYMPLAN blocks for an English
  Wednesday leg request, a Spanish Monday/Wednesday request, and the follow-up
  removing Monday. Exercise names were checked against the app's library.

## Operations and limits

For a new environment, apply the existing schema and trainer-access migration,
then security-hardening.sql and invite-rate-limit.sql before deploying
send-invite. Run the rollback-only SQL tests in an isolated staging database,
never against real user accounts. Reapplying earlier permission migrations
can restore old grants, so reapply the hardening last.

The Chatbase cap stops responses until its allowance resets or the owner
raises it. Domain restrictions reduce casual third-party embedding but do not
authenticate users. Signed identity and per-user chat quotas are not part of
this release. Prompt instructions improve consistency but cannot guarantee
every model response. Copy/paste import remains the fallback.

Supabase still reports leaked-password protection disabled. No paid plan
upgrade was made. Its remaining SECURITY DEFINER warnings include intentional
boolean pre-signup invite lookups and authenticated app RPCs. These are not
evidence that every advisor warning is fixed. This was a targeted review,
not a full penetration test.

No production workouts, trainer relationships, passwords or API keys were
changed during the review. Reverting the frontend does not remove database
quotas. Prefer a forward fix over reopening anonymous function access.
