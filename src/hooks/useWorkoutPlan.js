/**
 * Custom hook for workout plan management
 * Owns the user's weekly history (see WeekPlanService): loading, migration,
 * per-week viewing/navigation, editing the current week, and persistence to
 * cloud (when signed in) or local storage (offline fallback).
 *
 * Persistence rules:
 *   - Only a real edit marks the history dirty. Auth events, token refreshes
 *     and reloads never trigger a write, so a stale tab cannot overwrite what
 *     a trainer (or another device) saved.
 *   - Dirty edits autosave after a short debounce; saveNow() flushes at once.
 *   - Cloud writes carry the updated_at we loaded. If the row moved on since
 *     then the save is rejected as a 'conflict' and the user picks a side.
 *   - Returning to the tab re-reads the cloud copy when nothing is dirty, so
 *     trainer edits show up without a manual refresh.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import workoutService from '../services/workoutService.js';
import WeekPlanService from '../services/WeekPlanService.js';
import { supabaseStorageService } from '../services/SupabaseStorageService.js';
import { storageService } from '../services/StorageService.js';
import { useAuth } from './useAuth.js';

const LOCAL_KEY = 'gymAppWorkoutPlan';
const AUTOSAVE_DELAY_MS = 1200;

// idle | dirty | saving | saved | error | conflict
export const SaveState = {
  IDLE: 'idle',
  DIRTY: 'dirty',
  SAVING: 'saving',
  SAVED: 'saved',
  ERROR: 'error',
  CONFLICT: 'conflict'
};

// Steps kept for the session Undo button, and how close together two edits
// to the same day must be to count as one step.
const UNDO_LIMIT = 50;
const UNDO_MERGE_MS = 1500;

const useWorkoutPlan = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [history, setHistory] = useState(null);
  const [viewedWeekStart, setViewedWeekStart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveState, setSaveState] = useState(SaveState.IDLE);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  // True when this account had no stored plan anywhere at load time, so the
  // app can offer a starting template once.
  const [isFirstRun, setIsFirstRun] = useState(false);
  // Set when a silent reload found a newer cloud copy than the one loaded
  // (another device, or a trainer), so the UI can say the plan changed.
  const [remoteUpdateAt, setRemoteUpdateAt] = useState(null);

  // Refs let the async save/load paths read the latest values without
  // re-subscribing effects (which is what caused the spurious writes before).
  const historyRef = useRef(null);
  const persistedRef = useRef(null);
  const versionRef = useRef(null);
  const userIdRef = useRef(userId);
  const timerRef = useRef(null);
  const savingRef = useRef(false);
  const conflictRef = useRef(false);
  const loadSeqRef = useRef(0);

  // Session undo: the history from before each user edit, newest last. It
  // lives in memory only, so it covers what this user did since opening the
  // app. Edits to the same day in quick succession (typing a weight) are one
  // step.
  const undoStackRef = useRef([]);
  const [undoDepth, setUndoDepth] = useState(0);

  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  const isDirty = Boolean(history) && history !== persistedRef.current;

  const load = useCallback(async ({ silent = false } = {}) => {
    const seq = ++loadSeqRef.current;
    const uid = userIdRef.current;
    if (!silent) setIsLoading(true);

    try {
      let raw = null;
      let version = null;

      if (uid) {
        const record = await supabaseStorageService.getWorkoutPlanRecord();
        if (record) {
          raw = record.data;
          version = record.updatedAt;
          // The cloud copy wins. Drop any offline plan left on this browser
          // so it cannot be migrated into a different account later.
          storageService.removeWorkoutPlan(LOCAL_KEY);
        } else {
          // First sign-in on this device: move any offline history to the
          // cloud, then drop the local copy so it cannot leak into another
          // account that signs in later on the same browser.
          const local = storageService.getWorkoutPlan(LOCAL_KEY);
          if (local) {
            raw = WeekPlanService.migrate(local);
            const result = await supabaseStorageService.saveWorkoutPlan(raw);
            if (result.ok) {
              version = result.updatedAt;
              storageService.removeWorkoutPlan(LOCAL_KEY);
            }
          }
        }
      } else {
        raw = storageService.getWorkoutPlan(LOCAL_KEY);
      }

      if (seq !== loadSeqRef.current) return;

      if (silent && version && versionRef.current && version !== versionRef.current) {
        setRemoteUpdateAt(new Date());
      }
      if (!silent) setIsFirstRun(raw === null);

      const migrated = WeekPlanService.migrate(raw);
      // A silent reload of our own save keeps the steps. A different account
      // or a newer copy from another device or a trainer drops them, since
      // undoing to an older snapshot would erase those changes.
      if (!silent || (version && versionRef.current && version !== versionRef.current)) {
        undoStackRef.current = [];
        setUndoDepth(0);
      }
      persistedRef.current = migrated;
      versionRef.current = version;
      conflictRef.current = false;
      setHistory(migrated);
      setViewedWeekStart(prev => (
        silent && prev && WeekPlanService.listNavigableWeeks(migrated).includes(prev)
          ? prev
          : migrated.currentWeekStart
      ));
      setSaveState(SaveState.IDLE);
      setError(null);
    } catch (err) {
      if (seq !== loadSeqRef.current) return;
      console.error('Error loading workout plan:', err);
      // A silent refresh that fails keeps whatever is on screen. A failed
      // initial load must NOT fall back to the default plan: that default
      // would look like real data and could get saved over the cloud copy.
      if (!silent) {
        setError('Failed to load workout plan');
        setHistory(null);
      }
    } finally {
      if (seq === loadSeqRef.current && !silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [userId, load]);

  const save = useCallback(async ({ force = false } = {}) => {
    const target = historyRef.current;
    if (!target || target === persistedRef.current || savingRef.current) return;
    if (conflictRef.current && !force) return;

    savingRef.current = true;
    clearTimeout(timerRef.current);
    setSaveState(SaveState.SAVING);

    try {
      if (userIdRef.current) {
        // Without a known version the row should not exist yet, so the
        // service inserts instead of upserting; a row that appeared in the
        // meantime surfaces as a conflict rather than being overwritten.
        const result = await supabaseStorageService.saveWorkoutPlan(
          target,
          force ? { overwrite: true } : { expectedUpdatedAt: versionRef.current }
        );
        if (!result.ok) {
          if (result.reason === 'conflict') {
            conflictRef.current = true;
            setSaveState(SaveState.CONFLICT);
          } else {
            setSaveState(SaveState.ERROR);
          }
          return;
        }
        versionRef.current = result.updatedAt;
      } else {
        storageService.saveWorkoutPlan(target, LOCAL_KEY);
      }

      persistedRef.current = target;
      conflictRef.current = false;
      setLastSavedAt(new Date());
      // Edits made while the request was in flight still need saving.
      if (historyRef.current === target) {
        setSaveState(SaveState.SAVED);
      } else {
        setSaveState(SaveState.DIRTY);
        timerRef.current = setTimeout(() => { save(); }, AUTOSAVE_DELAY_MS);
      }
    } catch (err) {
      console.error('Error saving workout plan:', err);
      setSaveState(SaveState.ERROR);
    } finally {
      savingRef.current = false;
    }
  }, []);

  // Debounced autosave, driven only by history changes that came from edits.
  useEffect(() => {
    if (!history || history === persistedRef.current || conflictRef.current) return;
    setSaveState(SaveState.DIRTY);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { save(); }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timerRef.current);
  }, [history, save]);

  // A tab left open across Sunday midnight must move to the new calendar
  // week on its own. rollForward returns the same object when nothing
  // changed, so this is a no-op re-render most of the time.
  useEffect(() => {
    const tick = () => {
      setHistory(prev => (prev ? WeekPlanService.rollForward(prev) : prev));
    };
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Leaving the tab: flush pending edits right away. Coming back: pick up
  // anything a trainer or another device saved meanwhile (the reload also
  // rolls the week forward), or at least roll the week when edits are pending.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        save();
        return;
      }
      const pending = historyRef.current && historyRef.current !== persistedRef.current;
      if (pending || !userIdRef.current || savingRef.current) {
        setHistory(prev => (prev ? WeekPlanService.rollForward(prev) : prev));
        return;
      }
      load({ silent: true });
    };
    // A new app build is ready (see main.jsx). Claim the event, flush any
    // pending edit, and reload only when the save landed; a failed or
    // conflicting save keeps the current page so nothing is lost.
    const onUpdateReady = (event) => {
      event.preventDefault();
      const pending = historyRef.current && historyRef.current !== persistedRef.current;
      if (!pending) {
        window.location.reload();
        return;
      }
      save().then(() => {
        if (historyRef.current === persistedRef.current) window.location.reload();
      });
    };
    const onBeforeUnload = (event) => {
      if (historyRef.current && historyRef.current !== persistedRef.current) {
        save();
        event.preventDefault();
        event.returnValue = '';
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('gym:app-update-ready', onUpdateReady);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('gym:app-update-ready', onUpdateReady);
    };
  }, [save, load]);

  const currentWeekStart = history?.currentWeekStart ?? null;
  // Oldest first: stored weeks, the current week, and twelve weeks ahead.
  const navWeeks = history ? WeekPlanService.listNavigableWeeks(history) : [];
  const workoutPlan = history && viewedWeekStart ? WeekPlanService.resolveWeek(history, viewedWeekStart) : null;
  const isViewingCurrent = viewedWeekStart === currentWeekStart;
  const isFutureWeek = Boolean(currentWeekStart && viewedWeekStart && viewedWeekStart > currentWeekStart);
  // Current and future weeks can be edited; past weeks are read-only history.
  const isEditable = isViewingCurrent || isFutureWeek;

  const viewedIndex = navWeeks.indexOf(viewedWeekStart);
  const hasOlderWeek = viewedIndex > 0;
  const hasNewerWeek = viewedIndex >= 0 && viewedIndex < navWeeks.length - 1;

  // Edits land on the viewed week. A previewed future week is stored on its
  // first edit, which is also what makes it save.
  const recordUndo = (weekStart, mergeKey = null) => {
    const snapshot = historyRef.current;
    if (!snapshot) return;
    const stack = undoStackRef.current;
    const top = stack[stack.length - 1];
    const now = Date.now();
    if (mergeKey && top && top.mergeKey === mergeKey && top.weekStart === weekStart && now - top.at < UNDO_MERGE_MS) {
      top.at = now;
      return;
    }
    stack.push({ snapshot, weekStart, mergeKey, at: now });
    if (stack.length > UNDO_LIMIT) stack.shift();
    setUndoDepth(stack.length);
  };

  const editViewedWeek = (updater, mergeKey = null) => {
    if (!isEditable) return;
    const weekStart = viewedWeekStart;
    recordUndo(weekStart, mergeKey);
    setHistory(prev => {
      if (!prev) return prev;
      const base = WeekPlanService.resolveWeek(prev, weekStart);
      if (!base) return prev;
      return WeekPlanService.setWeek(prev, weekStart, updater(base));
    });
  };

  const updateDay = (day, dayData) => {
    editViewedWeek(prev => ({ ...prev, [day]: dayData }), day);
  };

  const addExercise = (day, exerciseData) => {
    editViewedWeek(prev => workoutService.addExerciseToDay(prev, day, exerciseData));
  };

  const resetDay = (day) => {
    editViewedWeek(prev => workoutService.resetDay(prev, day));
  };

  // Whole-week replacements (templates, copy of last week) on the viewed
  // editable week.
  const replaceViewedWeek = (plan) => {
    editViewedWeek(() => plan);
  };

  // The current week and every week ahead the navigator reaches: where an
  // imported plan may land. Past weeks are history and stay read-only.
  const importableWeeks = currentWeekStart ? navWeeks.filter(week => week >= currentWeekStart) : [];

  const planForWeek = (weekStart) => (history ? WeekPlanService.resolveWeek(history, weekStart) : null);

  // Stores a whole plan on any importable week and shows that week, so the
  // user sees what landed. Undo steps back to before it like any edit.
  const replaceWeek = (weekStart, plan) => {
    if (!history || !importableWeeks.includes(weekStart)) return;
    recordUndo(weekStart);
    setHistory(prev => (prev ? WeekPlanService.setWeek(prev, weekStart, plan) : prev));
    setViewedWeekStart(weekStart);
  };

  // Undo support: callers keep the history object from before a destructive
  // action and hand it back. Restoring goes through the normal dirty/autosave
  // path, and if nothing was saved in between the pending save is dropped
  // because the restored object is the persisted one.
  // Stores the plan as it is (a new object reference makes it dirty), used
  // when a first-run user keeps the default so the cloud gets a row and the
  // next device does not ask again.
  const persistCurrentPlan = () => {
    setHistory(prev => (prev ? { ...prev } : prev));
  };

  const restoreSnapshot = (snapshot) => {
    if (!snapshot) return;
    // An Undo toast restores the same history the stack recorded for that
    // action; drop the step so the Undo button does not repeat it.
    const stack = undoStackRef.current;
    if (stack.length && stack[stack.length - 1].snapshot === snapshot) {
      stack.pop();
      setUndoDepth(stack.length);
    }
    setHistory(snapshot);
    // Undo before the debounce fired: nothing changed on disk, so drop the
    // pending save and clear the dirty label the effect will not touch.
    if (snapshot === persistedRef.current) {
      clearTimeout(timerRef.current);
      setSaveState(SaveState.IDLE);
    }
  };

  const previousWeekStart = history && viewedWeekStart
    ? WeekPlanService.previousWeekOf(history, viewedWeekStart)
    : null;
  const hasPreviousWeek = Boolean(previousWeekStart);
  const previousWeekPlan = previousWeekStart ? history.weeks[previousWeekStart] ?? null : null;

  const copyFromPreviousWeek = () => {
    if (!isEditable || !previousWeekStart) return;
    const weekStart = viewedWeekStart;
    recordUndo(weekStart);
    setHistory(prev => (prev ? WeekPlanService.copyWeek(prev, previousWeekStart, weekStart) : prev));
  };

  // "Restart This Week": clear the current week's progress, keeping the plan.
  const resetWeek = () => {
    if (!history) return;
    recordUndo(viewedWeekStart);
    const next = WeekPlanService.startNewWeek(history);
    setHistory(next);
    setViewedWeekStart(next.currentWeekStart);
  };

  // Steps back to the history from before the last edit and shows the week
  // it happened on, so the user sees what came back.
  const undoLast = () => {
    const entry = undoStackRef.current[undoStackRef.current.length - 1];
    if (!entry) return;
    restoreSnapshot(entry.snapshot);
    if (WeekPlanService.listNavigableWeeks(entry.snapshot).includes(entry.weekStart)) {
      setViewedWeekStart(entry.weekStart);
    }
  };

  const goToOlderWeek = () => {
    if (hasOlderWeek) setViewedWeekStart(navWeeks[viewedIndex - 1]);
  };

  const goToNewerWeek = () => {
    if (hasNewerWeek) setViewedWeekStart(navWeeks[viewedIndex + 1]);
  };

  const goToCurrentWeek = () => {
    if (currentWeekStart) setViewedWeekStart(currentWeekStart);
  };

  return {
    workoutPlan,
    isLoading,
    error,
    updateDay,
    addExercise,
    resetDay,
    resetWeek,
    replaceViewedWeek,
    replaceWeek,
    importableWeeks,
    planForWeek,
    historySnapshot: history,
    restoreSnapshot,
    canUndo: undoDepth > 0,
    undoLast,
    persistCurrentPlan,
    copyFromPreviousWeek,
    hasPreviousWeek,
    previousWeekStart,
    previousWeekPlan,
    isFirstRun,
    markOnboarded: () => setIsFirstRun(false),
    remoteUpdateAt,
    dismissRemoteUpdate: () => setRemoteUpdateAt(null),
    // Persistence status and controls
    saveState,
    isDirty,
    lastSavedAt,
    saveNow: () => save(),
    saveOverwrite: () => save({ force: true }),
    reload: () => load(),
    // Weekly view state
    viewedWeekStart,
    currentWeekStart,
    isViewingCurrent,
    isFutureWeek,
    isEditable,
    hasOlderWeek,
    hasNewerWeek,
    goToOlderWeek,
    goToNewerWeek,
    goToCurrentWeek
  };
};

export default useWorkoutPlan;
