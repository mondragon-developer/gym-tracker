/**
 * Client side of the server-sent end-of-rest notification (see
 * supabase/functions/rest-timer-push). The server push is what reaches an
 * iPhone, where the page is frozen in the background; every call here
 * degrades to null/false so the timer works the same without it.
 */

import { supabase } from '../lib/supabase.js';
import { VAPID_PUBLIC_KEY } from '../constants/push.js';

const FUNCTION_NAME = 'rest-timer-push';

// Must match MAX_DELAY_MS in the function: longer rests fall back to the
// in-app alert and the page notification.
export const MAX_PUSH_DELAY_MS = 140 * 1000;

const isIOS = () => typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
);

const isStandalone = () => {
    try {
        return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    } catch {
        return false;
    }
};

/**
 * True where a push subscription is possible. iOS only offers Web Push to
 * an app opened from the home screen, and there Notification only exists
 * in that mode.
 */
export const canUsePush = () => {
    if (typeof window === 'undefined') return false;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return false;
    if (isIOS() && !isStandalone()) return false;
    return true;
};

/** iPhone in Safari: push would work after Add to Home Screen. */
export const needsHomeScreenForPush = () => typeof window !== 'undefined' && isIOS() && !isStandalone();

const urlBase64ToUint8Array = (base64) => {
    const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(padded);
    return Uint8Array.from(raw, ch => ch.charCodeAt(0));
};

// Browsers that do not report the key (null) are trusted to match.
const sameKey = (buffer, key) => {
    if (!buffer) return true;
    const bytes = new Uint8Array(buffer);
    return bytes.length === key.length && bytes.every((b, i) => b === key[i]);
};

/**
 * Asks for permission when undecided and returns this device's push
 * subscription, or null. Call it from a tap: iOS rejects the permission
 * request otherwise.
 */
export const ensurePushSubscription = async () => {
    if (!canUsePush()) return null;
    try {
        let permission = Notification.permission;
        if (permission === 'default') permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;
        const reg = await navigator.serviceWorker.ready;
        const key = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
            if (sameKey(existing.options?.applicationServerKey, key)) return existing;
            // Made for an older key pair: the server can no longer sign for it.
            await existing.unsubscribe();
        }
        return await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    } catch {
        return null;
    }
};

/**
 * Asks the server to push at endsAt. Resolves to the scheduled id, or null
 * when push is unavailable, the rest is too long, or the call failed.
 */
export const scheduleRestPush = async (subscription, endsAt, title, body) => {
    if (!subscription || endsAt - Date.now() > MAX_PUSH_DELAY_MS) return null;
    try {
        const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
            body: { action: 'schedule', delayMs: endsAt - Date.now(), subscription: subscription.toJSON(), title, body }
        });
        if (error || !data?.id) return null;
        return data.id;
    } catch {
        return null;
    }
};

export const cancelRestPush = (id) => {
    if (!id) return;
    supabase.functions.invoke(FUNCTION_NAME, { body: { action: 'cancel', id } }).catch(() => {});
};
