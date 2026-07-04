import type { ExerciseProgress, ProgressData } from '../types/Exercise';
import { IProgressRepository } from './interfaces/IProgressRepository';
import { supabase } from '../lib/supabaseClient';
import { requireUserId } from '../lib/currentUser';

/**
 * Shape of a row in public.progress.
 * is_previous distinguishes this week's data (false) from last week's snapshot (true).
 */
interface ProgressRow {
  exercise_id: string;
  completed: boolean;
  skipped: boolean;
  effective_sets: number;
  reps: number;
  weight: number | string; // numeric can arrive as a string; we coerce with Number()
  is_previous: boolean;
}

/**
 * Supabase-backed progress repository.
 *
 * "Current" and "previous" progress share one table, separated by the
 * is_previous flag. A reset promotes current -> previous, then clears current.
 */
export class SupabaseProgressRepository implements IProgressRepository {
  private static readonly TABLE = 'progress';

  /** Turn a list of rows into the app's { [exerciseId]: ExerciseProgress } map. */
  private toProgressData(rows: ProgressRow[]): ProgressData {
    const map: ProgressData = {};
    for (const row of rows) {
      map[row.exercise_id] = {
        exerciseId: row.exercise_id,
        completed: row.completed,
        skipped: row.skipped,
        effectiveSets: Number(row.effective_sets),
        reps: Number(row.reps),
        weight: Number(row.weight)
      };
    }
    return map;
  }

  private async fetchByPhase(isPrevious: boolean): Promise<ProgressData> {
    const { data, error } = await supabase
      .from(SupabaseProgressRepository.TABLE)
      .select('*')
      .eq('is_previous', isPrevious);

    if (error) {
      console.error('Error loading progress:', error);
      return {};
    }
    return this.toProgressData(data as ProgressRow[]);
  }

  async getCurrentProgress(): Promise<ProgressData> {
    return this.fetchByPhase(false);
  }

  async getPreviousProgress(): Promise<ProgressData> {
    return this.fetchByPhase(true);
  }

  async saveProgress(progress: ProgressData): Promise<void> {
    const entries = Object.values(progress);
    if (entries.length === 0) return;
    await Promise.all(entries.map(p => this.updateExerciseProgress(p.exerciseId, p)));
  }

  async getExerciseProgress(exerciseId: string): Promise<ExerciseProgress | null> {
    const current = await this.getCurrentProgress();
    return current[exerciseId] || null;
  }

  async updateExerciseProgress(
    exerciseId: string,
    progress: ExerciseProgress
  ): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase
      .from(SupabaseProgressRepository.TABLE)
      .upsert(
        {
          user_id: userId,
          exercise_id: exerciseId,
          completed: progress.completed,
          skipped: progress.skipped,
          effective_sets: progress.effectiveSets,
          reps: progress.reps,
          weight: progress.weight,
          is_previous: false,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,exercise_id,is_previous' }
      );

    if (error) {
      console.error('Error updating exercise progress:', error);
      throw error;
    }
  }

  async resetProgress(): Promise<void> {
    // 1. Drop last week's snapshot so we can promote this week into its place.
    const { error: delError } = await supabase
      .from(SupabaseProgressRepository.TABLE)
      .delete()
      .eq('is_previous', true);
    if (delError) {
      console.error('Error clearing previous progress:', delError);
      throw delError;
    }

    // 2. Promote this week's rows to "previous" (they become the new snapshot).
    const { error: updError } = await supabase
      .from(SupabaseProgressRepository.TABLE)
      .update({ is_previous: true })
      .eq('is_previous', false);
    if (updError) {
      console.error('Error promoting current progress to previous:', updError);
      throw updError;
    }
  }
}
