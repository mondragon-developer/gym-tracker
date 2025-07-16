import exerciseDatabase from '../data/database.json';

export interface DatabaseExercise {
  name: string;
  sets: string;
  videoUrl: string;
  muscle: string;
  equipment: string;
}

export class ExerciseDatabaseService {
  private exercises: { [muscle: string]: DatabaseExercise[] };

  constructor() {
    this.exercises = exerciseDatabase.exercises;
  }

  getAllExercises(): DatabaseExercise[] {
    return Object.values(this.exercises).flat();
  }

  getExercisesByMuscle(muscle: string): DatabaseExercise[] {
    const muscleKey = muscle.toLowerCase();
    return this.exercises[muscleKey] || [];
  }

  findExerciseByName(name: string): DatabaseExercise | undefined {
    return this.getAllExercises().find(exercise => 
      exercise.name.toLowerCase() === name.toLowerCase()
    );
  }

  getVideoUrl(exerciseName: string): string {
    const exercise = this.findExerciseByName(exerciseName);
    if (exercise?.videoUrl) {
      return exercise.videoUrl;
    }
    
    // Fallback to search if not found in database
    return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(exerciseName + ' exercise tutorial')}`;
  }

  getMuscleGroups(): string[] {
    return Object.keys(this.exercises);
  }

  searchExercises(query: string): DatabaseExercise[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllExercises().filter(exercise =>
      exercise.name.toLowerCase().includes(lowercaseQuery) ||
      exercise.muscle.toLowerCase().includes(lowercaseQuery) ||
      exercise.equipment.toLowerCase().includes(lowercaseQuery)
    );
  }
}