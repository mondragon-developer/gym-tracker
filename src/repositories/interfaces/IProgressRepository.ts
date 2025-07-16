import type { ExerciseProgress, ProgressData } from '../../types/Exercise';

export interface IProgressRepository {
  getCurrentProgress(): ProgressData;
  getPreviousProgress(): ProgressData;
  saveProgress(progress: ProgressData): void;
  getExerciseProgress(exerciseId: string): ExerciseProgress | null;
  updateExerciseProgress(exerciseId: string, progress: ExerciseProgress): void;
  resetProgress(): void;
}