import type { ExerciseProgress, ProgressData } from '../../types/Exercise';

/**
 * Persistence contract for workout progress.
 *
 * Async for the same reason as IExerciseRepository: an implementation may hit a
 * remote database. getCurrentProgress / getPreviousProgress return the whole
 * progress map keyed by exercise id.
 */
export interface IProgressRepository {
  getCurrentProgress(): Promise<ProgressData>;
  getPreviousProgress(): Promise<ProgressData>;
  saveProgress(progress: ProgressData): Promise<void>;
  getExerciseProgress(exerciseId: string): Promise<ExerciseProgress | null>;
  updateExerciseProgress(exerciseId: string, progress: ExerciseProgress): Promise<void>;
  resetProgress(): Promise<void>;
}
