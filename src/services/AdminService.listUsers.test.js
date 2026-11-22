import { beforeEach, describe, expect, it, vi } from 'vitest';

const queries = vi.hoisted(() => []);
const results = vi.hoisted(() => []);
vi.mock('../lib/supabase.js', () => ({
  supabase: {
    from: table => {
      const calls = [];
      const query = { then: (resolve, reject) => Promise.resolve(results.shift()).then(resolve, reject) };
      for (const method of ['select', 'order', 'range', 'ilike', 'neq', 'eq', 'or', 'in', 'maybeSingle', 'abortSignal']) {
        query[method] = (...args) => { calls.push([method, ...args]); return query; };
      }
      queries.push({ table, calls });
      return query;
    }
  }
}));

import { adminService } from './AdminService.js';

const profile = id => ({ id, email: id + '@example.com', role: 'user', invite_code: null, created_at: '2026-01-01' });

beforeEach(() => {
  queries.length = 0;
  results.length = 0;
});

describe('AdminService profile pagination', () => {
  it('returns a bounded page with a lookahead row and stable ordering', async () => {
    results.push({ data: [profile('u1'), profile('u2'), profile('u3')], error: null });
    const result = await adminService.listUsers({ page: 1, pageSize: 2 });

    expect(result.users.map(user => user.id)).toEqual(['u1', 'u2']);
    expect(result.hasMore).toBe(true);
    expect(queries[0].calls).toEqual([
      ['select', expect.stringContaining('last_active_at')],
      ['order', 'created_at', { ascending: true }],
      ['order', 'id', { ascending: true }],
      ['range', 2, 4],
    ]);
  });

  it('recognizes a final full page without counting the entire table', async () => {
    results.push({ data: [profile('u1'), profile('u2')], error: null });
    const result = await adminService.listUsers({ pageSize: 2 });
    expect(result.hasMore).toBe(false);
    expect(queries[0].calls.find(call => call[0] === 'select')).toHaveLength(2);
  });

  it('applies literal email, role, owner exclusion, and inactivity filters before pagination', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-22T12:00:00Z'));
    results.push({ data: [], error: null });
    try {
      await adminService.listUsers({ search: '  name_100%  ', role: 'trainer', excludeUserId: 'self', onlyInactive: true });
      expect(queries[0].calls).toEqual([
        ['select', expect.stringContaining('last_active_at')],
        ['ilike', 'email', '%name\\_100\\%%'],
        ['neq', 'id', 'self'],
        ['eq', 'role', 'trainer'],
        ['or', 'last_active_at.is.null,last_active_at.lte.2026-09-23T12:00:00.000Z'],
        ['order', 'created_at', { ascending: true }],
        ['order', 'id', { ascending: true }],
        ['range', 0, 25],
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('preserves pagination and filters when the activity migration is not installed', async () => {
    results.push(
      { data: null, error: { code: '42703', message: 'column profiles.last_active_at does not exist' } },
      { data: [profile('u1')], error: null }
    );
    const result = await adminService.listUsers({ page: 2, search: 'u1', onlyInactive: true });
    expect(queries[0].calls[0][1]).toContain('last_active_at');
    expect(queries[1].calls[0][1]).not.toContain('last_active_at');
    expect(queries[1].calls).toContainEqual(['ilike', 'email', '%u1%']);
    expect(queries[1].calls).toContainEqual(['range', 50, 75]);
    expect(queries[1].calls.some(call => call[0] === 'or')).toBe(false);
    expect(result).toEqual({
      users: [{ id: 'u1', email: 'u1@example.com', role: 'user', inviteCode: null, createdAt: '2026-01-01', lastActiveAt: null }],
      hasMore: false,
    });
  });

  it('does not retry a cancelled request through the legacy schema fallback', async () => {
    const controller = new AbortController();
    controller.abort();
    results.push({ data: null, error: { code: '42703' } });
    await expect(adminService.listUsers({ signal: controller.signal })).rejects.toEqual({ code: '42703' });
    expect(queries).toHaveLength(1);
    expect(queries[0].calls).toContainEqual(['abortSignal', controller.signal]);
  });

  it.each([{ page: -1 }, { page: 0.5 }, { pageSize: 0 }, { pageSize: 101 }])('rejects an unbounded or invalid page %j', async options => {
    await expect(adminService.listUsers(options)).rejects.toThrow(RangeError);
    expect(queries).toHaveLength(0);
  });

  it('loads the invite profile independently of filters and list pages', async () => {
    results.push({ data: { ...profile('self'), role: 'trainer', invite_code: 'INVITE' }, error: null });
    const result = await adminService.getUserProfile('self');
    expect(result.inviteCode).toBe('INVITE');
    expect(queries[0].calls).toEqual([
      ['select', 'id, email, role, invite_code, created_at'],
      ['eq', 'id', 'self'],
      ['maybeSingle'],
    ]);
  });
});

describe('AdminService assignment queries', () => {
  it('does not fetch the link table for an empty page', async () => {
    expect(await adminService.listTrainerLinks([])).toEqual([]);
    expect(queries).toHaveLength(0);
  });

  it('requires explicit bounded client IDs instead of fetching the whole link table', async () => {
    await expect(adminService.listTrainerLinks()).rejects.toThrow(RangeError);
    await expect(adminService.listTrainerLinks(Array.from({ length: 101 }, (_, i) => 'user-' + i))).rejects.toThrow(RangeError);
    expect(queries).toHaveLength(0);
  });

  it('fetches assignments and related trainer labels only for the visible clients', async () => {
    results.push({ data: [{ trainer_id: 't1', client_id: 'u1', trainer: { id: 't1', email: 'trainer@example.com', role: 'trainer' } }], error: null });
    const result = await adminService.listTrainerLinks(['u1', 'u2', 'u1']);
    expect(queries[0].table).toBe('trainer_clients');
    expect(queries[0].calls).toContainEqual(['in', 'client_id', ['u1', 'u2']]);
    expect(queries[0].calls[0][1]).toContain('trainer_clients_trainer_id_fkey');
    expect(result[0]).toMatchObject({ trainerId: 't1', clientId: 'u1', trainer: { id: 't1', email: 'trainer@example.com' } });
  });
});

it('continues a scoped assignment query when it reaches the page limit', async () => {
  results.push(
    { data: Array.from({ length: 100 }, (_, i) => ({ trainer_id: 'trainer-' + i, client_id: 'u1', trainer: null })), error: null },
    { data: [{ trainer_id: 'trainer-100', client_id: 'u1', trainer: null }], error: null },
  );
  const links = await adminService.listTrainerLinks(['u1']);
  expect(links).toHaveLength(101);
  expect(queries).toHaveLength(2);
  expect(queries[0].calls).toContainEqual(['range', 0, 99]);
  expect(queries[1].calls).toContainEqual(['range', 100, 199]);
  expect(queries[1].calls).toContainEqual(['in', 'client_id', ['u1']]);
});
