import type { ExerciseProgress, ProgressData } from '../types/Exercise';
import { IProgressRepository } from './interfaces/IProgressRepository';

/**
 * Offline fallback for progress, backed by localStorage. Async only to satisfy
 * the IProgressRepository interface.
 */
export class LocalStorageProgressRepository implements IProgressRepository {
  private readonly CURRENT_PROGRESS_KEY = 'currentGymProgress';
  private readonly PREVIOUS_PROGRESS_KEY = 'previousGymProgress';

  async getCurrentProgress(): Promise<ProgressData> {
    try {
      const stored = localStorage.getItem(this.CURRENT_PROGRESS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading current progress:', error);
      return {};
    }
  }

  async getPreviousProgress(): Promise<ProgressData> {
    try {
      const stored = localStorage.getItem(this.PREVIOUS_PROGRESS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading previous progress:', error);
      return {};
    }
  }

  async saveProgress(progress: ProgressData): Promise<void> {
    try {
      localStorage.setItem(this.CURRENT_PROGRESS_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }

  async getExerciseProgress(exerciseId: string): Promise<ExerciseProgress | null> {
    const progress = await this.getCurrentProgress();
    return progress[exerciseId] || null;
  }

  async updateExerciseProgress(
    exerciseId: string,
    exerciseProgress: ExerciseProgress
  ): Promise<void> {
    const progress = await this.getCurrentProgress();
    progress[exerciseId] = exerciseProgress;
    await this.saveProgress(progress);
  }

  async resetProgress(): Promise<void> {
    try {
      const currentProgress = await this.getCurrentProgress();

      if (Object.keys(currentProgress).length > 0) {
        localStorage.setItem(this.PREVIOUS_PROGRESS_KEY, JSON.stringify(currentProgress));
      }

      localStorage.removeItem(this.CURRENT_PROGRESS_KEY);
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  }
}
