import type { ExerciseProgress } from './Exercise';

export interface WeeklyProgress {
  completedExercises: number;
  totalExercises: number;
  percentage: number;
}

export interface VideoLink {
  [exerciseName: string]: string;
}

export const VIDEO_LINKS: VideoLink = {
  "Barbell Bench Press": "https://www.youtube.com/embed/Wm1NHLAZxP8",
};