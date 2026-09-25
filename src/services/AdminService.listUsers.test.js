import { describe, it, expect, vi } from 'vitest';

const calls = vi.hoisted(() => []);
const results = vi.hoisted(() => []);
vi.mock('../lib/supabase.js', () => ({
    supabase: {
        from: () => ({
            select: (columns) => {
                calls.push(columns);
                return { order: () => Promise.resolve(results.shift()) };
            }
        })
    }
}));

import { adminService } from './AdminService.js';

describe('AdminService.listUsers', () => {
    it('loads without activity while last_active_at does not exist yet', async () => {
        results.push(
            { data: null, error: { code: '42703', message: 'column profiles.last_active_at does not exist' } },
            { data: [{ id: 'u1', email: 'a@b.c', role: 'user', invite_code: null, created_at: '2026-01-01' }], error: null }
        );
        const users = await adminService.listUsers();
        expect(calls[0]).toContain('last_active_at');
        expect(calls[1]).not.toContain('last_active_at');
        expect(users).toEqual([{ id: 'u1', email: 'a@b.c', role: 'user', inviteCode: null, createdAt: '2026-01-01', lastActiveAt: null }]);
    });
});
