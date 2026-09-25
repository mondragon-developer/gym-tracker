import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const invoke = vi.hoisted(() => vi.fn());
vi.mock('../lib/supabase.js', () => ({ supabase: { functions: { invoke } } }));

import { canUsePush, needsHomeScreenForPush, scheduleRestPush, cancelRestPush, MAX_PUSH_DELAY_MS } from './restPush.js';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)';

const setUserAgent = (value) => Object.defineProperty(navigator, 'userAgent', { value, configurable: true });

describe('canUsePush', () => {
    beforeEach(() => {
        Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true });
        window.PushManager = function PushManager() {};
        window.Notification = { permission: 'default' };
        window.matchMedia = vi.fn(() => ({ matches: false }));
    });

    afterEach(() => {
        delete navigator.serviceWorker;
        delete navigator.userAgent;
        delete window.PushManager;
        delete window.Notification;
    });

    it('is available in a browser with service worker and push', () => {
        expect(canUsePush()).toBe(true);
    });

    it('needs the home screen app on iPhone', () => {
        setUserAgent(IPHONE);
        expect(canUsePush()).toBe(false);
        expect(needsHomeScreenForPush()).toBe(true);

        window.matchMedia = vi.fn(() => ({ matches: true }));
        expect(canUsePush()).toBe(true);
        expect(needsHomeScreenForPush()).toBe(false);
    });

    it('is off without the Push API', () => {
        delete window.PushManager;
        expect(canUsePush()).toBe(false);
    });
});

describe('scheduleRestPush', () => {
    const sub = { toJSON: () => ({ endpoint: 'https://fcm.googleapis.com/fcm/send/x', keys: { p256dh: 'a', auth: 'b' } }) };

    beforeEach(() => invoke.mockClear());

    it('sends the subscription and end time, and returns the id', async () => {
        invoke.mockResolvedValue({ data: { id: 'r1' }, error: null });
        const endsAt = Date.now() + 60_000;
        await expect(scheduleRestPush(sub, endsAt, 'Go', 'Time')).resolves.toBe('r1');
        expect(invoke).toHaveBeenCalledWith('rest-timer-push', {
            body: { action: 'schedule', endsAt, subscription: sub.toJSON(), title: 'Go', body: 'Time' }
        });
    });

    it('skips rests longer than the function can wait, and a missing subscription', async () => {
        await expect(scheduleRestPush(sub, Date.now() + MAX_PUSH_DELAY_MS + 5000, 'Go', '')).resolves.toBeNull();
        await expect(scheduleRestPush(null, Date.now() + 1000, 'Go', '')).resolves.toBeNull();
        expect(invoke).not.toHaveBeenCalled();
    });

    it('returns null when the function answers with an error', async () => {
        invoke.mockResolvedValue({ data: null, error: new Error('down') });
        await expect(scheduleRestPush(sub, Date.now() + 1000, 'Go', '')).resolves.toBeNull();
    });

    it('cancels by id and ignores a missing id', () => {
        invoke.mockResolvedValue({ data: { ok: true }, error: null });
        cancelRestPush(null);
        expect(invoke).not.toHaveBeenCalled();
        cancelRestPush('r1');
        expect(invoke).toHaveBeenCalledWith('rest-timer-push', { body: { action: 'cancel', id: 'r1' } });
    });
});
