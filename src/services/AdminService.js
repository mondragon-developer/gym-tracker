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
   * Lists the users visible to the caller: every profile for the super admin,
   * or (via RLS) just their own profile + assigned users for a trainer.
   * @returns {Promise<Array<{id: string, email: string, role: string, trainerId: string|null, inviteCode: string|null, createdAt: string}>>}
   */
  async listUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, trainer_id, invite_code, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(row => ({
      id: row.id,
      email: row.email ?? '',
      role: row.role ?? 'user',
      trainerId: row.trainer_id ?? null,
      inviteCode: row.invite_code ?? null,
      createdAt: row.created_at
    }));
  }

  /**
   * Changes a user's role (super admin only, enforced by RLS).
   * Promoting to trainer auto-generates their invite code server-side.
   * @param {string} userId - Target user
   * @param {'user'|'trainer'|'admin'} role - New role
   */
  async setUserRole(userId, role) {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    if (error) throw error;
  }

  /**
   * Assigns a user to a trainer, or makes them individual again
   * (super admin only, enforced by RLS)
   * @param {string} userId - Target user
   * @param {string|null} trainerId - Trainer's profile id, or null to unassign
   */
  async assignTrainer(userId, trainerId) {
    const { error } = await supabase
      .from('profiles')
      .update({ trainer_id: trainerId })
      .eq('id', userId);
    if (error) throw error;
  }

  /**
   * Creates a single-use trainer invitation (super admin only, RLS-enforced)
   * @param {string} createdBy - The super admin's profile id
   * @returns {Promise<string>} The generated invite code
   */
  async createTrainerInvite(createdBy) {
    const code = (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '')
      : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    ).slice(0, 10).toUpperCase();

    const { error } = await supabase
      .from('trainer_invites')
      .insert({ code, created_by: createdBy });
    if (error) throw error;
    return code;
  }

  /**
   * Lists pending (unused) trainer invitations, newest first
   * @returns {Promise<Array<{code: string, createdAt: string}>>}
   */
  async listTrainerInvites() {
    const { data, error } = await supabase
      .from('trainer_invites')
      .select('code, created_at')
      .is('used_by', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(row => ({ code: row.code, createdAt: row.created_at }));
  }

  /**
   * Revokes a pending trainer invitation
   * @param {string} code - Invite code to delete
   */
  async revokeTrainerInvite(code) {
    const { error } = await supabase
      .from('trainer_invites')
      .delete()
      .eq('code', code);
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
