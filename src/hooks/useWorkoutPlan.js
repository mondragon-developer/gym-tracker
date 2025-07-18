/**
 * Custom hook for workout plan management
 * Follows Single Responsibility Principle by handling only workout state logic
 */

import { useState, useEffect } from 'react';
import workoutService from '../services/workoutService.js';

/**
 * Custom hook for managing workout plan state
 * @returns {Object} Workout plan state and actions
 */
const useWorkoutPlan = () => {
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize workout plan from storage
  useEffect(() => {
    try {
      const plan = workoutService.getPlan();
      setWorkoutPlan(plan);
    } catch (err) {
      setError('Failed to load workout plan');
      console.error('Error loading workout plan:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-save when workout plan changes
  useEffect(() => {
    if (workoutPlan && !isLoading) {
      try {
        workoutService.savePlan(workoutPlan);
      } catch (err) {
        setError('Failed to save workout plan');
        console.error('Error saving workout plan:', err);
      }
    }
  }, [workoutPlan, isLoading]);

  /**
   * Updates a specific day in the workout plan
   * @param {string} day - Day to update
   * @param {Object} dayData - New day data
   */
  const updateDay = (day, dayData) => {
    setWorkoutPlan(prev => ({ ...prev, [day]: dayData }));
  };

  /**
   * Adds an exercise to a specific day
   * @param {string} day - Day to add exercise to
   * @param {Object} exerciseData - Exercise data
   */
  const addExercise = (day, exerciseData) => {
    const updatedPlan = workoutService.addExerciseToDay(workoutPlan, day, exerciseData);
    setWorkoutPlan(updatedPlan);
  };

  /**
   * Updates an exercise in the workout plan
   * @param {string} day - Day containing the exercise
   * @param {string} exerciseId - Exercise ID to update
   * @param {Object} updates - Updates to apply
   */
  const updateExercise = (day, exerciseId, updates) => {
    const updatedPlan = workoutService.updateExercise(workoutPlan, day, exerciseId, updates);
    setWorkoutPlan(updatedPlan);
  };

  /**
   * Removes an exercise from a day
   * @param {string} day - Day to remove exercise from
   * @param {string} exerciseId - Exercise ID to remove
   */
  const removeExercise = (day, exerciseId) => {
    const updatedPlan = workoutService.removeExercise(workoutPlan, day, exerciseId);
    setWorkoutPlan(updatedPlan);
  };

  /**
   * Resets a specific day to its initial state
   * @param {string} day - Day to reset
   */
  const resetDay = (day) => {
    const updatedPlan = workoutService.resetDay(workoutPlan, day);
    setWorkoutPlan(updatedPlan);
  };

  /**
   * Resets the entire workout plan
   */
  const resetWeek = () => {
    const initialPlan = workoutService.getInitialPlan();
    setWorkoutPlan(initialPlan);
  };

  /**
   * Updates muscle groups for a specific day
   * @param {string} day - Day to update
   * @param {string[]} muscleGroups - New muscle groups
   */
  const updateDayMuscleGroups = (day, muscleGroups) => {
    const updatedPlan = workoutService.updateDayMuscleGroups(workoutPlan, day, muscleGroups);
    setWorkoutPlan(updatedPlan);
  };

  /**
   * Gets workout completion statistics
   * @returns {Object} Completion stats
   */
  const getWorkoutStats = () => {
    return workoutPlan ? workoutService.getWorkoutStats(workoutPlan) : null;
  };

  return {
    // State
    workoutPlan,
    isLoading,
    error,
    
    // Actions
    updateDay,
    addExercise,
    updateExercise,
    removeExercise,
    resetDay,
    resetWeek,
    updateDayMuscleGroups,
    
    // Computed
    getWorkoutStats
  };
};

export default useWorkoutPlan;