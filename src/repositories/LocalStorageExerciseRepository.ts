import { Exercise, NewExercise } from '../types/Exercise';
import { IExerciseRepository } from './interfaces/IExerciseRepository';
import { DEFAULT_EXERCISES } from '../data/exercisesWithVideos';

/**
 * Offline fallback implementation backed by the browser's localStorage.
 *
 * Kept as a valid implementation of IExerciseRepository so the app can run
 * without a backend. Methods are async only to satisfy the interface; they
 * resolve immediately.
 */
export class LocalStorageExerciseRepository implements IExerciseRepository {
  private readonly STORAGE_KEY = 'customExercises';

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
    const exercise: Exercise = {
      id: `${newExercise.muscleGroup}-custom-${Date.now()}`,
      name: newExercise.name,
      setsReps: `${newExercise.sets} sets × ${newExercise.reps} reps`,
      isCustom: true,
      muscleGroup: newExercise.muscleGroup,
      day: newExercise.day
    };

    const customExercises = await this.getCustomExercises();
    customExercises.push(exercise);
    this.saveCustomExercises(customExercises);

    return exercise;
  }

  async remove(id: string): Promise<void> {
    const customExercises = (await this.getCustomExercises()).filter(
      exercise => exercise.id !== id
    );
    this.saveCustomExercises(customExercises);
  }

  async getCustomExercises(): Promise<Exercise[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading custom exercises:', error);
      return [];
    }
  }

  private saveCustomExercises(exercises: Exercise[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(exercises));
    } catch (error) {
      console.error('Error saving custom exercises:', error);
    }
  }
}
