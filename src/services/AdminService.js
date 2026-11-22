/**
 * Admin Service - Cross-user operations for administrators
 * Isolated from the per-user storage services (Single Responsibility).
 * Every query targets an explicit userId — the database's admin RLS policies
 * (is_admin() in supabase/admin.sql) are what actually authorise the access,
 * so a non-admin calling these simply gets empty results or errors.
 */

import { supabase } from '../lib/supabase';
import { INACTIVE_WARN_DAYS } from '../utils/activity.js';

export const ADMIN_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const PROFILE_COLUMNS = 'id, email, role, invite_code, created_at';

const mapProfile = row => ({
  id: row.id,
  email: row.email ?? '',
  role: row.role ?? 'user',
  inviteCode: row.invite_code ?? null,
  createdAt: row.created_at,
  lastActiveAt: row.last_active_at ?? null
});

const emailPattern = value => `%${String(value).trim().slice(0, 254).replace(/[\\%_]/g, '\\$&')}%`;

const pageRange = (page, pageSize) => {
  const start = page * pageSize;
  if (!Number.isSafeInteger(page) || page < 0 || !Number.isInteger(pageSize)
    || pageSize < 1 || pageSize > MAX_PAGE_SIZE || !Number.isSafeInteger(start + pageSize)) {
    throw new RangeError('Invalid administration page.');
  }
  // One extra row establishes whether another page exists without a COUNT query.
  return [start, start + pageSize];
};

