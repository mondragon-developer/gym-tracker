import { supabase } from '../lib/supabaseClient';
import { Exercise, ProgressData, ExerciseProgress, DayNotes } from '../types/Exercise';
import { UserProfile, UserRole } from '../types/Admin';

/**
 * All cross-user operations for admins live here, isolated from the normal
 * per-user repositories (single responsibility). Every query targets an explicit
 * userId — the database's admin RLS policies (is_admin()) are what actually
 * authorise the access, so a non-admin calling these would simply get nothing.
 */
export class AdminService {
  // ---- Users & roles -------------------------------------------------------

  async listUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(r => ({
      id: r.id as string,
      email: (r.email as string) ?? '',
      role: (r.role as UserRole) ?? 'user',
      createdAt: r.created_at as string
    }));
  }

  async setUserRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) throw error;
  }

  // ---- A target user's custom exercises ------------------------------------

  async getExercises(userId: string): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(row => ({
      id: row.id as string,
      name: row.name as string,
      setsReps: row.sets_reps as string,
      isCustom: row.is_custom as boolean,
      muscleGroup: row.muscle_group as string,
      day: row.day as string,
      videoUrl: (row.video_url as string) ?? undefined
    }));
  }

  async deleteExercise(userId: string, exerciseId: string): Promise<void> {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('user_id', userId)
      .eq('id', exerciseId);
    if (error) throw error;
  }

  // ---- A target user's progress --------------------------------------------

  async getProgress(userId: string): Promise<ProgressData> {
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .eq('is_previous', false);

    if (error) throw error;
    const map: ProgressData = {};
    for (const row of data ?? []) {
      map[row.exercise_id as string] = {
        exerciseId: row.exercise_id as string,
        completed: row.completed as boolean,
        skipped: row.skipped as boolean,
        effectiveSets: Number(row.effective_sets),
        reps: Number(row.reps),
        weight: Number(row.weight)
      };
    }
    return map;
  }

  async updateProgress(userId: string, progress: ExerciseProgress): Promise<void> {
    const { error } = await supabase.from('progress').upsert(
      {
        user_id: userId,
        exercise_id: progress.exerciseId,
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
    if (error) throw error;
  }

  async deleteProgress(userId: string, exerciseId: string): Promise<void> {
    const { error } = await supabase
      .from('progress')
      .delete()
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .eq('is_previous', false);
    if (error) throw error;
  }

  // ---- A target user's day notes -------------------------------------------

  async getDayNotes(userId: string): Promise<DayNotes> {
    const { data, error } = await supabase
      .from('day_notes')
      .select('day_id, notes')
      .eq('user_id', userId);

    if (error) throw error;
    const notes: DayNotes = {};
    for (const row of data ?? []) {
      notes[row.day_id as string] = row.notes as string;
    }
    return notes;
  }

  async saveDayNote(userId: string, dayId: string, notes: string): Promise<void> {
    const { error } = await supabase.from('day_notes').upsert(
      {
        user_id: userId,
        day_id: dayId,
        notes,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id,day_id' }
    );
    if (error) throw error;
  }
}
