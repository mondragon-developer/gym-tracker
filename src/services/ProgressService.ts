import { WeeklyProgress } from '../types/Progress';
import { IProgressService } from './interfaces/IProgressService';
import { IExerciseRepository } from '../repositories/interfaces/IExerciseRepository';
import { IProgressRepository } from '../repositories/interfaces/IProgressRepository';

export class ProgressService implements IProgressService {
  constructor(
    private exerciseRepository: IExerciseRepository,
    private progressRepository: IProgressRepository
  ) {}

  getWeeklyProgress(): WeeklyProgress {
    const allExercises = this.exerciseRepository.getAll();
    const currentProgress = this.progressRepository.getCurrentProgress();

    const totalExercises = allExercises.length;
    let completedExercises = 0;

    allExercises.forEach(exercise => {
      const progress = currentProgress[exercise.id];
      if (progress && (progress.completed || progress.skipped)) {
        completedExercises++;
      }
    });

    const percentage = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

    return {
      completedExercises,
      totalExercises,
      percentage
    };
  }

  resetWeeklyProgress(): void {
    this.progressRepository.resetProgress();
  }
}