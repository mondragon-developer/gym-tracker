import { describe, it, expect, vi, beforeEach } from 'vitest';

const api = vi.hoisted(() => ({ rpc: vi.fn(), invoke: vi.fn() }));
vi.mock('../lib/supabase.js', () => ({
    supabase: { rpc: api.rpc, functions: { invoke: api.invoke } }
}));

import { touchLastActive, deleteMyAccount } from './AccountService.js';

beforeEach(() => {
    localStorage.clear();
    api.rpc.mockClear();
    api.invoke.mockClear();
});

describe('touchLastActive', () => {
    it('calls the database at most every six hours per account', async () => {
        api.rpc.mockResolvedValue({ error: null });
        const t0 = Date.parse('2026-09-25T08:00:00Z');
        await expect(touchLastActive('u1', t0)).resolves.toBe(true);
        await expect(touchLastActive('u1', t0 + 60 * 60 * 1000)).resolves.toBe(false);
        await expect(touchLastActive('u2', t0 + 60 * 60 * 1000)).resolves.toBe(true);
        await expect(touchLastActive('u1', t0 + 7 * 60 * 60 * 1000)).resolves.toBe(true);
        expect(api.rpc).toHaveBeenCalledTimes(3);
        expect(api.rpc).toHaveBeenCalledWith('touch_last_active');
    });

    it('does nothing signed out and retries after a failed call', async () => {
        await expect(touchLastActive(null)).resolves.toBe(false);
        api.rpc.mockResolvedValueOnce({ error: new Error('down') }).mockResolvedValueOnce({ error: null });
        await expect(touchLastActive('u1')).resolves.toBe(false);
        await expect(touchLastActive('u1')).resolves.toBe(true);
    });
});

describe('deleteMyAccount', () => {
    it('sends the confirmation word and reports success', async () => {
        api.invoke.mockResolvedValue({ data: { ok: true }, error: null });
        await expect(deleteMyAccount()).resolves.toEqual({ ok: true });
        expect(api.invoke).toHaveBeenCalledWith('delete-account', { body: { confirm: 'DELETE' } });
    });

    it('tells an admin refusal apart from other failures', async () => {
        api.invoke.mockResolvedValue({ data: null, error: { context: { json: () => Promise.resolve({ error: 'admin' }) } } });
        await expect(deleteMyAccount()).resolves.toEqual({ ok: false, reason: 'admin' });
        api.invoke.mockResolvedValue({ data: null, error: { context: { json: () => Promise.resolve({ error: 'boom' }) } } });
        await expect(deleteMyAccount()).resolves.toEqual({ ok: false, reason: 'failed' });
    });
});
