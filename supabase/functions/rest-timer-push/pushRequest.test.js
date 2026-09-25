import { describe, it, expect } from 'vitest';
import { parseSchedule, isAllowedEndpoint, MAX_DELAY_MS } from './pushRequest.js';

const NOW = 1_800_000_000_000;
const sub = (endpoint = 'https://web.push.apple.com/QGx') => ({
    endpoint,
    keys: { p256dh: 'BPk', auth: 'aut' }
});

describe('isAllowedEndpoint', () => {
    it('accepts the browser push services', () => {
        expect(isAllowedEndpoint('https://web.push.apple.com/abc')).toBe(true);
        expect(isAllowedEndpoint('https://fcm.googleapis.com/fcm/send/abc')).toBe(true);
        expect(isAllowedEndpoint('https://updates.push.services.mozilla.com/wpush/v2/abc')).toBe(true);
    });

    it('rejects anything else, so the server cannot be pointed at other URLs', () => {
        expect(isAllowedEndpoint('https://example.com/push')).toBe(false);
        expect(isAllowedEndpoint('http://fcm.googleapis.com/fcm/send/abc')).toBe(false);
        expect(isAllowedEndpoint('https://fcm.googleapis.com.evil.io/x')).toBe(false);
        expect(isAllowedEndpoint('https://localhost/x')).toBe(false);
        expect(isAllowedEndpoint(undefined)).toBe(false);
    });
});

describe('parseSchedule', () => {
    it('accepts a rest ending within the limit and trims the text', () => {
        const result = parseSchedule({ endsAt: NOW + 90_000, subscription: sub(), title: '  Vamos  ', body: 'Tiempo' }, NOW);
        expect(result.ok).toBe(true);
        expect(result.value.delay).toBe(90_000);
        expect(result.value.title).toBe('Vamos');
        expect(result.value.subscription.endpoint).toBe('https://web.push.apple.com/QGx');
    });

    it('rejects end times in the past or beyond what the function can wait', () => {
        expect(parseSchedule({ endsAt: NOW - 1, subscription: sub() }, NOW).ok).toBe(false);
        expect(parseSchedule({ endsAt: NOW + MAX_DELAY_MS + 1, subscription: sub() }, NOW).ok).toBe(false);
        expect(parseSchedule({ endsAt: 'soon', subscription: sub() }, NOW).ok).toBe(false);
    });

    it('rejects a subscription without keys or on a foreign host', () => {
        expect(parseSchedule({ endsAt: NOW + 1000, subscription: { endpoint: sub().endpoint } }, NOW).ok).toBe(false);
        expect(parseSchedule({ endsAt: NOW + 1000, subscription: sub('https://example.com/x') }, NOW).ok).toBe(false);
    });

    it('falls back to the default title and caps long text', () => {
        const result = parseSchedule({ endsAt: NOW + 1000, subscription: sub(), body: 'x'.repeat(500) }, NOW);
        expect(result.value.title).toBe("Let's go!");
        expect(result.value.body).toHaveLength(120);
    });

    it('takes the time left from the app and sets the end on the server clock', () => {
        const result = parseSchedule({ delayMs: 30_000, subscription: sub() }, NOW);
        expect(result.ok).toBe(true);
        expect(result.value.delay).toBe(30_000);
        expect(result.value.endsAt).toBe(NOW + 30_000);
        expect(parseSchedule({ delayMs: MAX_DELAY_MS + 1, subscription: sub() }, NOW).ok).toBe(false);
        expect(parseSchedule({ delayMs: 0, subscription: sub() }, NOW).ok).toBe(false);
        expect(parseSchedule({ subscription: sub() }, NOW).ok).toBe(false);
    });
});
