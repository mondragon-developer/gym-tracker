import { supabase } from './supabaseClient';

/**
 * Returns the id of the currently signed-in user, or throws if nobody is
 * signed in. Reads from the locally cached session (no network round-trip in
 * the common case). We include this user_id explicitly on writes so Postgres
 * upserts resolve their ON CONFLICT target reliably, even though the DB also
 * defaults user_id to auth.uid().
 */
export async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const userId = data.session?.user?.id;
  if (!userId) throw new Error('Not authenticated — no active Supabase session.');
  return userId;
}
