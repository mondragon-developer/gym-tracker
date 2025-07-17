/**
 * @typedef {object} Exercise
 * @property {string} id - A unique identifier for the exercise instance in the plan (e.g., 'ex_1678886400000').
 * @property {number|null} dbId - The ID from the original exercise database, if it exists.
 * @property {string} name - The name of the exercise.
 * @property {string} sets - The target number of sets (e.g., "3").
 * @property {string} reps - The target rep range (e.g., "8-12").
 * @property {string} weight - The weight used for the exercise.
 * @property {string} effectiveSets - The actual number of sets completed.
 * @property {'incomplete' | 'completed' | 'skipped'} status - The completion status of the exercise.
 */

/**
 * @typedef {object} DayPlan
 * @property {string} name - The name of the workout for the day (e.g., 'Chest & Biceps').
 * @property {Exercise[]} exercises - An array of exercises for the day.
 */

/**
 * @typedef {object.<string, DayPlan>} WorkoutPlan
 */

const LOCAL_STORAGE_KEY = 'gymAppWorkoutPlan';

/**
 * The initial default structure of the workout plan.
 * This is used if no plan is found in local storage.
 * @type {WorkoutPlan}
 */
const INITIAL_WORKOUT_PLAN = {
    Monday: { name: "Chest & Biceps", exercises: [
        { id: "ex1", dbId: 1, name: "Barbell Bench Press", sets: "4", reps: "8-10", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex2", dbId: 2, name: "Incline Dumbbell Press", sets: "3", reps: "10-12", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex3", dbId: 38, name: "Barbell Curls", sets: "4", reps: "10-12", weight: "", effectiveSets: "", status: "incomplete" },
    ]},
    Tuesday: { name: "Back & Shoulders", exercises: [
        { id: "ex4", dbId: 9, name: "Pull-ups", sets: "3", reps: "8-12", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex5", dbId: 17, name: "Military Press", sets: "4", reps: "8-10", weight: "", effectiveSets: "", status: "incomplete" },
    ]},
    Wednesday: { name: "Legs & Abs", exercises: [
        { id: "ex6", dbId: 60, name: "Barbell Squats", sets: "4", reps: "8-10", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex7", dbId: 66, name: "Romanian Deadlifts", sets: "3", reps: "10-12", weight: "", effectiveSets: "", status: "incomplete" },
        { id: "ex8", dbId: 57, name: "Cable Crunches", sets: "3", reps: "15-20", weight: "", effectiveSets: "", status: "incomplete" },
    ]},
    Thursday: { name: "Chest & Triceps", exercises: [] },
    Friday: { name: "Back & Biceps", exercises: [] },
    Saturday: { name: "Shoulders & Abs", exercises: [] },
    Sunday: { name: "Rest", exercises: [] },
};


/**
 * Service object for handling workout plan data persistence.
 * This encapsulates all interactions with localStorage.
 */
const workoutService = {
    /**
     * Retrieves the workout plan from local storage.
     * If no plan is found, it returns the initial default plan.
     * @returns {WorkoutPlan} The user's workout plan.
     */
    getPlan: () => {
        try {
            const savedPlan = localStorage.getItem(LOCAL_STORAGE_KEY);
            return savedPlan ? JSON.parse(savedPlan) : INITIAL_WORKOUT_PLAN;
        } catch (error) {
            console.error("Could not load workout plan from localStorage", error);
            return INITIAL_WORKOUT_PLAN;
        }
    },

    /**
     * Saves the provided workout plan to local storage.
     * @param {WorkoutPlan} plan - The workout plan to save.
     */
    savePlan: (plan) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(plan));
        } catch (error) {
            console.error("Could not save workout plan to localStorage", error);
        }
    },

    /**
     * Returns the initial workout plan.
     * @returns {WorkoutPlan}
     */
    getInitialPlan: () => {
        return INITIAL_WORKOUT_PLAN;
    }
};

export default workoutService;