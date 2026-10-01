/**
 * Version of the Terms of Use and Privacy Policy that each account's
 * acceptance is recorded against (supabase/legal-acceptance.sql).
 *
 * Change it whenever the meaning of any text in legalText.js changes:
 * every account is then asked to accept again on its next visit. Fixing a
 * typo does not need a new version. Format YYYY-MM-DD, enforced by the
 * table's check constraint.
 *
 * Kept apart from the texts so the acceptance check does not pull both
 * documents into the main bundle.
 */
export const LEGAL_VERSION = '2026-10-01';
