import { Exercise, NewExercise } from '../types/Exercise';
import { IExerciseRepository } from './interfaces/IExerciseRepository';
import { DEFAULT_EXERCISES } from '../data/exercisesWithVideos';

export class LocalStorageExerciseRepository implements IExerciseRepository {
  private readonly STORAGE_KEY = 'customExercises';

  getAll(): Exercise[] {
    const customExercises = this.getCustomExercises();
    return [...DEFAULT_EXERCISES, ...customExercises];
  }

  getByMuscleGroup(muscleGroupId: string): Exercise[] {
    return this.getAll().filter(exercise => exercise.muscleGroup === muscleGroupId);
  }

  getById(id: string): Exercise | null {
    return this.getAll().find(exercise => exercise.id === id) || null;
  }

  add(newExercise: NewExercise): Exercise {
    const exercise: Exercise = {
      id: `${newExercise.muscleGroup}-custom-${Date.now()}`,
      name: newExercise.name,
      setsReps: `${newExercise.sets} sets × ${newExercise.reps} reps`,
      isCustom: true,
      muscleGroup: newExercise.muscleGroup,
      day: newExercise.day
    };

    const customExercises = this.getCustomExercises();
    customExercises.push(exercise);
    this.saveCustomExercises(customExercises);

    return exercise;
  }

  remove(id: string): void {
    const customExercises = this.getCustomExercises().filter(exercise => exercise.id !== id);
    this.saveCustomExercises(customExercises);
  }

  getCustomExercises(): Exercise[] {
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