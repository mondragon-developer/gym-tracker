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

  async getAllExercises(): Promise<ExerciseWithProgress[]> {
    // Fetch exercises + both progress maps in parallel to minimise round-trips.
    const [exercises, currentProgress, previousProgress] = await Promise.all([
      this.exerciseRepository.getAll(),
      this.progressRepository.getCurrentProgress(),
      this.progressRepository.getPreviousProgress()
    ]);

    return exercises.map(exercise => ({
      ...exercise,
      progress: currentProgress[exercise.id],
      previousWeight: previousProgress[exercise.id]?.weight
    }));
  }

  async getExercisesByMuscleGroup(muscleGroupId: string): Promise<ExerciseWithProgress[]> {
    const [exercises, currentProgress, previousProgress] = await Promise.all([
      this.exerciseRepository.getByMuscleGroup(muscleGroupId),
      this.progressRepository.getCurrentProgress(),
      this.progressRepository.getPreviousProgress()
    ]);

    return exercises.map(exercise => ({
      ...exercise,
      progress: currentProgress[exercise.id],
      previousWeight: previousProgress[exercise.id]?.weight
    }));
  }

  async addCustomExercise(exercise: NewExercise): Promise<Exercise> {
    return this.exerciseRepository.add(exercise);
  }

  async deleteExercise(id: string): Promise<void> {
    const exercise = await this.exerciseRepository.getById(id);
    if (exercise && exercise.isCustom) {
      await this.exerciseRepository.remove(id);
    }
  }

  async updateExerciseProgress(
    exerciseId: string,
    completed: boolean,
    skipped: boolean,
    effectiveSets: number,
    reps: number,
    weight: number
  ): Promise<void> {
    const progress: ExerciseProgress = {
      exerciseId,
      completed,
      skipped,
      effectiveSets,
      reps,
      weight
    };

    await this.progressRepository.updateExerciseProgress(exerciseId, progress);
  }

  /** Default exercises come from the static catalog, not the DB. */
  getDefaultExercisesForDay(dayId: string): Exercise[] {
    return DEFAULT_EXERCISES.filter(exercise => exercise.day === dayId);
  }
}
