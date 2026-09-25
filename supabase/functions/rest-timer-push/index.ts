// Supabase Edge Function: rest-timer-push
//
// Sends the end-of-rest notification from the server. iOS freezes a web
// app's scripts once it leaves the screen, so a notification raised by the
// page never fires there; a Web Push sent at the end time does, for an app
// added to the home screen (iOS 16.4+). Android gets the same push.
//
//   POST { action: 'schedule', delayMs, subscription, title, body } -> { id }
//     Stores a row, answers at once, then waits in the background until
//     endsAt and sends if the row is still there.
//   POST { action: 'cancel', id } -> { ok }
//     Pause, Reset or a new rest delete the row so nothing is sent.
//
// Required secrets (supabase secrets set ...):
//   VAPID_PUBLIC_KEY   same key as src/constants/push.js
//   VAPID_PRIVATE_KEY  its private half, never committed
//   VAPID_SUBJECT      mailto: contact for the push services
//
// Table: supabase/rest-timer-push.sql. See README.md in this folder.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { parseSchedule } from './pushRequest.js';

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Rows whose worker was stopped before sending would otherwise stay.
const STALE_MS = 10 * 60 * 1000;
// Each schedule holds a worker for up to 140 s; a normal user starts a few
// rests a minute at most.
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 6;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
  const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
  const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT');
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    return json(500, { error: 'Function is not configured (missing secrets)' });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json(401, { error: 'Missing authorization' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await anon.auth.getUser();
  if (userError || !user) return json(401, { error: 'Invalid session' });

  const service = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  if (body.action === 'cancel') {
    if (typeof body.id !== 'string') return json(400, { error: 'id required' });
    await service.from('rest_timer_pushes').delete().eq('id', body.id).eq('user_id', user.id);
    return json(200, { ok: true });
  }

  if (body.action !== 'schedule') return json(400, { error: 'Unknown action' });

  const parsed = parseSchedule(body);
  if (!parsed.ok) return json(400, { error: parsed.error });
  const { endsAt, delay, subscription, title, body: text } = parsed.value;

  // The app cancels the previous rest's id itself (Pause, Reset, a new
  // rest, a late answer). Deleting by endpoint here would let a slow older
  // request remove a newer rest's row.
  await service.from('rest_timer_pushes').delete()
    .lt('created_at', new Date(Date.now() - STALE_MS).toISOString());

  const { count } = await service
    .from('rest_timer_pushes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', new Date(Date.now() - RATE_WINDOW_MS).toISOString());
  if ((count ?? 0) >= RATE_LIMIT) return json(429, { error: 'Too many rests scheduled' });

  const { data: row, error: insertError } = await service
    .from('rest_timer_pushes')
    .insert({ user_id: user.id, endpoint: subscription.endpoint, ends_at: new Date(endsAt).toISOString() })
    .select('id')
    .single();
  if (insertError || !row) return json(500, { error: 'Could not schedule' });

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const send = async () => {
    await new Promise(resolve => setTimeout(resolve, delay));
    // Deleting the row is the claim: if Pause or a new rest removed it
    // first, nothing comes back and nothing is sent.
    const { data: claimed } = await service
      .from('rest_timer_pushes')
      .delete()
      .eq('id', row.id)
      .select('id');
    if (!claimed || claimed.length === 0) return;
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({ title, body: text, tag: 'rest-timer' }),
        { TTL: 60, urgency: 'high' },
      );
    } catch (err) {
      console.error('push failed', (err as { statusCode?: number }).statusCode ?? err);
    }
  };
  EdgeRuntime.waitUntil(send());

  return json(200, { id: row.id });
});
