import { Exercise, NewExercise } from '../../types/Exercise';

export interface IExerciseRepository {
  getAll(): Exercise[];
  getByMuscleGroup(muscleGroupId: string): Exercise[];
  getById(id: string): Exercise | null;
  add(exercise: NewExercise): Exercise;
  remove(id: string): void;
  getCustomExercises(): Exercise[];
}