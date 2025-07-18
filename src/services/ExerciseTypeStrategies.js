/**
 * Exercise Type Strategies - Implements Strategy Pattern for different exercise types
 * Follows Open/Closed Principle by allowing new types without modifying existing code
 */

/**
 * Base Exercise Type Strategy Interface
 */
class ExerciseTypeStrategy {
  /**
   * Gets the display label for sets/reps field
   * @returns {string} Field label
   */
  getSetsLabel() {
    throw new Error('getSetsLabel must be implemented');
  }

  /**
   * Gets the display label for reps field
   * @returns {string} Field label
   */
  getRepsLabel() {
    throw new Error('getRepsLabel must be implemented');
  }

  /**
   * Validates exercise data for this type
   * @param {Object} exerciseData - Exercise data to validate
   * @returns {{isValid: boolean, errors: string[]}} Validation result
   */
  validate(exerciseData) {
    throw new Error('validate must be implemented');
  }

  /**
   * Gets default values for this exercise type
   * @returns {Object} Default values
   */
  getDefaults() {
    throw new Error('getDefaults must be implemented');
  }

  /**
   * Whether this exercise type uses weight tracking
   * @returns {boolean} True if uses weight
   */
  usesWeight() {
    throw new Error('usesWeight must be implemented');
  }

  /**
   * Whether this exercise type uses reps
   * @returns {boolean} True if uses reps
   */
  usesReps() {
    throw new Error('usesReps must be implemented');
  }

  /**
   * Formats display text for the exercise
   * @param {Object} exercise - Exercise data
   * @returns {string} Formatted display text
   */
  formatDisplay(exercise) {
    throw new Error('formatDisplay must be implemented');
  }
}

/**
 * Strength Training Exercise Strategy
 */
class StrengthExerciseStrategy extends ExerciseTypeStrategy {
  getSetsLabel() {
    return 'Sets';
  }

  getRepsLabel() {
    return 'Reps';
  }

  validate(exerciseData) {
    const errors = [];
    
    if (!exerciseData.sets || exerciseData.sets < 1) {
      errors.push('Sets must be at least 1');
    }
    
    if (!exerciseData.reps || exerciseData.reps < 1) {
      errors.push('Reps must be at least 1');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getDefaults() {
    return {
      sets: '3',
      reps: '8-12',
      weight: '',
      effectiveSets: ''
    };
  }

  usesWeight() {
    return true;
  }

  usesReps() {
    return true;
  }

  formatDisplay(exercise) {
    const weight = exercise.weight ? ` @ ${exercise.weight}lbs` : '';
    return `${exercise.sets} sets × ${exercise.reps} reps${weight}`;
  }
}

/**
 * Cardio Exercise Strategy
 */
class CardioExerciseStrategy extends ExerciseTypeStrategy {
  getSetsLabel() {
    return 'Duration (min)';
  }

  getRepsLabel() {
    return 'Intensity';
  }

  validate(exerciseData) {
    const errors = [];
    
    if (!exerciseData.sets || exerciseData.sets < 1 || exerciseData.sets > 120) {
      errors.push('Duration must be between 1 and 120 minutes');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getDefaults() {
    return {
      sets: '30', // Duration in minutes
      reps: '', // Not used for cardio
      weight: '', // Not used for cardio
      effectiveSets: '' // Actual minutes completed
    };
  }

  usesWeight() {
    return false;
  }

  usesReps() {
    return false;
  }

  formatDisplay(exercise) {
    const completed = exercise.effectiveSets ? ` (${exercise.effectiveSets} min completed)` : '';
    return `${exercise.sets} minutes${completed}`;
  }
}

/**
 * Flexibility/Stretching Exercise Strategy
 */
class FlexibilityExerciseStrategy extends ExerciseTypeStrategy {
  getSetsLabel() {
    return 'Hold Time (sec)';
  }

  getRepsLabel() {
    return 'Repetitions';
  }

  validate(exerciseData) {
    const errors = [];
    
    if (!exerciseData.sets || exerciseData.sets < 10 || exerciseData.sets > 300) {
      errors.push('Hold time must be between 10 and 300 seconds');
    }
    
    if (!exerciseData.reps || exerciseData.reps < 1 || exerciseData.reps > 10) {
      errors.push('Repetitions must be between 1 and 10');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getDefaults() {
    return {
      sets: '30', // Hold time in seconds
      reps: '3', // Number of repetitions
      weight: '', // Not used for flexibility
      effectiveSets: ''
    };
  }

  usesWeight() {
    return false;
  }

  usesReps() {
    return true;
  }

  formatDisplay(exercise) {
    return `${exercise.reps} × ${exercise.sets}s holds`;
  }
}

/**
 * Exercise Type Factory - Creates appropriate strategy based on exercise type
 */
class ExerciseTypeFactory {
  static strategies = {
    'strength': new StrengthExerciseStrategy(),
    'cardio': new CardioExerciseStrategy(),
    'flexibility': new FlexibilityExerciseStrategy()
  };

  /**
   * Gets strategy for exercise type
   * @param {string} type - Exercise type
   * @returns {ExerciseTypeStrategy} Strategy instance
   */
  static getStrategy(type) {
    const strategy = this.strategies[type.toLowerCase()];
    if (!strategy) {
      throw new Error(`Unknown exercise type: ${type}`);
    }
    return strategy;
  }

  /**
   * Gets strategy for exercise based on muscle group
   * @param {string} muscleGroup - Muscle group from database
   * @returns {ExerciseTypeStrategy} Strategy instance
   */
  static getStrategyByMuscleGroup(muscleGroup) {
    if (muscleGroup === 'Cardio') {
      return this.getStrategy('cardio');
    }
    if (muscleGroup === 'Flexibility') {
      return this.getStrategy('flexibility');
    }
    return this.getStrategy('strength');
  }

  /**
   * Registers a new exercise type strategy
   * @param {string} type - Exercise type name
   * @param {ExerciseTypeStrategy} strategy - Strategy instance
   */
  static registerStrategy(type, strategy) {
    this.strategies[type.toLowerCase()] = strategy;
  }

  /**
   * Gets all available exercise types
   * @returns {string[]} Array of exercise type names
   */
  static getAvailableTypes() {
    return Object.keys(this.strategies);
  }
}

export {
  ExerciseTypeStrategy,
  StrengthExerciseStrategy,
  CardioExerciseStrategy,
  FlexibilityExerciseStrategy,
  ExerciseTypeFactory
};