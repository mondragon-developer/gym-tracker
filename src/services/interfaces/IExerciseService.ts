import { Exercise, NewExercise, ExerciseWithProgress } from '../../types/Exercise';

export interface IExerciseService {
  getAllExercises(): Promise<ExerciseWithProgress[]>;
  getExercisesByMuscleGroup(muscleGroupId: string): Promise<ExerciseWithProgress[]>;
  addCustomExercise(exercise: NewExercise): Promise<Exercise>;
  deleteExercise(id: string): Promise<void>;
  updateExerciseProgress(
    exerciseId: string,
    completed: boolean,
    skipped: boolean,
    effectiveSets: number,
    reps: number,
    weight: number
  ): Promise<void>;
}
