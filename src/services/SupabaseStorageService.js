/**
 * Supabase Storage Service - Cloud-based data persistence
 * Implements cloud storage using Supabase database
 */

import { supabase } from '../lib/supabase';

/**
 * Supabase storage implementation
 * Stores workout data in the cloud tied to authenticated users
 */
class SupabaseStorageService {
  /**
   * Gets workout plan from Supabase
   * @returns {Promise<Object|null>} Workout plan or null
   */
  async getWorkoutPlan() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.warn('No authenticated user found');
        return null;
      }

      const { data, error } = await supabase
        .from('workout_plans')
        .select('data')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no workout plan exists yet, return null (not an error)
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data?.data || null;
    } catch (error) {
      console.error('Error getting workout plan:', error);
      return null;
    }
  }

  /**
   * Saves workout plan to Supabase
   * @param {Object} workoutPlan - Workout plan to save
   * @returns {Promise<boolean>} Success status
   */
  async saveWorkoutPlan(workoutPlan) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.warn('No authenticated user found');
        return false;
      }

      const { error } = await supabase
        .from('workout_plans')
        .upsert({
          user_id: user.id,
          data: workoutPlan,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error saving workout plan:', error);
      return false;
    }
  }

  /**
   * Removes workout plan from Supabase
   * @returns {Promise<boolean>} Success status
   */
  async removeWorkoutPlan() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.warn('No authenticated user found');
        return false;
      }

      const { error } = await supabase
        .from('workout_plans')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error removing workout plan:', error);
      return false;
    }
  }

  /**
   * Gets user preferences from Supabase
   * @returns {Promise<Object|null>} User preferences or null
   */
  async getUserPreferences() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.warn('No authenticated user found');
        return null;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no preferences exist yet, return null (not an error)
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data?.preferences || null;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  /**
   * Saves user preferences to Supabase
   * @param {Object} preferences - Preferences to save
   * @returns {Promise<boolean>} Success status
   */
  async saveUserPreferences(preferences) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.warn('No authenticated user found');
        return false;
      }

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferences: preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error saving user preferences:', error);
      return false;
    }
  }

  /**
   * Migrates data from localStorage to Supabase
   * @param {Object} localWorkoutPlan - Workout plan from localStorage
   * @param {Object} localPreferences - Preferences from localStorage
   * @returns {Promise<boolean>} Success status
   */
  async migrateFromLocalStorage(localWorkoutPlan, localPreferences) {
    try {
      const promises = [];

      if (localWorkoutPlan) {
        promises.push(this.saveWorkoutPlan(localWorkoutPlan));
      }

      if (localPreferences) {
        promises.push(this.saveUserPreferences(localPreferences));
      }

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
      return false;
    }
  }
}

// Export singleton instance
export const supabaseStorageService = new SupabaseStorageService();

// Export class for testing
export { SupabaseStorageService };
