import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: { id: 'user-1' },
  getWorkoutPlanRecord: vi.fn(),
  saveWorkoutPlan: vi.fn(),
  localGet: vi.fn(),
  localSave: vi.fn(),
  localRemove: vi.fn()
}));

vi.mock('./useAuth.js', () => ({
  useAuth: () => ({ user: mocks.user })
}));

vi.mock('../services/SupabaseStorageService.js', () => ({
  supabaseStorageService: {
    getWorkoutPlanRecord: mocks.getWorkoutPlanRecord,
    saveWorkoutPlan: mocks.saveWorkoutPlan
  }
}));

vi.mock('../services/StorageService.js', () => ({
  storageService: {
    getWorkoutPlan: mocks.localGet,
    saveWorkoutPlan: mocks.localSave,
    removeWorkoutPlan: mocks.localRemove
  }
}));

import useWorkoutPlan, { SaveState } from './useWorkoutPlan.js';
import WeekPlanService from '../services/WeekPlanService.js';
import workoutService from '../services/workoutService.js';

const cloudHistory = () => {
  const history = WeekPlanService.migrate(null);
  const week = history.weeks[history.currentWeekStart];
  week.Monday = { ...week.Monday, name: 'Cloud Day' };
  return history;
};

const renderPlan = async () => {
  const rendered = renderHook(() => useWorkoutPlan());
  await waitFor(() => expect(rendered.result.current.isLoading).toBe(false));
  return rendered;
};

