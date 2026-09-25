// Supabase Edge Function: delete-account
//
// Lets a signed-in user delete their own account from the profile menu.
// Browsers cannot remove an auth user, so the app calls this function,
// which:
//   1. authenticates the caller from their JWT (the only account it can
//      ever delete is the caller's own; no id is read from the request),
//   2. refuses admins, so the last admin cannot lock everyone out; an admin
//      is demoted from the dashboard first,
//   3. deletes the auth user. Every table that holds user data references
//      auth.users or profiles with ON DELETE CASCADE (profiles, workout_plans,
//      user_preferences, trainer_clients, trainer_invites, rest_timer_pushes),
//      and profiles.trainer_id is SET NULL, so one delete removes it all.
//
// No secrets beyond the defaults (SUPABASE_URL, SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY). Deploy: supabase functions deploy delete-account

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json(401, { error: 'Missing authorization' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await anon.auth.getUser();
  if (userError || !user) return json(401, { error: 'Invalid session' });

  // The typed word is checked in the app; requiring it here as well means a
  // stray request with a valid session cannot delete by accident.
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (body.confirm !== 'DELETE') return json(400, { error: 'Confirmation missing' });

  const service = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role === 'admin') return json(403, { error: 'admin' });

  const { error: deleteError } = await service.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('delete failed', deleteError.message);
    return json(500, { error: 'Could not delete the account' });
  }
  return json(200, { ok: true });
});
