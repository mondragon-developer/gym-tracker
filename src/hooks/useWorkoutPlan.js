/**
 * Custom hook for workout plan management
 * Owns the user's weekly history (see WeekPlanService): loading, migration,
 * per-week viewing/navigation, editing the current week, and persistence to
 * cloud (when signed in) or local storage (offline fallback).
 */

import { useState, useEffect } from 'react';
import workoutService from '../services/workoutService.js';
import WeekPlanService from '../services/WeekPlanService.js';
import { supabaseStorageService } from '../services/SupabaseStorageService.js';
import { storageService } from '../services/StorageService.js';
import { supabase } from '../lib/supabase.js';

const LOCAL_KEY = 'gymAppWorkoutPlan';

const useWorkoutPlan = () => {
  const [history, setHistory] = useState(null);
  const [viewedWeekStart, setViewedWeekStart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load and migrate the weekly history (cloud or local)
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        let raw = null;

        if (user) {
          raw = await supabaseStorageService.getWorkoutPlan();
          if (!raw) {
            // No cloud data yet — migrate any local history up to the cloud.
            const local = storageService.getWorkoutPlan(LOCAL_KEY);
            if (local) {
              raw = local;
              await supabaseStorageService.saveWorkoutPlan(WeekPlanService.migrate(local));
            }
          }
        } else {
          raw = storageService.getWorkoutPlan(LOCAL_KEY);
        }

        const migrated = WeekPlanService.migrate(raw);
        setHistory(migrated);
        setViewedWeekStart(migrated.currentWeekStart);
      } catch (err) {
        setError('Failed to load workout plan');
        console.error('Error loading workout plan:', err);
        const fallback = WeekPlanService.migrate(null);
        setHistory(fallback);
        setViewedWeekStart(fallback.currentWeekStart);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [user]);

  // Auto-save the whole history whenever it changes
  useEffect(() => {
    const saveHistory = async () => {
      if (history && !isLoading) {
        try {
          if (user) {
            await supabaseStorageService.saveWorkoutPlan(history);
          } else {
            storageService.saveWorkoutPlan(history, LOCAL_KEY);
          }
        } catch (err) {
          setError('Failed to save workout plan');
          console.error('Error saving workout plan:', err);
        }
      }
    };

    saveHistory();
  }, [history, isLoading, user]);

  const currentWeekStart = history?.currentWeekStart ?? null;
  const weekStarts = history ? WeekPlanService.listWeekStarts(history) : [];
  const workoutPlan = history && viewedWeekStart ? history.weeks[viewedWeekStart] ?? null : null;
  const isViewingCurrent = viewedWeekStart === currentWeekStart;

  const viewedIndex = weekStarts.indexOf(viewedWeekStart);
  const hasOlderWeek = viewedIndex >= 0 && viewedIndex < weekStarts.length - 1;
  const hasNewerWeek = viewedIndex > 0;

  // Editing only ever touches the CURRENT week — past weeks are read-only history.
  const editCurrentWeek = (updater) => {
    if (!isViewingCurrent) return;
    setHistory(prev => {
      if (!prev) return prev;
      const nextPlan = updater(prev.weeks[prev.currentWeekStart]);
      return { ...prev, weeks: { ...prev.weeks, [prev.currentWeekStart]: nextPlan } };
    });
  };

  const updateDay = (day, dayData) => {
    editCurrentWeek(prev => ({ ...prev, [day]: dayData }));
  };

  const addExercise = (day, exerciseData) => {
    editCurrentWeek(prev => workoutService.addExerciseToDay(prev, day, exerciseData));
  };

  const resetDay = (day) => {
    editCurrentWeek(prev => workoutService.resetDay(prev, day));
  };

  // "Start New Week": archive the current week and carry the plan forward.
  const resetWeek = () => {
    if (!history) return;
    const next = WeekPlanService.startNewWeek(history);
    setHistory(next);
    setViewedWeekStart(next.currentWeekStart);
  };

  // Week navigation among existing weeks (newest-first list).
  const goToOlderWeek = () => {
    if (hasOlderWeek) setViewedWeekStart(weekStarts[viewedIndex + 1]);
  };

  const goToNewerWeek = () => {
    if (hasNewerWeek) setViewedWeekStart(weekStarts[viewedIndex - 1]);
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
    // Weekly view state
    viewedWeekStart,
    currentWeekStart,
    isViewingCurrent,
    hasOlderWeek,
    hasNewerWeek,
    goToOlderWeek,
    goToNewerWeek,
    goToCurrentWeek
  };
};

export default useWorkoutPlan;