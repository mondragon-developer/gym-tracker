export interface Day {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  isOpen: boolean;
}

export interface MuscleGroup {
  id: string;
  name: string;
  exercises: string[];
}

export const DAYS: Day[] = [
  {
    id: 'monday',
    name: 'Monday - Chest & Biceps',
    muscleGroups: [
      { id: 'mon-chest', name: 'Chest', exercises: [] },
      { id: 'mon-biceps', name: 'Biceps', exercises: [] }
    ],
    isOpen: false
  },
  {
    id: 'tuesday',
    name: 'Tuesday - Back & Shoulders',
    muscleGroups: [
      { id: 'tue-back', name: 'Back', exercises: [] },
      { id: 'tue-shoulders', name: 'Shoulders', exercises: [] }
    ],
    isOpen: false
  },
  {
    id: 'wednesday',
    name: 'Wednesday - Legs & Abs',
    muscleGroups: [
      { id: 'wed-legs', name: 'Legs', exercises: [] },
      { id: 'wed-abs', name: 'Abs', exercises: [] }
    ],
    isOpen: false
  },
  {
    id: 'thursday',
    name: 'Thursday - Chest & Triceps',
    muscleGroups: [
      { id: 'thu-chest', name: 'Chest', exercises: [] },
      { id: 'thu-triceps', name: 'Triceps', exercises: [] }
    ],
    isOpen: false
  },
  {
    id: 'friday',
    name: 'Friday - Back & Biceps',
    muscleGroups: [
      { id: 'fri-back', name: 'Back', exercises: [] },
      { id: 'fri-biceps', name: 'Biceps', exercises: [] }
    ],
    isOpen: false
  },
  {
    id: 'saturday',
    name: 'Saturday - Shoulders & Abs',
    muscleGroups: [
      { id: 'sat-shoulders', name: 'Shoulders', exercises: [] },
      { id: 'sat-abs', name: 'Abs', exercises: [] }
    ],
    isOpen: false
  }
];