describe('useWorkoutPlan persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mocks.getWorkoutPlanRecord.mockReset();
    mocks.saveWorkoutPlan.mockReset();
    mocks.localGet.mockReset();
    mocks.localSave.mockReset();
    mocks.localRemove.mockReset();
    mocks.localGet.mockReturnValue(null);
    mocks.saveWorkoutPlan.mockResolvedValue({ ok: true, updatedAt: '2026-09-20T12:00:00.000+00:00' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads the cloud plan and never writes back on a plain load', async () => {
    mocks.getWorkoutPlanRecord.mockResolvedValue({ data: cloudHistory(), updatedAt: 'v1' });

    const { result } = await renderPlan();

    expect(result.current.workoutPlan.Monday.name).toBe('Cloud Day');
    expect(result.current.saveState).toBe(SaveState.IDLE);
    expect(result.current.isDirty).toBe(false);
    // Whatever was left offline on this browser must not outlive the cloud
    // copy, or it would be migrated into the next account that signs in here.
    expect(mocks.localRemove).toHaveBeenCalledWith('gymAppWorkoutPlan');

    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(mocks.saveWorkoutPlan).not.toHaveBeenCalled();
    expect(mocks.localSave).not.toHaveBeenCalled();
  });

  it('does not replace a plan with the default when the cloud read fails', async () => {
    mocks.getWorkoutPlanRecord.mockRejectedValue(new Error('network down'));

    const { result } = await renderPlan();

    expect(result.current.error).toBe('Failed to load workout plan');
    expect(result.current.workoutPlan).toBeNull();
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(mocks.saveWorkoutPlan).not.toHaveBeenCalled();
  });

  it('autosaves an edit with the loaded version stamp and reports saved', async () => {
    mocks.getWorkoutPlanRecord.mockResolvedValue({ data: cloudHistory(), updatedAt: 'v1' });
    const { result } = await renderPlan();

    act(() => {
      result.current.updateDay('Tuesday', { ...result.current.workoutPlan.Tuesday, name: 'Edited' });
    });
    expect(result.current.saveState).toBe(SaveState.DIRTY);
    expect(result.current.isDirty).toBe(true);

    await act(async () => { vi.advanceTimersByTime(1500); });

    await waitFor(() => expect(result.current.saveState).toBe(SaveState.SAVED));
    expect(mocks.saveWorkoutPlan).toHaveBeenCalledTimes(1);
    const [savedHistory, options] = mocks.saveWorkoutPlan.mock.calls[0];
    expect(savedHistory.weeks[savedHistory.currentWeekStart].Tuesday.name).toBe('Edited');
    expect(options).toEqual({ expectedUpdatedAt: 'v1' });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.lastSavedAt).toBeInstanceOf(Date);
  });

  it('saveNow flushes immediately without waiting for the debounce', async () => {
    mocks.getWorkoutPlanRecord.mockResolvedValue({ data: cloudHistory(), updatedAt: 'v1' });
    const { result } = await renderPlan();

    act(() => {
      result.current.addExercise('Monday', { name: 'Curl', sets: '3', reps: '10' });
    });
    await act(async () => { await result.current.saveNow(); });

    expect(mocks.saveWorkoutPlan).toHaveBeenCalledTimes(1);
    expect(result.current.saveState).toBe(SaveState.SAVED);
  });

  it('flags a conflict when the row changed elsewhere, and can overwrite on request', async () => {
    mocks.getWorkoutPlanRecord.mockResolvedValue({ data: cloudHistory(), updatedAt: 'v1' });
    mocks.saveWorkoutPlan
      .mockResolvedValueOnce({ ok: false, reason: 'conflict' })
      .mockResolvedValueOnce({ ok: true, updatedAt: 'v3' });
    const { result } = await renderPlan();

    act(() => {
      result.current.resetDay('Wednesday');
    });
    await act(async () => { await result.current.saveNow(); });

    expect(result.current.saveState).toBe(SaveState.CONFLICT);
    expect(result.current.isDirty).toBe(true);

    // Conflict blocks the autosave loop until the user chooses.
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(mocks.saveWorkoutPlan).toHaveBeenCalledTimes(1);

    await act(async () => { await result.current.saveOverwrite(); });
    expect(mocks.saveWorkoutPlan).toHaveBeenCalledTimes(2);
    expect(mocks.saveWorkoutPlan.mock.calls[1][1]).toEqual({ overwrite: true });
    expect(result.current.saveState).toBe(SaveState.SAVED);
  });

  it('reload discards local edits and takes the newest cloud copy', async () => {
    const first = cloudHistory();
    const second = cloudHistory();
    second.weeks[second.currentWeekStart].Monday.name = 'Trainer Day';
    mocks.getWorkoutPlanRecord
      .mockResolvedValueOnce({ data: first, updatedAt: 'v1' })
      .mockResolvedValueOnce({ data: second, updatedAt: 'v2' });
    const { result } = await renderPlan();

    act(() => {
      result.current.updateDay('Monday', { ...result.current.workoutPlan.Monday, name: 'Mine' });
    });
    await act(async () => { await result.current.reload(); });

    expect(result.current.workoutPlan.Monday.name).toBe('Trainer Day');
    expect(result.current.saveState).toBe(SaveState.IDLE);
    expect(result.current.isDirty).toBe(false);
  });

  it('lets the user step into a future week, previews it, and stores it on first edit', async () => {
    mocks.getWorkoutPlanRecord.mockResolvedValue({ data: cloudHistory(), updatedAt: 'v1' });
    const { result } = await renderPlan();
    const current = result.current.currentWeekStart;

    act(() => { result.current.goToNewerWeek(); });
    expect(result.current.isFutureWeek).toBe(true);
    expect(result.current.isEditable).toBe(true);
    expect(result.current.viewedWeekStart > current).toBe(true);
    // Preview carries the plan but nothing is dirty yet.
    expect(result.current.workoutPlan.Monday.name).toBe('Cloud Day');
    expect(result.current.isDirty).toBe(false);

    const nextWeek = result.current.viewedWeekStart;
    act(() => {
      result.current.updateDay('Monday', { ...result.current.workoutPlan.Monday, name: 'Planned Day' });
    });
    expect(result.current.isDirty).toBe(true);
    await act(async () => { await result.current.saveNow(); });

    const saved = mocks.saveWorkoutPlan.mock.calls[0][0];
    expect(saved.currentWeekStart).toBe(current);
    expect(saved.weeks[nextWeek].Monday.name).toBe('Planned Day');
    expect(saved.weeks[current].Monday.name).toBe('Cloud Day');
  });

  it('blocks navigation beyond twelve weeks ahead', async () => {
    mocks.getWorkoutPlanRecord.mockResolvedValue({ data: cloudHistory(), updatedAt: 'v1' });
    const { result } = await renderPlan();

    for (let i = 0; i < 20; i++) {
      act(() => { result.current.goToNewerWeek(); });
    }
    expect(result.current.hasNewerWeek).toBe(false);
    expect(result.current.viewedWeekStart).toBe(
      WeekPlanService.listNavigableWeeks({ currentWeekStart: result.current.currentWeekStart, weeks: {} }).pop()
    );
  });

  it('undo before the autosave fires restores the persisted plan and clears the dirty state', async () => {
    mocks.getWorkoutPlanRecord.mockResolvedValue({ data: cloudHistory(), updatedAt: 'v1' });
    const { result } = await renderPlan();
    const before = result.current.historySnapshot;

    act(() => { result.current.resetDay('Monday'); });
    expect(result.current.saveState).toBe(SaveState.DIRTY);

    act(() => { result.current.restoreSnapshot(before); });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.saveState).toBe(SaveState.IDLE);
    expect(result.current.workoutPlan.Monday.name).toBe('Cloud Day');

    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(mocks.saveWorkoutPlan).not.toHaveBeenCalled();
  });

  it('flags a first run only when nothing was stored anywhere', async () => {
    mocks.getWorkoutPlanRecord.mockResolvedValue(null);
    const fresh = await renderPlan();
    expect(fresh.result.current.isFirstRun).toBe(true);
    act(() => { fresh.result.current.markOnboarded(); });
    expect(fresh.result.current.isFirstRun).toBe(false);
    fresh.unmount();

    mocks.getWorkoutPlanRecord.mockResolvedValue({ data: cloudHistory(), updatedAt: 'v1' });
    const existing = await renderPlan();
    expect(existing.result.current.isFirstRun).toBe(false);
  });

  it('reports a newer cloud copy found on a silent reload and exposes last week for the same exercise', async () => {
    const first = cloudHistory();
    const second = cloudHistory();
    second.weeks[second.currentWeekStart].Monday.name = 'Trainer Day';
    mocks.getWorkoutPlanRecord
      .mockResolvedValueOnce({ data: first, updatedAt: 'v1' })
      .mockResolvedValueOnce({ data: second, updatedAt: 'v2' });
    const { result } = await renderPlan();
    expect(result.current.remoteUpdateAt).toBeNull();

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await waitFor(() => expect(result.current.workoutPlan.Monday.name).toBe('Trainer Day'));
    expect(result.current.remoteUpdateAt).toBeInstanceOf(Date);
    act(() => { result.current.dismissRemoteUpdate(); });
    expect(result.current.remoteUpdateAt).toBeNull();

    // A fresh history has no earlier week, so nothing to compare against.
    expect(result.current.previousWeekPlan).toBeNull();
  });

  it('persistCurrentPlan stores the default plan for a first-run user who keeps it', async () => {
    mocks.getWorkoutPlanRecord.mockResolvedValue(null);
    const { result } = await renderPlan();
    expect(result.current.isFirstRun).toBe(true);
    expect(result.current.isDirty).toBe(false);

    act(() => { result.current.persistCurrentPlan(); });
    expect(result.current.isDirty).toBe(true);
    await act(async () => { vi.advanceTimersByTime(1500); });
    await waitFor(() => expect(mocks.saveWorkoutPlan).toHaveBeenCalledTimes(1));
    // First save for this account: an insert, no version stamp.
    expect(mocks.saveWorkoutPlan.mock.calls[0][1]).toEqual({ expectedUpdatedAt: null });
    expect(mocks.saveWorkoutPlan.mock.calls[0][0].weeks[result.current.currentWeekStart].Monday.exercises.length).toBeGreaterThan(0);
  });

  it('flushes a pending edit before honoring an app-update reload, and skips the reload when the save fails', async () => {
    mocks.getWorkoutPlanRecord.mockResolvedValue({ data: cloudHistory(), updatedAt: 'v1' });
    const { result } = await renderPlan();
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', { value: { ...original, reload }, configurable: true });

    try {
      act(() => {
        result.current.updateDay('Monday', { ...result.current.workoutPlan.Monday, name: 'Edited' });
      });
      const claimed = !window.dispatchEvent(new CustomEvent('gym:app-update-ready', { cancelable: true }));
      expect(claimed).toBe(true);
      await waitFor(() => expect(mocks.saveWorkoutPlan).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));

      mocks.saveWorkoutPlan.mockResolvedValueOnce({ ok: false, reason: 'error' });
      act(() => {
        result.current.updateDay('Tuesday', { ...result.current.workoutPlan.Tuesday, name: 'Again' });
      });
      window.dispatchEvent(new CustomEvent('gym:app-update-ready', { cancelable: true }));
      await waitFor(() => expect(mocks.saveWorkoutPlan).toHaveBeenCalledTimes(2));
      await act(async () => { vi.advanceTimersByTime(100); });
      expect(reload).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(window, 'location', { value: original, configurable: true });
    }
  });

  it('migrates a local plan to the cloud only when no cloud row exists', async () => {
    mocks.getWorkoutPlanRecord.mockResolvedValue(null);
    const local = workoutService.getInitialPlan();
    local.Friday = { ...local.Friday, name: 'Local Day' };
    mocks.localGet.mockReturnValue(local);

    const { result } = await renderPlan();

    expect(mocks.saveWorkoutPlan).toHaveBeenCalledTimes(1);
    expect(mocks.saveWorkoutPlan.mock.calls[0][1]).toBeUndefined();
    expect(mocks.localRemove).toHaveBeenCalledWith('gymAppWorkoutPlan');
    expect(result.current.workoutPlan.Friday.name).toBe('Local Day');
    expect(result.current.saveState).toBe(SaveState.IDLE);
  });
});
