/**
 * Trainer-invite race notice helpers.
 *
 * Single-use trainer invitations are validated on the sign-up form and then
 * consumed by a database trigger when the account is created. If the invite
 * is consumed by someone else in between, the account ends up as a regular
 * user (fail-closed) with the invite code still in its auth metadata. These
 * helpers detect that case so the UI can explain it once, and remember the
 * dismissal per user.
 */

const dismissedKey = (userId) => `invite-notice-dismissed:${userId}`;

/**
 * Whether the signed-in user signed up through a trainer invitation but did
 * not receive the trainer role (the invite was consumed before their signup
 * ran). Admins are excluded: they already outrank the trainer role.
 * @param {object|null} user - The Supabase auth user (reads user_metadata).
 * @param {string} role - The resolved profile role.
 * @returns {boolean}
 */
export const isInviteNoticeRelevant = (user, role) =>
    Boolean(user?.user_metadata?.trainer_invite_code) && role !== 'trainer' && role !== 'admin';

/**
 * Whether the user already dismissed the notice. localStorage failures
 * (private mode) fall back to showing it.
 * @param {string} userId
 * @returns {boolean}
 */
export const isInviteNoticeDismissed = (userId) => {
    try {
        return localStorage.getItem(dismissedKey(userId)) === '1';
    } catch {
        return false;
    }
};

/**
 * Permanently dismiss the notice for a user.
 * @param {string} userId
 */
export const dismissInviteNotice = (userId) => {
    try {
        localStorage.setItem(dismissedKey(userId), '1');
    } catch {
        // Storage unavailable: the notice simply appears again next sign-in.
    }
};
