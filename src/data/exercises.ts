import { Exercise } from '../types/Exercise';

export const DEFAULT_EXERCISES: Exercise[] = [
  // Monday - Chest & Biceps
  {
    id: 'mon-chest-1',
    name: 'Barbell Bench Press',
    setsReps: '4 sets × 8-10 reps',
    isCustom: false,
    muscleGroup: 'mon-chest',
    day: 'monday',
    videoUrl: 'https://www.youtube.com/embed/rT7DgCr-3pg'
  },
  {
    id: 'mon-chest-2',
    name: 'Incline Dumbbell Press',
    setsReps: '3 sets × 10-12 reps',
    isCustom: false,
    muscleGroup: 'mon-chest',
    day: 'monday',
    videoUrl: 'https://www.youtube.com/embed/8iPEnn-ltC8'
  },
  {
    id: 'mon-chest-3',
    name: 'Cable Flyes',
    setsReps: '3 sets × 12-15 reps',
    isCustom: false,
    muscleGroup: 'mon-chest',
    day: 'monday',
    videoUrl: 'https://www.youtube.com/embed/Iwe6AmxVf7o'
  },
  {
    id: 'mon-biceps-1',
    name: 'Barbell Curls',
    setsReps: '4 sets × 10-12 reps',
    isCustom: false,
    muscleGroup: 'mon-biceps',
    day: 'monday',
    videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo'
  },
  {
    id: 'mon-biceps-2',
    name: 'Hammer Curls',
    setsReps: '3 sets × 12-15 reps',
    isCustom: false,
    muscleGroup: 'mon-biceps',
    day: 'monday',
    videoUrl: 'https://www.youtube.com/embed/zC3nLlEvin4'
  },
  {
    id: 'mon-biceps-3',
    name: 'Cable Rope Curls',
    setsReps: '3 sets × 15-20 reps',
    isCustom: false,
    muscleGroup: 'mon-biceps',
    day: 'monday',
    videoUrl: 'https://www.youtube.com/embed/NGlLXmK0Gvw'
  },
  // Tuesday - Back & Shoulders
  {
    id: 'tue-back-1',
    name: 'Deadlifts',
    setsReps: '4 sets × 6-8 reps',
    isCustom: false,
    muscleGroup: 'tue-back',
    day: 'tuesday',
    videoUrl: 'https://www.youtube.com/embed/ytGaGIn3SjE'
  },
  {
    id: 'tue-back-2',
    name: 'Pull-ups',
    setsReps: '3 sets × 8-12 reps',
    isCustom: false,
    muscleGroup: 'tue-back',
    day: 'tuesday',
    videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g'
  },
  {
    id: 'tue-back-3',
    name: 'Seated Cable Rows',
    setsReps: '3 sets × 12-15 reps',
    isCustom: false,
    muscleGroup: 'tue-back',
    day: 'tuesday',
    videoUrl: 'https://www.youtube.com/embed/xQNrFHEMhI4'
  },
  {
    id: 'tue-shoulders-1',
    name: 'Military Press',
    setsReps: '4 sets × 8-10 reps',
    isCustom: false,
    muscleGroup: 'tue-shoulders',
    day: 'tuesday'
  },
  {
    id: 'tue-shoulders-2',
    name: 'Lateral Raises',
    setsReps: '3 sets × 12-15 reps',
    isCustom: false,
    muscleGroup: 'tue-shoulders',
    day: 'tuesday'
  },
  {
    id: 'tue-shoulders-3',
    name: 'Rear Delt Flyes',
    setsReps: '3 sets × 15-20 reps',
    isCustom: false,
    muscleGroup: 'tue-shoulders',
    day: 'tuesday'
  },
  // Wednesday - Legs & Abs
  {
    id: 'wed-legs-1',
    name: 'Barbell Squats',
    setsReps: '4 sets × 8-10 reps',
    isCustom: false,
    muscleGroup: 'wed-legs',
    day: 'wednesday'
  },
  {
    id: 'wed-legs-2',
    name: 'Leg Press',
    setsReps: '3 sets × 10-12 reps',
    isCustom: false,
    muscleGroup: 'wed-legs',
    day: 'wednesday'
  },
  {
    id: 'wed-legs-3',
    name: 'Romanian Deadlifts',
    setsReps: '3 sets × 10-12 reps',
    isCustom: false,
    muscleGroup: 'wed-legs',
    day: 'wednesday'
  },
  {
    id: 'wed-legs-4',
    name: 'Leg Curls',
    setsReps: '3 sets × 12-15 reps',
    isCustom: false,
    muscleGroup: 'wed-legs',
    day: 'wednesday'
  },
  {
    id: 'wed-legs-5',
    name: 'Calf Raises',
    setsReps: '4 sets × 15-20 reps',
    isCustom: false,
    muscleGroup: 'wed-legs',
    day: 'wednesday'
  },
  {
    id: 'wed-abs-1',
    name: 'Cable Crunches',
    setsReps: '3 sets × 15-20 reps',
    isCustom: false,
    muscleGroup: 'wed-abs',
    day: 'wednesday'
  },
  {
    id: 'wed-abs-2',
    name: 'Hanging Leg Raises',
    setsReps: '3 sets × 12-15 reps',
    isCustom: false,
    muscleGroup: 'wed-abs',
    day: 'wednesday'
  },
  // Thursday - Chest & Triceps
  {
    id: 'thu-chest-1',
    name: 'Dumbbell Bench Press',
    setsReps: '4 sets × 8-10 reps',
    isCustom: false,
    muscleGroup: 'thu-chest',
    day: 'thursday'
  },
  {
    id: 'thu-chest-2',
    name: 'Incline Barbell Press',
    setsReps: '3 sets × 10-12 reps',
    isCustom: false,
    muscleGroup: 'thu-chest',
    day: 'thursday'
  },
  {
    id: 'thu-chest-3',
    name: 'Dips (Chest-focused)',
    setsReps: '3 sets × 10-15 reps',
    isCustom: false,
    muscleGroup: 'thu-chest',
    day: 'thursday'
  },
  {
    id: 'thu-triceps-1',
    name: 'Skull Crushers',
    setsReps: '4 sets × 10-12 reps',
    isCustom: false,
    muscleGroup: 'thu-triceps',
    day: 'thursday'
  },
  {
    id: 'thu-triceps-2',
    name: 'Rope Pushdowns',
    setsReps: '3 sets × 12-15 reps',
    isCustom: false,
    muscleGroup: 'thu-triceps',
    day: 'thursday'
  },
  {
    id: 'thu-triceps-3',
    name: 'Overhead Dumbbell Extension',
    setsReps: '3 sets × 12-15 reps',
    isCustom: false,
    muscleGroup: 'thu-triceps',
    day: 'thursday'
  },
  // Friday - Back & Biceps
  {
    id: 'fri-back-1',
    name: 'Barbell Rows',
    setsReps: '4 sets × 8-10 reps',
    isCustom: false,
    muscleGroup: 'fri-back',
    day: 'friday'
  },
  {
    id: 'fri-back-2',
    name: 'Lat Pulldowns',
    setsReps: '3 sets × 10-12 reps',
    isCustom: false,
    muscleGroup: 'fri-back',
    day: 'friday'
  },
  {
    id: 'fri-back-3',
    name: 'Single Arm Dumbbell Row',
    setsReps: '3 sets × 10-12 reps',
    isCustom: false,
    muscleGroup: 'fri-back',
    day: 'friday'
  },
  {
    id: 'fri-biceps-1',
    name: 'Incline Dumbbell Curls',
    setsReps: '4 sets × 10-12 reps',
    isCustom: false,
    muscleGroup: 'fri-biceps',
    day: 'friday'
  },
  {
    id: 'fri-biceps-2',
    name: 'Preacher Curls',
    setsReps: '3 sets × 12-15 reps',
    isCustom: false,
    muscleGroup: 'fri-biceps',
    day: 'friday'
  },
  {
    id: 'fri-biceps-3',
    name: 'Concentration Curls',
    setsReps: '3 sets × 12-15 reps',
    isCustom: false,
    muscleGroup: 'fri-biceps',
    day: 'friday'
  },
  // Saturday - Shoulders & Abs
  {
    id: 'sat-shoulders-1',
    name: 'Seated Dumbbell Press',
    setsReps: '4 sets × 8-10 reps',
    isCustom: false,
    muscleGroup: 'sat-shoulders',
    day: 'saturday'
  },
  {
    id: 'sat-shoulders-2',
    name: 'Arnold Press',
    setsReps: '3 sets × 10-12 reps',
    isCustom: false,
    muscleGroup: 'sat-shoulders',
    day: 'saturday'
  },
  {
    id: 'sat-shoulders-3',
    name: 'Barbell Shrugs',
    setsReps: '4 sets × 8-12 reps',
    isCustom: false,
    muscleGroup: 'sat-shoulders',
    day: 'saturday'
  },
  {
    id: 'sat-abs-1',
    name: 'Ab Rollout',
    setsReps: '3 sets × 10-15 reps',
    isCustom: false,
    muscleGroup: 'sat-abs',
    day: 'saturday'
  },
  {
    id: 'sat-abs-2',
    name: 'Russian Twists',
    setsReps: '3 sets × 15-20 reps per side',
    isCustom: false,
    muscleGroup: 'sat-abs',
    day: 'saturday'
  }
];