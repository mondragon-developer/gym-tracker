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

  return {
    workoutPlan,
    isLoading,
    error,
    updateDay,
    addExercise,
    resetDay,
    resetWeek
  };
};

export default useWorkoutPlan;