import { describe, it, expect, vi } from 'vitest';
import { sendInvitation } from './sendInvitation.js';

describe('invitation abuse controls', () => {
    const run = (rpcResult, fetchFn = vi.fn()) => {
        const service = { rpc: vi.fn().mockResolvedValue(rpcResult) };
        return { service, fetchFn, result: sendInvitation({ service, fetchFn, userId: 'verified-user', apiKey: 'test-only', message: { subject: 'Test' } }) };
    };
    it.each([{ data: false }, { error: { message: 'database down' } }, { data: null }])('does not send without a successful reservation: %j', async (value) => {
        const { fetchFn, result } = run(value);
        expect((await result).status).toBe(value.data === false ? 429 : 503);
        expect(fetchFn).not.toHaveBeenCalled();
    });
    it('reserves for the verified caller and sends once', async () => {
        const { service, fetchFn, result } = run({ data: true }, vi.fn().mockResolvedValue({ ok: true }));
        expect(await result).toEqual({ status: 200, body: { sent: true } });
        expect(service.rpc).toHaveBeenCalledWith('reserve_invite_send', { caller_id: 'verified-user' });
        expect(fetchFn).toHaveBeenCalledTimes(1);
    });
    it('does not return provider details or refund failed attempts', async () => {
        const response = { ok: false, text: vi.fn().mockResolvedValue('private provider details') };
        const { service, result } = run({ data: true }, vi.fn().mockResolvedValue(response));
        expect(await result).toEqual({ status: 502, body: { error: 'Could not send the invitation.' } });
        expect(response.text).not.toHaveBeenCalled();
        expect(service.rpc).toHaveBeenCalledTimes(1);
    });
    it('handles database and provider exceptions without leaking their messages', async () => {
        for (const failAt of ['rpc', 'fetch']) {
            const service = { rpc: vi.fn().mockResolvedValue({ data: true }) };
            const fetchFn = vi.fn().mockResolvedValue({ ok: true });
            (failAt === 'rpc' ? service.rpc : fetchFn).mockRejectedValue(new Error('secret'));
            const result = await sendInvitation({ service, fetchFn, userId: 'u', apiKey: 'k', message: {} });
            expect(result.status).toBe(503);
            expect(JSON.stringify(result)).not.toContain('secret');
            if (failAt === 'rpc') expect(fetchFn).not.toHaveBeenCalled();
        }
    });
});
