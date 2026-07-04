import { Exercise, NewExercise } from '../types/Exercise';
import { IExerciseRepository } from './interfaces/IExerciseRepository';
import { DEFAULT_EXERCISES } from '../data/exercisesWithVideos';
import { supabase } from '../lib/supabaseClient';
import { requireUserId } from '../lib/currentUser';

/**
 * Shape of a row in the public.exercises table (snake_case, as Postgres returns it).
 */
interface ExerciseRow {
  id: string;
  name: string;
  sets_reps: string;
  is_custom: boolean;
  muscle_group: string;
  day: string;
  video_url: string | null;
}

/**
 * Supabase-backed exercise repository.
 *
 * Mirrors the localStorage version's behaviour: the DB only stores the user's
 * CUSTOM exercises; the default catalog stays in code. getAll() merges both.
 * Row Level Security guarantees only the current user's rows come back.
 */
export class SupabaseExerciseRepository implements IExerciseRepository {
  private static readonly TABLE = 'exercises';

  /** Convert a DB row into the app's Exercise domain type. */
  private toExercise(row: ExerciseRow): Exercise {
    return {
      id: row.id,
      name: row.name,
      setsReps: row.sets_reps,
      isCustom: row.is_custom,
      muscleGroup: row.muscle_group,
      day: row.day,
      videoUrl: row.video_url ?? undefined
    };
  }

  async getCustomExercises(): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from(SupabaseExerciseRepository.TABLE)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading custom exercises:', error);
      return [];
    }
    return (data as ExerciseRow[]).map(row => this.toExercise(row));
  }

  async getAll(): Promise<Exercise[]> {
    const customExercises = await this.getCustomExercises();
    return [...DEFAULT_EXERCISES, ...customExercises];
  }

  async getByMuscleGroup(muscleGroupId: string): Promise<Exercise[]> {
    const all = await this.getAll();
    return all.filter(exercise => exercise.muscleGroup === muscleGroupId);
  }

  async getById(id: string): Promise<Exercise | null> {
    const all = await this.getAll();
    return all.find(exercise => exercise.id === id) || null;
  }

  async add(newExercise: NewExercise): Promise<Exercise> {
    const userId = await requireUserId();
    const exercise: Exercise = {
      id: `${newExercise.muscleGroup}-custom-${Date.now()}`,
      name: newExercise.name,
      setsReps: `${newExercise.sets} sets × ${newExercise.reps} reps`,
      isCustom: true,
      muscleGroup: newExercise.muscleGroup,
      day: newExercise.day,
      videoUrl: newExercise.videoUrl
    };

    const { error } = await supabase.from(SupabaseExerciseRepository.TABLE).insert({
      id: exercise.id,
      user_id: userId,
      name: exercise.name,
      sets_reps: exercise.setsReps,
      is_custom: true,
      muscle_group: exercise.muscleGroup,
      day: exercise.day,
      video_url: exercise.videoUrl ?? null
    });

    if (error) {
      console.error('Error adding custom exercise:', error);
      throw error;
    }
    return exercise;
  }

  async remove(id: string): Promise<void> {
    // RLS already scopes deletes to the current user; the id filter is enough.
    const { error } = await supabase
      .from(SupabaseExerciseRepository.TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing custom exercise:', error);
      throw error;
    }
  }
}
