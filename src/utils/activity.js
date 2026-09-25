/**
 * Account activity helpers for the admin dashboard. The planned inactivity
 * policy for free accounts warns at 60 days and deletes at 90 (see
 * docs/WISHLIST.md); the dashboard flags accounts past the warning point.
 */

import { t } from '../translations/ui';

export const INACTIVE_WARN_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days since the timestamp, or null when there is none. */
export const daysInactive = (lastActiveAt, now = Date.now()) => {
    const at = Date.parse(lastActiveAt ?? '');
    if (Number.isNaN(at)) return null;
    return Math.max(0, Math.floor((now - at) / DAY_MS));
};

/** Accounts with no stamp count as inactive: they never opened the app. */
export const isInactive = (lastActiveAt, now = Date.now()) => {
    const days = daysInactive(lastActiveAt, now);
    return days === null || days >= INACTIVE_WARN_DAYS;
};

export const activityLabel = (lastActiveAt, language = 'en', now = Date.now()) => {
    const days = daysInactive(lastActiveAt, now);
    if (days === null) return t('Never opened', language);
    if (days === 0) return t('Active today', language);
    return t('Active {n} days ago', language).replace('{n}', String(days));
};
