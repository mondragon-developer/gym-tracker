/**
 * Account-level calls: the activity stamp behind the inactive-accounts view
 * (supabase/account-activity.sql) and self-service deletion
 * (supabase/functions/delete-account).
 */

import { supabase } from '../lib/supabase.js';

const TOUCH_KEY_PREFIX = 'gymAppLastActiveTouch:';
// The database only writes every 12 hours; skipping the call for 6 saves
// a request on every reload without losing a day of precision.
const TOUCH_EVERY_MS = 6 * 60 * 60 * 1000;

export const DELETE_CONFIRM_WORD = 'DELETE';

/**
 * Records that this account used the app. Never throws: activity tracking
 * must not get in the way of opening the app.
 */
export const touchLastActive = async (userId, now = Date.now()) => {
    if (!userId) return false;
    const key = TOUCH_KEY_PREFIX + userId;
    try {
        const last = Number(localStorage.getItem(key));
        if (last && now - last < TOUCH_EVERY_MS) return false;
    } catch {
        // Storage blocked: fall through and call the database.
    }
    try {
        const { error } = await supabase.rpc('touch_last_active');
        if (error) return false;
        try {
            localStorage.setItem(key, String(now));
        } catch {
            // Storage blocked: the next open simply calls again.
        }
        return true;
    } catch {
        return false;
    }
};

/**
 * Deletes the signed-in account and everything stored for it.
 * @returns {Promise<{ ok: true } | { ok: false, reason: 'admin' | 'failed' }>}
 */
export const deleteMyAccount = async () => {
    try {
        const { data, error } = await supabase.functions.invoke('delete-account', {
            body: { confirm: DELETE_CONFIRM_WORD }
        });
        if (data?.ok) return { ok: true };
        let message = data?.error;
        if (!message && error?.context && typeof error.context.json === 'function') {
            try {
                message = (await error.context.json())?.error;
            } catch {
                message = null;
            }
        }
        return { ok: false, reason: message === 'admin' ? 'admin' : 'failed' };
    } catch {
        return { ok: false, reason: 'failed' };
    }
};
