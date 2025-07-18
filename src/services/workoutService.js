/**
 * Workout Service - Handles workout plan operations
 * Follows Single Responsibility Principle by focusing solely on workout management
 * Uses dependency injection for storage to follow Dependency Inversion Principle
 */

import { storageService } from './StorageService.js';
import ExerciseService from './ExerciseService.js';

/**
 * @typedef {import('./ExerciseService.js').Exercise} Exercise
 */

/**
 * @typedef {Object} DayPlan
 * @property {string} name - The name of the workout for the day
 * @property {Exercise[]} exercises - Array of exercises for the day
 */

/**
 * @typedef {Object.<string, DayPlan>} WorkoutPlan
 */

const STORAGE_KEY = 'gymAppWorkoutPlan';

/**
 * The initial default structure of the workout plan.
 * This is used if no plan is found in local storage.
 * @type {WorkoutPlan}
 */
const INITIAL_WORKOUT_PLAN = {
    Monday: { name: "Chest & Shoulders & Triceps", exercises: [
        { id: "ex1", dbId: 1, name: "Barbell Bench Press", sets: "4", reps: "8-10", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex2", dbId: 2, name: "Incline Dumbbell Press", sets: "3", reps: "10-12", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex3", dbId: 17, name: "Military Press", sets: "4", reps: "8-10", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex4", dbId: 19, name: "Lateral Raises", sets: "3", reps: "12-15", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex5", dbId: 30, name: "Rope Pushdowns", sets: "3", reps: "10-12", weight: "", effectiveSets: "", status: "incomplete" },
    ]},
    Tuesday: { name: "Back & Biceps", exercises: [
        { id: "ex6", dbId: 9, name: "Pull-ups", sets: "3", reps: "8-12", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex7", dbId: 11, name: "Seated Cable Rows", sets: "4", reps: "10-12", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex8", dbId: 38, name: "Barbell Curls", sets: "4", reps: "10-12", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex9", dbId: 40, name: "Hammer Curls", sets: "3", reps: "12-15", weight: "", effectiveSets: "", status: "incomplete" },
    ]},
    Wednesday: { name: "Legs", exercises: [
        { id: "ex10", dbId: 60, name: "Barbell Squats", sets: "4", reps: "8-10", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex11", dbId: 66, name: "Romanian Deadlifts", sets: "3", reps: "10-12", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex12", dbId: 61, name: "Leg Press", sets: "3", reps: "12-15", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex13", dbId: 80, name: "Single-Leg Calf Raises", sets: "4", reps: "15-20", weight: "", effectiveSets: "", status: "incomplete" },
    ]},
    Thursday: { name: "Chest & Shoulders & Triceps", exercises: [
        { id: "ex14", dbId: 3, name: "Cable Flyes", sets: "3", reps: "12-15", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex15", dbId: 81, name: "Dumbbell Press", sets: "4", reps: "8-12", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex16", dbId: 82, name: "Push-Ups", sets: "3", reps: "12-15", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex17", dbId: 94, name: "Overhead Press", sets: "3", reps: "8-10", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex18", dbId: 19, name: "Lateral Raises", sets: "3", reps: "12-15", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex19", dbId: 33, name: "Skull Crushers", sets: "3", reps: "10-12", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex20", dbId: 110, name: "Dips", sets: "3", reps: "8-12", weight: "", effectiveSets: "", status: "incomplete" },
    ]},
    Friday: { name: "Back & Biceps", exercises: [
        { id: "ex21", dbId: 88, name: "Lat Pulldowns", sets: "4", reps: "10-12", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex22", dbId: 89, name: "Bent-Over Barbell Rows", sets: "3", reps: "8-10", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex23", dbId: 90, name: "Single-Arm Dumbbell Rows", sets: "3", reps: "10-12", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex24", dbId: 92, name: "Face Pulls", sets: "3", reps: "15-20", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex25", dbId: 113, name: "Dumbbell Curls", sets: "4", reps: "10-12", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex26", dbId: 114, name: "Preacher Curls", sets: "3", reps: "12-15", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex27", dbId: 40, name: "Hammer Curls", sets: "3", reps: "12-15", weight: "", effectiveSets: "", status: "incomplete" },
    ]},
    Saturday: { name: "Legs", exercises: [
        { id: "ex28", dbId: 132, name: "Deadlifts", sets: "4", reps: "6-8", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex29", dbId: 134, name: "Front Squats", sets: "3", reps: "8-10", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex30", dbId: 128, name: "Lunges", sets: "3", reps: "12-15", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex31", dbId: 133, name: "Leg Extensions", sets: "3", reps: "15-20", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex32", dbId: 137, name: "Lying Leg Curls", sets: "3", reps: "12-15", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex33", dbId: 144, name: "Standing Calf Raises", sets: "4", reps: "15-20", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex34", dbId: 145, name: "Seated Calf Raises", sets: "3", reps: "15-20", weight: "", effectiveSets: "", status: "incomplete" },
    ]},
    Sunday: { name: "Rest", exercises: [] },
};


/**
 * Workout Service class for handling workout plan operations
 * Implements proper dependency injection and separation of concerns
 */
class WorkoutService {
    /**
     * @param {import('./StorageService.js').StorageService} storage - Storage service instance
     */
    constructor(storage = storageService) {
        this.storage = storage;
    }

    /**
     * Retrieves the workout plan from storage
     * @returns {WorkoutPlan} The user's workout plan
     */
    getPlan() {
        const savedPlan = this.storage.getWorkoutPlan(STORAGE_KEY);
        return savedPlan || this.getInitialPlan();
    }

    /**
     * Saves the workout plan to storage
     * @param {WorkoutPlan} plan - The workout plan to save
     */
    savePlan(plan) {
        this.storage.saveWorkoutPlan(plan, STORAGE_KEY);
    }

    /**
     * Returns the initial workout plan
     * @returns {WorkoutPlan} Default workout plan
     */
    getInitialPlan() {
        return INITIAL_WORKOUT_PLAN;
    }

    /**
     * Adds an exercise to a specific day
     * @param {WorkoutPlan} workoutPlan - Current workout plan
     * @param {string} day - Day of the week
     * @param {Object} exerciseData - Exercise data to add
     * @returns {WorkoutPlan} Updated workout plan
     */
    addExerciseToDay(workoutPlan, day, exerciseData) {
        const newExercise = ExerciseService.createExercise(exerciseData);
        
        return {
            ...workoutPlan,
            [day]: {
                ...workoutPlan[day],
                exercises: [...workoutPlan[day].exercises, newExercise]
            }
        };
    }

    /**
     * Updates an exercise in the workout plan
     * @param {WorkoutPlan} workoutPlan - Current workout plan
     * @param {string} day - Day of the week
     * @param {string} exerciseId - Exercise ID to update
     * @param {Object} updates - Updates to apply
     * @returns {WorkoutPlan} Updated workout plan
     */
    updateExercise(workoutPlan, day, exerciseId, updates) {
        const dayPlan = workoutPlan[day];
        const updatedExercises = dayPlan.exercises.map(exercise => 
            exercise.id === exerciseId 
                ? ExerciseService.updateExercise(exercise, updates)
                : exercise
        );

        return {
            ...workoutPlan,
            [day]: {
                ...dayPlan,
                exercises: updatedExercises
            }
        };
    }

    /**
     * Removes an exercise from a day
     * @param {WorkoutPlan} workoutPlan - Current workout plan
     * @param {string} day - Day of the week
     * @param {string} exerciseId - Exercise ID to remove
     * @returns {WorkoutPlan} Updated workout plan
     */
    removeExercise(workoutPlan, day, exerciseId) {
        const dayPlan = workoutPlan[day];
        const filteredExercises = dayPlan.exercises.filter(exercise => exercise.id !== exerciseId);

        return {
            ...workoutPlan,
            [day]: {
                ...dayPlan,
                exercises: filteredExercises
            }
        };
    }

    /**
     * Resets a specific day to its initial state
     * @param {WorkoutPlan} workoutPlan - Current workout plan
     * @param {string} day - Day to reset
     * @returns {WorkoutPlan} Updated workout plan
     */
    resetDay(workoutPlan, day) {
        const initialPlan = this.getInitialPlan();
        return {
            ...workoutPlan,
            [day]: initialPlan[day]
        };
    }

    /**
     * Gets workout completion statistics
     * @param {WorkoutPlan} workoutPlan - Workout plan to analyze
     * @returns {Object} Completion statistics
     */
    getWorkoutStats(workoutPlan) {
        const allExercises = Object.values(workoutPlan)
            .flatMap(day => day.exercises);
        
        return ExerciseService.getCompletionStats(allExercises);
    }

    /**
     * Updates muscle groups for a specific day
     * @param {WorkoutPlan} workoutPlan - Current workout plan
     * @param {string} day - Day to update
     * @param {string[]} muscleGroups - New muscle groups
     * @returns {WorkoutPlan} Updated workout plan
     */
    updateDayMuscleGroups(workoutPlan, day, muscleGroups) {
        const muscleGroupName = muscleGroups.length > 0 
            ? muscleGroups.join(' & ') 
            : 'Rest';

        return {
            ...workoutPlan,
            [day]: {
                ...workoutPlan[day],
                name: muscleGroupName
            }
        };
    }
}

// Create and export singleton instance
const workoutService = new WorkoutService();

export default workoutService;