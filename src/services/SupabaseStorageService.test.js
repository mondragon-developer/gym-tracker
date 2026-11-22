import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }));
vi.mock('../lib/supabase', () => ({
  supabase: { auth: { getUser: mocks.getUser }, from: mocks.from }
}));
import { SupabaseStorageService } from './SupabaseStorageService.js';

describe('account-bound workout persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'new-account' } }, error: null });
  });

  it('does not write a previous account\'s pending history under a new identity', async () => {
    const service = new SupabaseStorageService();
    const result = await service.saveWorkoutPlan({ weeks: {} }, { expectedUserId: 'previous-account' });
    expect(result).toEqual({ ok: false, reason: 'unauthenticated' });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('rejects a history read after the expected account changes', async () => {
    const service = new SupabaseStorageService();
    await expect(service.getWorkoutPlanRecord({ expectedUserId: 'previous-account' })).rejects.toThrow('account changed');
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
