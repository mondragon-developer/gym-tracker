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
   * Gets the caller's workout plan row, with the version stamp callers need
   * for conflict-checked saves.
   *
   * Throws on real failures (network, RLS, auth) instead of returning null:
   * the hook treats null as "no cloud plan yet" and migrates local data up,
   * so a swallowed error here would overwrite the user's real plan.
   * @returns {Promise<{data: Object, updatedAt: string}|null>} null when no row exists
   */
  async getWorkoutPlanRecord() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('No authenticated user found');

    const { data, error } = await supabase
      .from('workout_plans')
      .select('data, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return { data: data.data, updatedAt: data.updated_at };
  }

  /**
   * Gets workout plan from Supabase
   * @returns {Promise<Object|null>} Workout plan or null
   */
  async getWorkoutPlan() {
    try {
      const record = await this.getWorkoutPlanRecord();
      return record?.data ?? null;
    } catch (error) {
      console.error('Error getting workout plan:', error);
      return null;
    }
  }

  /**
   * Saves workout plan to Supabase.
   *
   * With expectedUpdatedAt the write only lands when the row still carries
   * that stamp (optimistic concurrency). Zero rows updated means someone else
   * (a trainer, another device) saved since we loaded, or the row was deleted;
   * the caller decides whether to reload or overwrite.
   * @param {Object} workoutPlan - Workout plan to save
   * @param {{expectedUpdatedAt?: string|null}} [options]
   * @returns {Promise<{ok: true, updatedAt: string}|{ok: false, reason: 'unauthenticated'|'conflict'|'error', error?: Error}>}
   */
  async saveWorkoutPlan(workoutPlan, { expectedUpdatedAt = null } = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.warn('No authenticated user found');
        return { ok: false, reason: 'unauthenticated' };
      }

      const now = new Date().toISOString();

      if (expectedUpdatedAt) {
        const { data, error } = await supabase
          .from('workout_plans')
          .update({ data: workoutPlan, updated_at: now })
          .eq('user_id', user.id)
          .eq('updated_at', expectedUpdatedAt)
          .select('updated_at');

        if (error) throw error;
        if (!data || data.length === 0) {
          return { ok: false, reason: 'conflict' };
        }
        return { ok: true, updatedAt: data[0].updated_at };
      }

      const { data, error } = await supabase
        .from('workout_plans')
        .upsert({
          user_id: user.id,
          data: workoutPlan,
          updated_at: now
        }, {
          onConflict: 'user_id'
        })
        .select('updated_at');

      if (error) throw error;

      return { ok: true, updatedAt: data?.[0]?.updated_at ?? now };
    } catch (error) {
      console.error('Error saving workout plan:', error);
      return { ok: false, reason: 'error', error };
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
