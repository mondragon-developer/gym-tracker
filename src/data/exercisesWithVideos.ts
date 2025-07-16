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
    day: 'tuesday',
    videoUrl: 'https://www.youtube.com/embed/wol7Hko8RhY'
  },
  {
    id: 'tue-shoulders-2',
    name: 'Lateral Raises',
    setsReps: '3 sets × 12-15 reps',
    isCustom: false,
    muscleGroup: 'tue-shoulders',
    day: 'tuesday',
    videoUrl: 'https://www.youtube.com/embed/3VcKaas9EaU'
  },
  {
    id: 'tue-shoulders-3',
    name: 'Rear Delt Flyes',
    setsReps: '3 sets × 15-20 reps',
    isCustom: false,
    muscleGroup: 'tue-shoulders',
    day: 'tuesday',
    videoUrl: 'https://www.youtube.com/embed/EA7u4Q_8HQ0'
  },
  // Wednesday - Legs & Abs
  {
    id: 'wed-legs-1',
    name: 'Barbell Squats',
    setsReps: '4 sets × 8-10 reps',
    isCustom: false,
    muscleGroup: 'wed-legs',
    day: 'wednesday',
    videoUrl: 'https://www.youtube.com/embed/Dy28eq2PjcM'
  },
  {
    id: 'wed-legs-2',
    name: 'Leg Press',
    setsReps: '3 sets × 10-12 reps',
    isCustom: false,
    muscleGroup: 'wed-legs',
    day: 'wednesday',
    videoUrl: 'https://www.youtube.com/embed/IZxyjW7MPJQ'
  },
  {
    id: 'wed-legs-3',
    name: 'Romanian Deadlifts',
    setsReps: '3 sets × 10-12 reps',
    isCustom: false,
    muscleGroup: 'wed-legs',
    day: 'wednesday',
    videoUrl: 'https://www.youtube.com/embed/jEy_czb3RKA'
  },
  {
    id: 'wed-legs-4',
    name: 'Leg Curls',
    setsReps: '3 sets × 12-15 reps',
    isCustom: false,
    muscleGroup: 'wed-legs',
    day: 'wednesday',
    videoUrl: 'https://www.youtube.com/embed/1Tq3QdYUuHs'
  },
  {
    id: 'wed-legs-5',
    name: 'Calf Raises',
    setsReps: '4 sets × 15-20 reps',
    isCustom: false,
    muscleGroup: 'wed-legs',
    day: 'wednesday',
    videoUrl: 'https://www.youtube.com/embed/gwLzBJYoWlI'
  },
  {
    id: 'wed-abs-1',
    name: 'Cable Crunches',
    setsReps: '3 sets × 15-20 reps',
    isCustom: false,
    muscleGroup: 'wed-abs',
    day: 'wednesday',
    videoUrl: 'https://www.youtube.com/embed/Ff4Q1_XdZpI'
  },
  {
    id: 'wed-abs-2',
    name: 'Hanging Leg Raises',
    setsReps: '3 sets × 12-15 reps',
    isCustom: false,
    muscleGroup: 'wed-abs',
    day: 'wednesday',
    videoUrl: 'https://www.youtube.com/embed/Pr1ieGZ5atk'
  },
  // Thursday - Chest & Triceps
  {
    id: 'thu-chest-1',
    name: 'Dumbbell Bench Press',
    setsReps: '4 sets × 8-10 reps',
    isCustom: false,
    muscleGroup: 'thu-chest',
    day: 'thursday',
    videoUrl: 'https://www.youtube.com/embed/VmB1G1K7v94'
  },
  {
    id: 'thu-chest-2',
    name: 'Incline Barbell Press',
    setsReps: '3 sets × 10-12 reps',
    isCustom: false,
    muscleGroup: 'thu-chest',
    day: 'thursday',
    videoUrl: 'https://www.youtube.com/embed/DbFgAGZXNwk'
  },
  {
    id: 'thu-chest-3',
    name: 'Dips (Chest-focused)',
    setsReps: '3 sets × 10-15 reps',
    isCustom: false,
    muscleGroup: 'thu-chest',
    day: 'thursday',
    videoUrl: 'https://www.youtube.com/embed/2z8JmcrW-As'
  },
  {
    id: 'thu-triceps-1',
    name: 'Skull Crushers',
    setsReps: '4 sets × 10-12 reps',
    isCustom: false,
    muscleGroup: 'thu-triceps',
    day: 'thursday',
    videoUrl: 'https://www.youtube.com/embed/d_KZxkY_0cM'
  },
  {
    id: 'thu-triceps-2',
    name: 'Rope Pushdowns',
    setsReps: '3 sets × 12-15 reps',
    isCustom: false,
    muscleGroup: 'thu-triceps',
    day: 'thursday',
    videoUrl: 'https://www.youtube.com/embed/2-LAMcpzODU'
  },
  {
    id: 'thu-triceps-3',
    name: 'Overhead Dumbbell Extension',
    setsReps: '3 sets × 12-15 reps',
    isCustom: false,
    muscleGroup: 'thu-triceps',
    day: 'thursday',
    videoUrl: 'https://www.youtube.com/embed/YbX7Wd8jQ-Q'
  },
  // Friday - Back & Biceps
  {
    id: 'fri-back-1',
    name: 'Barbell Rows',
    setsReps: '4 sets × 8-10 reps',
    isCustom: false,
    muscleGroup: 'fri-back',
    day: 'friday',
    videoUrl: 'https://www.youtube.com/embed/FWJR5Ve8bnQ'
  },
  {
    id: 'fri-back-2',
    name: 'Lat Pulldowns',
    setsReps: '3 sets × 10-12 reps',
    isCustom: false,
    muscleGroup: 'fri-back',
    day: 'friday',
    videoUrl: 'https://www.youtube.com/embed/CAwf7n6Luuc'
  },
  {
    id: 'fri-back-3',
    name: 'Single Arm Dumbbell Row',
    setsReps: '3 sets × 10-12 reps',
    isCustom: false,
    muscleGroup: 'fri-back',
    day: 'friday',
    videoUrl: 'https://www.youtube.com/embed/roCP6wCXPqo'
  },
  {
    id: 'fri-biceps-1',
    name: 'Incline Dumbbell Curls',
    setsReps: '4 sets × 10-12 reps',
    isCustom: false,
    muscleGroup: 'fri-biceps',
    day: 'friday',
    videoUrl: 'https://www.youtube.com/embed/soxrZlIl35U'
  },
  {
    id: 'fri-biceps-2',
    name: 'Preacher Curls',
    setsReps: '3 sets × 12-15 reps',
    isCustom: false,
    muscleGroup: 'fri-biceps',
    day: 'friday',
    videoUrl: 'https://www.youtube.com/embed/fIWP-FRFNU0'
  },
  {
    id: 'fri-biceps-3',
    name: 'Concentration Curls',
    setsReps: '3 sets × 12-15 reps',
    isCustom: false,
    muscleGroup: 'fri-biceps',
    day: 'friday',
    videoUrl: 'https://www.youtube.com/embed/0AUGkch3tzc'
  },
  // Saturday - Shoulders & Abs
  {
    id: 'sat-shoulders-1',
    name: 'Seated Dumbbell Press',
    setsReps: '4 sets × 8-10 reps',
    isCustom: false,
    muscleGroup: 'sat-shoulders',
    day: 'saturday',
    videoUrl: 'https://www.youtube.com/embed/qEwKCR5JCog'
  },
  {
    id: 'sat-shoulders-2',
    name: 'Arnold Press',
    setsReps: '3 sets × 10-12 reps',
    isCustom: false,
    muscleGroup: 'sat-shoulders',
    day: 'saturday',
    videoUrl: 'https://www.youtube.com/embed/6Z15_WdXmVw'
  },
  {
    id: 'sat-shoulders-3',
    name: 'Barbell Shrugs',
    setsReps: '4 sets × 8-12 reps',
    isCustom: false,
    muscleGroup: 'sat-shoulders',
    day: 'saturday',
    videoUrl: 'https://www.youtube.com/embed/cJRVVxmytaM'
  },
  {
    id: 'sat-abs-1',
    name: 'Ab Rollout',
    setsReps: '3 sets × 10-15 reps',
    isCustom: false,
    muscleGroup: 'sat-abs',
    day: 'saturday',
    videoUrl: 'https://www.youtube.com/embed/EpjOn8nU1Pw'
  },
  {
    id: 'sat-abs-2',
    name: 'Russian Twists',
    setsReps: '3 sets × 15-20 reps per side',
    isCustom: false,
    muscleGroup: 'sat-abs',
    day: 'saturday',
    videoUrl: 'https://www.youtube.com/embed/wkD8rjkodUI'
  }
];