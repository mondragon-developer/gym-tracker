import { Exercise, NewExercise, ExerciseWithProgress } from '../../types/Exercise';

export interface IExerciseService {
  getAllExercises(): ExerciseWithProgress[];
  getExercisesByMuscleGroup(muscleGroupId: string): ExerciseWithProgress[];
  addCustomExercise(exercise: NewExercise): Exercise;
  deleteExercise(id: string): void;
  updateExerciseProgress(exerciseId: string, completed: boolean, skipped: boolean, effectiveSets: number, reps: number, weight: number): void;
}