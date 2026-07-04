/**
 * Admin Service - Cross-user operations for administrators
 * Isolated from the per-user storage services (Single Responsibility).
 * Every query targets an explicit userId — the database's admin RLS policies
 * (is_admin() in supabase/admin.sql) are what actually authorise the access,
 * so a non-admin calling these simply gets empty results or errors.
 */

import { supabase } from '../lib/supabase';

class AdminService {
  /**
   * Lists all registered users with their roles
   * @returns {Promise<Array<{id: string, email: string, role: string, createdAt: string}>>}
   */
  async listUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(row => ({
      id: row.id,
      email: row.email ?? '',
      role: row.role ?? 'user',
      createdAt: row.created_at
    }));
  }

  /**
   * Changes a user's role
   * @param {string} userId - Target user
   * @param {'user'|'admin'} role - New role
   */
  async setUserRole(userId, role) {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    if (error) throw error;
  }

  /**
   * Gets a target user's workout plan
   * @param {string} userId - Target user
   * @returns {Promise<Object|null>} The plan blob, or null if none saved yet
   */
  async getWorkoutPlan(userId) {
    const { data, error } = await supabase
      .from('workout_plans')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data?.data ?? null;
  }

  /**
   * Saves a target user's workout plan
   * @param {string} userId - Target user
   * @param {Object} workoutPlan - Plan blob to save
   */
  async saveWorkoutPlan(userId, workoutPlan) {
    const { error } = await supabase
      .from('workout_plans')
      .upsert(
        {
          user_id: userId,
          data: workoutPlan,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );
    if (error) throw error;
  }

  /**
   * Deletes a target user's cloud workout plan
   * (their app falls back to the default plan on next load)
   * @param {string} userId - Target user
   */
  async deleteWorkoutPlan(userId) {
    const { error } = await supabase
      .from('workout_plans')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  }
}

// Export singleton instance
export const adminService = new AdminService();

// Export class for testing
export { AdminService };
