/**
 * Maps Supabase auth errors to friendly, translatable UI messages.
 *
 * Errors are matched by their stable `code` first, then by message content,
 * then by HTTP status. Anything unrecognized (including empty server bodies
 * rendered as "{}") falls back to a generic message, so raw API text never
 * reaches the UI. The returned string is an English translation key; pass it
 * through t() before rendering.
 */

/** Messages keyed by Supabase's stable error codes. */
const CODE_MESSAGES = {
    invalid_credentials: 'Incorrect email or password. Please try again.',
    email_not_confirmed: 'Please confirm your email before signing in. Check your inbox for the confirmation link.',
    user_already_exists: 'An account with this email already exists. Try signing in instead.',
    weak_password: 'Please choose a stronger password (at least 6 characters).',
    same_password: 'The new password must be different from the current one.',
    over_email_send_rate_limit: 'Too many emails requested. Please wait a while before trying again.',
    over_request_rate_limit: 'Too many attempts. Please wait a few minutes and try again.',
    otp_expired: 'That link is invalid or has expired. Please request a new one.',
    user_not_found: 'No account exists with this email.',
};

const TOO_MANY_ATTEMPTS = 'Too many attempts. Please wait a few minutes and try again.';
const CONNECTION_ERROR = 'Could not reach the server. Check your connection and try again.';
const GENERIC_MESSAGE = 'Something went wrong. Please try again in a moment.';

/** Substring rules for error shapes that carry no `code`. */
const MESSAGE_RULES = [
    ['invalid login credentials', CODE_MESSAGES.invalid_credentials],
    ['email not confirmed', CODE_MESSAGES.email_not_confirmed],
    ['already registered', CODE_MESSAGES.user_already_exists],
    ['rate limit', TOO_MANY_ATTEMPTS],
    ['failed to fetch', CONNECTION_ERROR],
    ['networkerror', CONNECTION_ERROR],
];

/**
 * Resolves a Supabase auth error to a friendly message (translation key).
 * @param {object|null} error - The error returned by supabase-js auth calls.
 * @returns {string} An English UI message, translatable via t().
 */
export const friendlyAuthError = (error) => {
    if (!error) return GENERIC_MESSAGE;

    if (error.code && CODE_MESSAGES[error.code]) {
        return CODE_MESSAGES[error.code];
    }

    const message = String(error.message || '').toLowerCase();
    for (const [needle, text] of MESSAGE_RULES) {
        if (message.includes(needle)) return text;
    }

    // Rate limiting also surfaces as a bare HTTP 429 with no clear message.
    if (error.status === 429) return TOO_MANY_ATTEMPTS;

    return GENERIC_MESSAGE;
};
