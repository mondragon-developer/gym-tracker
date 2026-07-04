import { Exercise, NewExercise } from '../../types/Exercise';

/**
 * Persistence contract for exercises.
 *
 * All methods are async (return Promises) because an implementation may talk to
 * a remote database over the network. Synchronous implementations (e.g. the
 * localStorage fallback) simply return already-resolved Promises.
 */
export interface IExerciseRepository {
  getAll(): Promise<Exercise[]>;
  getByMuscleGroup(muscleGroupId: string): Promise<Exercise[]>;
  getById(id: string): Promise<Exercise | null>;
  add(exercise: NewExercise): Promise<Exercise>;
  remove(id: string): Promise<void>;
  getCustomExercises(): Promise<Exercise[]>;
}
