import { describe, it, expect, vi, beforeEach } from 'vitest';

const api = vi.hoisted(() => ({ rpc: vi.fn(), maybeSingle: vi.fn(), eq: vi.fn() }));
vi.mock('../lib/supabase.js', () => {
    const query = {
        select: () => query,
        eq: (...args) => { api.eq(...args); return query; },
        maybeSingle: api.maybeSingle
    };
    return { supabase: { rpc: api.rpc, from: () => query } };
});

import { hasAcceptedLocally, fetchAccepted, recordAcceptance } from './LegalService.js';
import { LEGAL_VERSION } from '../legal/version.js';

beforeEach(() => {
    localStorage.clear();
    api.rpc.mockReset();
    api.maybeSingle.mockReset();
    api.eq.mockReset();
});

describe('fetchAccepted', () => {
    it('reports an existing row and remembers it for this account only', async () => {
        api.maybeSingle.mockResolvedValue({ data: { accepted_at: '2026-10-01T12:00:00Z' }, error: null });
        await expect(fetchAccepted('u1')).resolves.toBe(true);
        expect(api.eq).toHaveBeenCalledWith('user_id', 'u1');
        expect(api.eq).toHaveBeenCalledWith('version', LEGAL_VERSION);
        expect(hasAcceptedLocally('u1')).toBe(true);
        expect(hasAcceptedLocally('u2')).toBe(false);
    });

    it('tells "no row" apart from a failed read', async () => {
        api.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
        await expect(fetchAccepted('u1')).resolves.toBe(false);
        api.maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('down') });
        await expect(fetchAccepted('u1')).resolves.toBeNull();
        api.maybeSingle.mockRejectedValueOnce(new Error('offline'));
        await expect(fetchAccepted('u1')).resolves.toBeNull();
        expect(hasAcceptedLocally('u1')).toBe(false);
    });

    it('drops a local copy the database does not back, but keeps it through an outage', async () => {
        localStorage.setItem('gymAppLegalAccepted:u1', LEGAL_VERSION);
        api.maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('down') });
        await fetchAccepted('u1');
        expect(hasAcceptedLocally('u1')).toBe(true);
        api.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
        await expect(fetchAccepted('u1')).resolves.toBe(false);
        expect(hasAcceptedLocally('u1')).toBe(false);
    });
});

describe('recordAcceptance', () => {
    it('stores the version and language, then remembers the acceptance', async () => {
        api.rpc.mockResolvedValue({ data: '2026-10-01T12:00:00Z', error: null });
        await expect(recordAcceptance('u1', 'es')).resolves.toBe(true);
        expect(api.rpc).toHaveBeenCalledWith('accept_legal_terms', { p_version: LEGAL_VERSION, p_language: 'es' });
        expect(hasAcceptedLocally('u1')).toBe(true);
    });

    it('does not count as accepted when the database did not store it', async () => {
        api.rpc.mockResolvedValueOnce({ data: null, error: new Error('down') });
        await expect(recordAcceptance('u1', 'en')).resolves.toBe(false);
        api.rpc.mockRejectedValueOnce(new Error('offline'));
        await expect(recordAcceptance('u1', 'en')).resolves.toBe(false);
        expect(hasAcceptedLocally('u1')).toBe(false);
        await expect(recordAcceptance(null, 'en')).resolves.toBe(false);
    });
});

describe('hasAcceptedLocally', () => {
    it('asks again when the version changes', async () => {
        api.rpc.mockResolvedValue({ data: '2026-10-01T12:00:00Z', error: null });
        await recordAcceptance('u1', 'en', '2026-10-01');
        expect(hasAcceptedLocally('u1', '2026-10-01')).toBe(true);
        expect(hasAcceptedLocally('u1', '2027-01-15')).toBe(false);
    });
});
