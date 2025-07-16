import type { ExerciseProgress, ProgressData } from '../types/Exercise';
import { IProgressRepository } from './interfaces/IProgressRepository';

export class LocalStorageProgressRepository implements IProgressRepository {
  private readonly CURRENT_PROGRESS_KEY = 'currentGymProgress';
  private readonly PREVIOUS_PROGRESS_KEY = 'previousGymProgress';

  getCurrentProgress(): ProgressData {
    try {
      const stored = localStorage.getItem(this.CURRENT_PROGRESS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading current progress:', error);
      return {};
    }
  }

  getPreviousProgress(): ProgressData {
    try {
      const stored = localStorage.getItem(this.PREVIOUS_PROGRESS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading previous progress:', error);
      return {};
    }
  }

  saveProgress(progress: ProgressData): void {
    try {
      localStorage.setItem(this.CURRENT_PROGRESS_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }

  getExerciseProgress(exerciseId: string): ExerciseProgress | null {
    const progress = this.getCurrentProgress();
    return progress[exerciseId] || null;
  }

  updateExerciseProgress(exerciseId: string, exerciseProgress: ExerciseProgress): void {
    const progress = this.getCurrentProgress();
    progress[exerciseId] = exerciseProgress;
    this.saveProgress(progress);
  }

  resetProgress(): void {
    try {
      const currentProgress = this.getCurrentProgress();
      
      // Save current progress as previous
      if (Object.keys(currentProgress).length > 0) {
        localStorage.setItem(this.PREVIOUS_PROGRESS_KEY, JSON.stringify(currentProgress));
      }
      
      // Clear current progress
      localStorage.removeItem(this.CURRENT_PROGRESS_KEY);
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  }
}