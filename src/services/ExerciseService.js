/**
 * Exercise Service - Handles all exercise-related business logic
 * Follows Single Responsibility Principle by focusing solely on exercise operations
 */

import { EXERCISE_DATABASE } from '../constants/index.js';
import { ExerciseTypeFactory } from './ExerciseTypeStrategies.js';

/**
 * @typedef {Object} Exercise
 * @property {string} id - Unique identifier
 * @property {number|null} dbId - Database ID for library exercises
 * @property {string} name - Exercise name
 * @property {string} sets - Target sets OR duration for cardio
 * @property {string} reps - Target reps (empty for cardio)
 * @property {string} weight - Weight used (empty for cardio)
 * @property {string} effectiveSets - Completed sets OR minutes for cardio
 * @property {'incomplete'|'completed'|'skipped'} status - Exercise status
 */

/**
 * Exercise type enum
 */
const ExerciseType = {
  STRENGTH: 'strength',
  CARDIO: 'cardio'
};

/**
 * Exercise status enum
 */
const ExerciseStatus = {
  INCOMPLETE: 'incomplete',
  COMPLETED: 'completed',
  SKIPPED: 'skipped'
};

class ExerciseService {
  /**
   * Gets the exercise type strategy for an exercise
   * @param {Exercise} exercise - The exercise to check
   * @returns {import('./ExerciseTypeStrategies.js').ExerciseTypeStrategy} Strategy instance
   */
  static getExerciseStrategy(exercise) {
    if (!exercise.dbId) {
      return ExerciseTypeFactory.getStrategy('strength'); // Default for custom exercises
    }
    
    const dbExercise = EXERCISE_DATABASE.find(ex => ex.id === exercise.dbId);
    return ExerciseTypeFactory.getStrategyByMuscleGroup(dbExercise?.muscleGroup || 'Strength');
  }

  /**
   * Determines if an exercise is cardio type
   * @param {Exercise} exercise - The exercise to check
   * @returns {boolean} True if cardio exercise
   */
  static isCardioExercise(exercise) {
    const strategy = this.getExerciseStrategy(exercise);
    return !strategy.usesWeight() && !strategy.usesReps();
  }

  /**
   * Gets the exercise type
   * @param {Exercise} exercise - The exercise to check
   * @returns {string} Exercise type (strength or cardio)
   */
  static getExerciseType(exercise) {
    return this.isCardioExercise(exercise) ? ExerciseType.CARDIO : ExerciseType.STRENGTH;
  }

  /**
   * Creates a new exercise with proper defaults
   * @param {Object} exerciseData - Exercise data from form
   * @param {string} exerciseData.name - Exercise name
   * @param {number|null} exerciseData.dbId - Database ID if from library
   * @param {string} exerciseData.sets - Sets or duration
   * @param {string} exerciseData.reps - Reps (empty for cardio)
   * @returns {Exercise} New exercise object
   */
  static createExercise({ name, dbId = null, sets, reps = '' }) {
    return {
      id: `ex_${Date.now()}`,
      dbId,
      name,
      sets,
      reps,
      weight: '',
      effectiveSets: '',
      status: ExerciseStatus.INCOMPLETE
    };
  }

  /**
   * Updates an exercise with new data
   * @param {Exercise} exercise - Original exercise
   * @param {Object} updates - Fields to update
   * @returns {Exercise} Updated exercise
   */
  static updateExercise(exercise, updates) {
    return { ...exercise, ...updates };
  }

  /**
   * Validates exercise data using appropriate strategy
   * @param {Object} exerciseData - Exercise data to validate
   * @returns {{isValid: boolean, errors: string[]}} Validation result
   */
  static validateExercise(exerciseData) {
    const errors = [];
    
    // Common validation
    if (!exerciseData.name?.trim()) {
      errors.push('Exercise name is required');
    }
    
    // Get strategy for type-specific validation
    let strategy;
    if (exerciseData.dbId) {
      const dbExercise = EXERCISE_DATABASE.find(ex => ex.id === exerciseData.dbId);
      strategy = ExerciseTypeFactory.getStrategyByMuscleGroup(dbExercise?.muscleGroup || 'Strength');
    } else {
      strategy = ExerciseTypeFactory.getStrategy('strength'); // Default for custom exercises
    }
    
    // Type-specific validation
    const typeValidation = strategy.validate(exerciseData);
    errors.push(...typeValidation.errors);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Gets available exercises by muscle group
   * @param {string|null} muscleGroup - Muscle group to filter by (null for all)
   * @returns {Array} Filtered exercises
   */
  static getExercisesByMuscleGroup(muscleGroup) {
    if (!muscleGroup || muscleGroup === 'All') {
      return EXERCISE_DATABASE;
    }
    
    return EXERCISE_DATABASE.filter(ex => ex.muscleGroup === muscleGroup);
  }

  /**
   * Searches exercises by name
   * @param {string} searchTerm - Search term
   * @param {string|null} muscleGroup - Optional muscle group filter
   * @returns {Array} Matching exercises
   */
  static searchExercises(searchTerm, muscleGroup = null) {
    let exercises = this.getExercisesByMuscleGroup(muscleGroup);
    
    if (!searchTerm?.trim()) {
      return exercises;
    }
    
    const term = searchTerm.toLowerCase();
    return exercises.filter(exercise => 
      exercise.name.toLowerCase().includes(term)
    );
  }

  /**
   * Gets exercise completion statistics
   * @param {Exercise[]} exercises - Array of exercises
   * @returns {Object} Completion stats
   */
  static getCompletionStats(exercises) {
    const total = exercises.length;
    const completed = exercises.filter(ex => ex.status === ExerciseStatus.COMPLETED).length;
    const skipped = exercises.filter(ex => ex.status === ExerciseStatus.SKIPPED).length;
    const incomplete = exercises.filter(ex => ex.status === ExerciseStatus.INCOMPLETE).length;
    
    return {
      total,
      completed,
      skipped,
      incomplete,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    };
  }

  /**
   * Formats display text for an exercise
   * @param {Exercise} exercise - Exercise to format
   * @returns {string} Formatted display text
   */
  static formatExerciseDisplay(exercise) {
    const strategy = this.getExerciseStrategy(exercise);
    return strategy.formatDisplay(exercise);
  }

  /**
   * Gets default values for an exercise type
   * @param {string} muscleGroup - Muscle group from database
   * @returns {Object} Default values
   */
  static getExerciseDefaults(muscleGroup) {
    const strategy = ExerciseTypeFactory.getStrategyByMuscleGroup(muscleGroup);
    return strategy.getDefaults();
  }

  /**
   * Gets field labels for an exercise
   * @param {Exercise} exercise - Exercise to get labels for
   * @returns {Object} Field labels
   */
  static getExerciseLabels(exercise) {
    const strategy = this.getExerciseStrategy(exercise);
    return {
      setsLabel: strategy.getSetsLabel(),
      repsLabel: strategy.getRepsLabel(),
      usesWeight: strategy.usesWeight(),
      usesReps: strategy.usesReps()
    };
  }
}

export default ExerciseService;
export { ExerciseType, ExerciseStatus };