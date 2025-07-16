export interface Exercise {
  id: string;
  name: string;
  setsReps: string;
  isCustom: boolean;
  muscleGroup: string;
  day: string;
  videoUrl?: string;
}

export interface ExerciseProgress {
  exerciseId: string;
  completed: boolean;
  skipped: boolean;
  effectiveSets: number;
  reps: number;
  weight: number;
}

export interface ExerciseWithProgress extends Exercise {
  progress?: ExerciseProgress;
  previousWeight?: number;
}

export interface ProgressData {
  [exerciseId: string]: ExerciseProgress;
}

export interface NewExercise {
  name: string;
  sets: number;
  reps: string;
  muscleGroup: string;
  day: string;
  videoUrl?: string;
}

export interface DayNotes {
  [dayId: string]: string;
}