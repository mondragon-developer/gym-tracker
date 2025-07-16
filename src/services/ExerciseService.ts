import { Exercise, NewExercise, ExerciseWithProgress, ExerciseProgress } from '../types/Exercise';
import { IExerciseService } from './interfaces/IExerciseService';
import { IExerciseRepository } from '../repositories/interfaces/IExerciseRepository';
import { IProgressRepository } from '../repositories/interfaces/IProgressRepository';
import { DEFAULT_EXERCISES } from '../data/exercisesWithVideos';

export class ExerciseService implements IExerciseService {
  constructor(
    private exerciseRepository: IExerciseRepository,
    private progressRepository: IProgressRepository
  ) {}

  getAllExercises(): ExerciseWithProgress[] {
    const exercises = this.exerciseRepository.getAll();
    const currentProgress = this.progressRepository.getCurrentProgress();
    const previousProgress = this.progressRepository.getPreviousProgress();

    return exercises.map(exercise => ({
      ...exercise,
      progress: currentProgress[exercise.id],
      previousWeight: previousProgress[exercise.id]?.weight
    }));
  }

  getExercisesByMuscleGroup(muscleGroupId: string): ExerciseWithProgress[] {
    const exercises = this.exerciseRepository.getByMuscleGroup(muscleGroupId);
    const currentProgress = this.progressRepository.getCurrentProgress();
    const previousProgress = this.progressRepository.getPreviousProgress();

    return exercises.map(exercise => ({
      ...exercise,
      progress: currentProgress[exercise.id],
      previousWeight: previousProgress[exercise.id]?.weight
    }));
  }

  addCustomExercise(exercise: NewExercise): Exercise {
    return this.exerciseRepository.add(exercise);
  }

  deleteExercise(id: string): void {
    const exercise = this.exerciseRepository.getById(id);
    if (exercise && exercise.isCustom) {
      this.exerciseRepository.remove(id);
    }
  }

  updateExerciseProgress(
    exerciseId: string,
    completed: boolean,
    skipped: boolean,
    effectiveSets: number,
    reps: number,
    weight: number
  ): void {
    const progress: ExerciseProgress = {
      exerciseId,
      completed,
      skipped,
      effectiveSets,
      reps,
      weight
    };

    this.progressRepository.updateExerciseProgress(exerciseId, progress);
  }

  getDefaultExercisesForDay(dayId: string): Exercise[] {
    return DEFAULT_EXERCISES.filter(exercise => exercise.day === dayId);
  }
}