class AdminService {
  /**
   * Returns one bounded page of profiles visible through RLS. Filters run on
   * the server before pagination; a trainer's own row is excluded there too.
   * Ordering by creation time and ID keeps rows with equal timestamps stable.
   */
  async listUsers({ page = 0, pageSize = ADMIN_PAGE_SIZE, search = '', onlyInactive = false,
    excludeUserId = null, role = null, signal } = {}) {
    const [start, end] = pageRange(page, pageSize);
    const inactiveBefore = new Date(Date.now() - INACTIVE_WARN_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const queryPage = includeActivity => {
      let query = supabase.from('profiles')
        .select(`${PROFILE_COLUMNS}${includeActivity ? ', last_active_at' : ''}`);
      if (search.trim()) query = query.ilike('email', emailPattern(search));
      if (excludeUserId) query = query.neq('id', excludeUserId);
      if (role) query = query.eq('role', role);
      if (onlyInactive && includeActivity) {
        query = query.or(`last_active_at.is.null,last_active_at.lte.${inactiveBefore}`);
      }
      query = query.order('created_at', { ascending: true })
        .order('id', { ascending: true }).range(start, end);
      return signal ? query.abortSignal(signal) : query;
    };

    let { data, error } = await queryPage(true);
    // Preserve compatibility until account-activity.sql is installed. Missing
    // activity is treated as unknown/inactive, matching the existing display.
    if (error?.code === '42703' && !signal?.aborted) {
      ({ data, error } = await queryPage(false));
    }
    if (error) throw error;
    const rows = data ?? [];
    return { users: rows.slice(0, pageSize).map(mapProfile), hasMore: rows.length > pageSize };
  }

  /** The caller's invite controls must not depend on the current list page. */
  async getUserProfile(userId, { signal } = {}) {
    if (!userId) return null;
    let query = supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle();
    if (signal) query = query.abortSignal(signal);
    const { data, error } = await query;
    if (error) throw error;
    return data ? mapProfile(data) : null;
  }

  /**
   * Loads assignments only for clients displayed on the current page. Related
   * trainer labels avoid downloading the complete trainer directory.
   */
  async listTrainerLinks(clientIds, { signal } = {}) {
    if (!Array.isArray(clientIds) || clientIds.length > MAX_PAGE_SIZE) {
      throw new RangeError('Trainer links require a bounded list of client IDs.');
    }
    if (clientIds.length === 0) return [];
    const ids = [...new Set(clientIds)];
    const rows = [];
    // Each request is bounded, and additional pages prevent the Data API's
    // response limit from silently hiding assignments for visible clients.
    for (let offset = 0; ; offset += MAX_PAGE_SIZE) {
      let query = supabase.from('trainer_clients')
        .select('trainer_id, client_id, trainer:profiles!trainer_clients_trainer_id_fkey(id, email, role)')
        .in('client_id', ids)
        .order('client_id', { ascending: true }).order('trainer_id', { ascending: true })
        .range(offset, offset + MAX_PAGE_SIZE - 1);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query;
      if (error) throw error;
      rows.push(...(data ?? []));
      if (!data || data.length < MAX_PAGE_SIZE) break;
    }
    return rows.map(row => ({
      trainerId: row.trainer_id,
      clientId: row.client_id,
      trainer: row.trainer ? mapProfile(row.trainer) : null
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
   * Links a client to one more trainer (super admin only, enforced by RLS).
   * Linking an already-linked pair is a no-op.
   * @param {string} clientId - Target user
   * @param {string} trainerId - Trainer's profile id
   */
  async addTrainer(clientId, trainerId) {
    const { error } = await supabase
      .from('trainer_clients')
      .upsert({ trainer_id: trainerId, client_id: clientId }, { onConflict: 'trainer_id,client_id', ignoreDuplicates: true });
    if (error) throw error;
  }

  /**
   * Removes one trainer from a client. RLS lets the super admin, that
   * trainer, or the client themselves do this.
   * @param {string} clientId - Target user
   * @param {string} trainerId - Trainer's profile id
   */
  async removeTrainer(clientId, trainerId) {
    const { error } = await supabase
      .from('trainer_clients')
      .delete()
      .match({ trainer_id: trainerId, client_id: clientId });
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
   * Emails the caller's client-invite link via the send-invite Edge Function.
   * Trainer/admin only; the function re-checks the role and builds the URL
   * from the caller's own invite code server-side.
   * @param {string} email - Recipient client email
   * @returns {Promise<Object>} { sent: true } on success
   */
  async sendInviteEmail(email) {
    const { data, error } = await supabase.functions.invoke('send-invite', {
      body: { email }
    });
    if (error) throw error;
    return data;
  }

  /**
   * Gets a target user's workout plan
   * @param {string} userId - Target user
   * @returns {Promise<Object|null>} The plan blob, or null if none saved yet
   */
    async getWorkoutPlan(userId) {
    const record = await this.getWorkoutPlanRecord(userId);
    return record ? record.data : null;
  }

  /**
   * Same as getWorkoutPlan but also returns the row's updated_at, which
   * saveWorkoutPlan uses to refuse overwriting a newer save.
   * @param {string} userId - Target user
   * @returns {Promise<{data: Object, updatedAt: string}|null>}
   */
  async getWorkoutPlanRecord(userId) {
    const { data, error } = await supabase
      .from('workout_plans')
      .select('data, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data ? { data: data.data, updatedAt: data.updated_at } : null;
  }

  /**
   * Saves a target user's workout plan
   * @param {string} userId - Target user
   * @param {Object} workoutPlan - Plan blob to save
   */
    async saveWorkoutPlan(userId, workoutPlan, { expectedUpdatedAt = null, overwrite = false } = {}) {
    const now = new Date().toISOString();
    const row = { user_id: userId, data: workoutPlan, updated_at: now };

    // Mirrors SupabaseStorageService.saveWorkoutPlan: the client may have
    // edited their plan since the trainer opened it, so a save only lands
    // when the row still carries the updated_at the trainer loaded.
    if (expectedUpdatedAt && !overwrite) {
      const { data, error } = await supabase
        .from('workout_plans')
        .update({ data: workoutPlan, updated_at: now })
        .eq('user_id', userId)
        .eq('updated_at', expectedUpdatedAt)
        .select('updated_at');
      if (error) throw error;
      if (!data || data.length === 0) return { ok: false, reason: 'conflict' };
      return { ok: true, updatedAt: data[0].updated_at };
    }

    if (overwrite) {
      const { data, error } = await supabase
        .from('workout_plans')
        .upsert(row, { onConflict: 'user_id' })
        .select('updated_at');
      if (error) throw error;
      return { ok: true, updatedAt: data?.[0]?.updated_at ?? now };
    }

    const { data, error } = await supabase
      .from('workout_plans')
      .insert(row)
      .select('updated_at');
    if (error) {
      // 23505 is Postgres unique_violation: a row appeared since the load.
      if (error.code === '23505') return { ok: false, reason: 'conflict' };
      throw error;
    }
    return { ok: true, updatedAt: data?.[0]?.updated_at ?? now };
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
