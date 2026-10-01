/**
 * Acceptance of the Terms of Use and Privacy Policy
 * (supabase/legal-acceptance.sql). The database row is the record; the
 * copy in localStorage only lets an account that already accepted open
 * the app without waiting for the network, or with none. It is dropped as
 * soon as the database says there is no row, so editing it by hand does
 * not get past the consent screen.
 */

import { supabase } from '../lib/supabase.js';
import { LEGAL_VERSION } from '../legal/version.js';

const ACCEPTED_KEY_PREFIX = 'gymAppLegalAccepted:';

export const hasAcceptedLocally = (userId, version = LEGAL_VERSION) => {
    if (!userId) return false;
    try {
        return localStorage.getItem(ACCEPTED_KEY_PREFIX + userId) === version;
    } catch {
        return false;
    }
};

const rememberAccepted = (userId, version) => {
    try {
        localStorage.setItem(ACCEPTED_KEY_PREFIX + userId, version);
    } catch {
        // Storage blocked: the next open asks the database again.
    }
};

const forgetAccepted = (userId) => {
    try {
        localStorage.removeItem(ACCEPTED_KEY_PREFIX + userId);
    } catch {
        // Storage blocked: there is no local copy to drop.
    }
};

/**
 * Whether this account has accepted the current version.
 * @returns {Promise<boolean|null>} null when the database could not be
 * reached, so the caller can tell "not accepted" from "unknown".
 */
export const fetchAccepted = async (userId, version = LEGAL_VERSION) => {
    if (!userId) return false;
    try {
        const { data, error } = await supabase
            .from('legal_acceptances')
            .select('accepted_at')
            .eq('user_id', userId)
            .eq('version', version)
            .maybeSingle();
        if (error) return null;
        if (data) rememberAccepted(userId, version);
        else forgetAccepted(userId);
        return Boolean(data);
    } catch {
        return null;
    }
};

/**
 * Records the acceptance. The app only opens once the database has it:
 * an agreement that was never stored proves nothing later.
 * @returns {Promise<boolean>}
 */
export const recordAcceptance = async (userId, language, version = LEGAL_VERSION) => {
    if (!userId) return false;
    try {
        const { data, error } = await supabase.rpc('accept_legal_terms', {
            p_version: version,
            p_language: language === 'es' ? 'es' : 'en'
        });
        if (error || !data) return false;
        rememberAccepted(userId, version);
        return true;
    } catch {
        return false;
    }
};
