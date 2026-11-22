import { describe, expect, it, vi } from 'vitest';
import { createPerformanceRecorder } from './PerformanceService.js';

describe('opt-in operational diagnostics', () => {
  it('does not inspect payloads or retain records when disabled', async () => {
    const recorder = createPerformanceRecorder();
    const size = vi.fn();
    const value = { data: 'private workout content' };
    expect(await recorder.measure('workout.load', async () => value, { outputBytes: size })).toBe(value);
    expect(size).not.toHaveBeenCalled();
    expect(recorder.snapshot()).toEqual([]);
  });

  it('retains only allowed numeric metadata with a bounded capacity', () => {
    let clock = 0;
    const recorder = createPerformanceRecorder({ enabled: true, capacity: 2, now: () => clock });
    for (let i = 0; i < 3; i += 1) {
      const finish = recorder.start('workout.save');
      clock += 12;
      finish({ inputBytes: 100 + i, userId: 'private-id', payload: 'private data' });
      finish();
    }
    const records = recorder.snapshot();
    expect(records).toEqual([
      { operation: 'workout.save', durationMs: 12, outcome: 'success', inputBytes: 101 },
      { operation: 'workout.save', durationMs: 12, outcome: 'success', inputBytes: 102 }
    ]);
    records[0].inputBytes = 999;
    expect(recorder.snapshot()[0].inputBytes).toBe(101);
    recorder.start('user/private-id')({});
    expect(recorder.snapshot()).toHaveLength(2);
  });

  it('preserves failed requests and save conflicts without storing their contents', async () => {
    const recorder = createPerformanceRecorder({ enabled: true });
    const error = new Error('private server details');
    await expect(recorder.measure('workout.load', () => Promise.reject(error))).rejects.toBe(error);
    const result = { ok: false, reason: 'conflict', data: 'private' };
    expect(await recorder.measure('workout.save', async () => result)).toBe(result);
    expect(recorder.snapshot().map(({ outcome }) => outcome)).toEqual(['error', 'conflict']);
    expect(JSON.stringify(recorder.snapshot())).not.toContain('private');
  });

  it('keeps diagnostic sizing failures from changing a successful save', async () => {
    const recorder = createPerformanceRecorder({ enabled: true });
    const result = { ok: true };
    const received = await recorder.measure('workout.save', async () => result, {
      inputBytes: () => { throw new Error('cannot size payload'); }
    });
    expect(received).toBe(result);
    expect(recorder.snapshot()[0].outcome).toBe('success');
  });
});
